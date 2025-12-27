'use server';

import { getClient } from '@/backend/dbConnect';
import { captureException } from '../sentry.server.config';
import {
  validateOrderServer,
  prepareOrderDataFromFormData,
  formatValidationErrors,
  isValidUUID,
  isValidAmount,
} from '@/utils/schemas/schema';
import {
  sanitizeOrderData,
  validateBusinessRules,
  validateSanitizedDataSafety,
  hasInjectionAttempt,
} from '@/utils/sanitizers/orderSanitizer';
import { limitBenewAPI } from '@/backend/rateLimiter';
import { headers } from 'next/headers';

// =============================
// CRÉATION DE COMMANDE
// =============================

/**
 * Crée une nouvelle commande - PRODUCTION-READY
 * Optimisé pour 500 utilisateurs/jour avec support CASH
 *
 * @param {FormData} formData - Données du formulaire
 * @param {string} applicationId - ID de l'application
 * @param {number} applicationFee - Montant de l'application
 * @param {boolean} isCashPayment - Mode CASH ou non
 * @returns {Promise<Object>} - Résultat de la création
 */
export async function createOrder(
  formData,
  applicationId,
  applicationFee,
  isCashPayment = false,
) {
  let client = null;
  const startTime = Date.now();

  try {
    // =============================
    // ÉTAPE 1: RATE LIMITING
    // =============================
    const headersList = headers();
    const rateLimitCheck = await limitBenewAPI('order')({
      headers: headersList,
      url: '/order/create',
      method: 'POST',
    });

    if (rateLimitCheck) {
      return {
        success: false,
        message: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
        code: 'RATE_LIMITED',
      };
    }

    // =============================
    // ÉTAPE 2: VALIDATION PRÉLIMINAIRE
    // =============================

    // Convertir applicationFee en number si c'est une string
    const numericFee =
      typeof applicationFee === 'string'
        ? parseFloat(applicationFee)
        : applicationFee;

    // Vérifier que applicationId et applicationFee sont valides
    if (!isValidUUID(applicationId)) {
      return {
        success: false,
        message: "ID d'application invalide.",
        code: 'INVALID_APPLICATION_ID',
      };
    }

    if (!isValidAmount(numericFee)) {
      return {
        success: false,
        message: 'Montant invalide.',
        code: 'INVALID_AMOUNT',
      };
    }

    // =============================
    // ÉTAPE 3: PRÉPARATION ET SANITIZATION
    // =============================

    const rawData = prepareOrderDataFromFormData(
      formData,
      applicationId,
      numericFee,
      isCashPayment,
    );

    // Détection précoce d'injection
    const dataString = JSON.stringify(rawData);
    if (hasInjectionAttempt(dataString)) {
      captureException(new Error('Injection attempt detected'), {
        tags: { component: 'order_actions', severity: 'high' },
        extra: { applicationId },
      });

      return {
        success: false,
        message: 'Données suspectes détectées.',
        code: 'SECURITY_VIOLATION',
      };
    }

    // Sanitization
    const sanitizationResult = sanitizeOrderData(rawData);
    if (!sanitizationResult.success) {
      return {
        success: false,
        message:
          'Données invalides: ' +
          (sanitizationResult.issues?.join(', ') || 'Erreur'),
        code: 'SANITIZATION_FAILED',
      };
    }

    // =============================
    // ÉTAPE 4: VALIDATION YUP
    // =============================

    const yupValidation = await validateOrderServer(
      sanitizationResult.sanitized,
    );

    if (!yupValidation.success) {
      return {
        success: false,
        message:
          'Validation échouée: ' + formatValidationErrors(yupValidation.errors),
        code: 'VALIDATION_FAILED',
        errors: yupValidation.errors,
      };
    }

    // =============================
    // ÉTAPE 5: VALIDATION MÉTIER
    // =============================

    const businessRulesValidation = validateBusinessRules(yupValidation.data);
    if (!businessRulesValidation.valid) {
      return {
        success: false,
        message:
          'Critères métier non respectés: ' +
          businessRulesValidation.violations.join(', '),
        code: 'BUSINESS_RULES_FAILED',
      };
    }

    // =============================
    // ÉTAPE 6: VÉRIFICATION DE SÉCURITÉ FINALE
    // =============================

    const safetyCheck = validateSanitizedDataSafety(yupValidation.data);
    if (!safetyCheck.safe) {
      captureException(new Error('Security check failed'), {
        tags: { component: 'order_actions', severity: 'critical' },
        extra: { threats: safetyCheck.threats },
      });

      return {
        success: false,
        message: 'Erreur de sécurité détectée.',
        code: 'SAFETY_CHECK_FAILED',
      };
    }

    // =============================
    // ÉTAPE 7: INSERTION EN BASE DE DONNÉES
    // =============================

    client = await getClient();

    // Vérifier que l'application existe et est active
    const appCheck = await client.query(
      'SELECT application_name, application_fee FROM catalog.applications WHERE application_id = $1 AND is_active = true',
      [yupValidation.data.applicationId],
    );

    if (appCheck.rows.length === 0) {
      return {
        success: false,
        message: "L'application sélectionnée n'est pas disponible.",
        code: 'APPLICATION_NOT_FOUND',
      };
    }

    // Vérifier que la plateforme de paiement existe et est active
    const platformCheck = await client.query(
      'SELECT platform_name, is_cash_payment FROM admin.platforms WHERE platform_id = $1 AND is_active = true',
      [yupValidation.data.paymentMethod],
    );

    if (platformCheck.rows.length === 0) {
      return {
        success: false,
        message: "La méthode de paiement sélectionnée n'est pas disponible.",
        code: 'PLATFORM_NOT_FOUND',
      };
    }

    // ✅ VÉRIFICATION COHÉRENCE MODE CASH
    const platformIsCash = platformCheck.rows[0].is_cash_payment;
    if (platformIsCash !== yupValidation.data.isCashPayment) {
      return {
        success: false,
        message: 'Incohérence détectée dans le mode de paiement.',
        code: 'PAYMENT_MODE_MISMATCH',
      };
    }

    // Vérifier le montant (protection contre manipulation)
    const expectedFee = parseFloat(appCheck.rows[0].application_fee);
    if (Math.abs(yupValidation.data.applicationFee - expectedFee) > 0.01) {
      captureException(new Error('Price manipulation attempt'), {
        tags: { component: 'order_actions', severity: 'high' },
        extra: {
          expected: expectedFee,
          received: yupValidation.data.applicationFee,
          applicationId,
        },
      });

      return {
        success: false,
        message: 'Erreur de montant. Veuillez actualiser la page.',
        code: 'PRICE_MISMATCH',
      };
    }

    // ✅ INSERTION - order_client avec [name, email, phone]
    const clientInfo = [
      yupValidation.data.name, // ✅ Un seul champ name
      yupValidation.data.email,
      yupValidation.data.phone,
    ];

    const insertResult = await client.query(
      `INSERT INTO admin.orders (
        order_client, 
        order_platform_id, 
        order_payment_name, 
        order_payment_number, 
        order_application_id, 
        order_price, 
        order_payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING order_id, order_created, order_payment_status`,
      [
        clientInfo,
        yupValidation.data.paymentMethod,
        yupValidation.data.accountName,
        yupValidation.data.accountNumber,
        yupValidation.data.applicationId,
        yupValidation.data.applicationFee,
        'unpaid',
      ],
    );

    const newOrder = insertResult.rows[0];

    if (!newOrder?.order_id) {
      return {
        success: false,
        message: 'Erreur lors de la création de la commande.',
        code: 'INSERT_FAILED',
      };
    }

    // Log du temps de traitement
    const processingTime = Date.now() - startTime;
    if (processingTime > 5000) {
      captureException(new Error('Slow order creation'), {
        tags: { component: 'order_actions', severity: 'warning' },
        extra: { processingTime, orderId: newOrder.order_id },
      });
    }

    return {
      success: true,
      message: 'Commande créée avec succès',
      orderId: newOrder.order_id,
      orderDetails: {
        id: newOrder.order_id,
        status: newOrder.order_payment_status,
        created: newOrder.order_created,
        applicationName: appCheck.rows[0].application_name,
        amount: yupValidation.data.applicationFee,
        platform: platformCheck.rows[0].platform_name,
        isCashPayment: platformIsCash,
      },
    };
  } catch (error) {
    // =============================
    // GESTION D'ERREURS ROBUSTE
    // =============================

    // Log détaillé de l'erreur
    captureException(error, {
      tags: { component: 'order_actions', operation: 'create_order' },
      extra: {
        applicationId,
        applicationFee,
        isCashPayment,
        processingTime: Date.now() - startTime,
      },
    });

    // Messages d'erreur contextualisés
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
    let errorCode = 'SYSTEM_ERROR';

    // Erreurs de base de données
    if (error.code === '23505') {
      // Duplicate key
      errorMessage = 'Cette commande existe déjà.';
      errorCode = 'DUPLICATE_ORDER';
    } else if (error.code === '23503') {
      // Foreign key violation
      errorMessage = 'Référence invalide. Veuillez actualiser la page.';
      errorCode = 'INVALID_REFERENCE';
    } else if (error.code === '23514') {
      // Check constraint violation
      errorMessage = 'Données invalides détectées.';
      errorCode = 'CONSTRAINT_VIOLATION';
    } else if (/timeout|timed out/i.test(error.message)) {
      errorMessage = 'Délai dépassé. Veuillez réessayer.';
      errorCode = 'TIMEOUT';
    } else if (/connection|pool/i.test(error.message)) {
      errorMessage = 'Problème de connexion. Veuillez patienter.';
      errorCode = 'CONNECTION_ERROR';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Erreur de validation des données.';
      errorCode = 'VALIDATION_ERROR';
    }

    return {
      success: false,
      message: errorMessage,
      code: errorCode,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    };
  } finally {
    // =============================
    // NETTOYAGE
    // =============================
    if (client) {
      try {
        await client.release();
      } catch (releaseError) {
        captureException(releaseError, {
          tags: { component: 'order_actions', operation: 'client_release' },
        });
      }
    }
  }
}

// =============================
// CRÉATION DEPUIS OBJET
// =============================

/**
 * Crée une commande depuis un objet (fallback)
 * @param {Object} data - Données de commande
 * @returns {Promise<Object>}
 */
export async function createOrderFromObject(data) {
  try {
    const formData = new FormData();

    // ✅ Mapper avec field NAME
    const fields = [
      'name',
      'email',
      'phone',
      'paymentMethod',
      'accountName',
      'accountNumber',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        formData.append(field, String(data[field]));
      }
    });

    return await createOrder(
      formData,
      data.applicationId,
      data.applicationFee,
      data.isCashPayment || false,
    );
  } catch (error) {
    captureException(error, {
      tags: {
        component: 'order_actions',
        operation: 'create_order_from_object',
      },
    });

    return {
      success: false,
      message: 'Erreur lors du traitement des données.',
      code: 'OBJECT_CONVERSION_ERROR',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    };
  }
}
