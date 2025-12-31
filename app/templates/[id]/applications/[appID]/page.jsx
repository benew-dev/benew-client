// app/templates/[id]/applications/[appID]/page.jsx
// ✅ MODIFICATION 1: Colonnes explicites au lieu de a.*

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import SingleApplication from '@/components/templates/SingleApplication';
import { getClient } from '@/backend/dbConnect';
import {
  captureException,
  captureMessage,
} from '../../../../../sentry.server.config';
import { sanitizeAndValidateUUID } from '@/utils/validation';
import Loading from './loading';

// =============================
// ✅ CONFIGURATION OPTIMISÉE
// =============================
const CONFIG = {
  cache: {
    revalidate: 300,
    errorRevalidate: 60,
  },
  performance: {
    slowQueryThreshold: 1000,
    queryTimeout: 5000,
  },
  retry: {
    maxAttempts: 2,
    baseDelay: 100,
  },
};

// =============================
// ✅ TYPES D'ERREURS
// =============================
const ERROR_TYPES = {
  NOT_FOUND: 'not_found',
  DATABASE_ERROR: 'database_error',
  TIMEOUT: 'timeout',
  CONNECTION_ERROR: 'connection_error',
  VALIDATION_ERROR: 'validation_error',
  UNKNOWN_ERROR: 'unknown_error',
};

// =============================
// ✅ CODES ERREURS POSTGRESQL
// =============================
const PG_ERROR_CODES = {
  CONNECTION_FAILURE: '08001',
  CONNECTION_EXCEPTION: '08000',
  QUERY_CANCELED: '57014',
  UNDEFINED_TABLE: '42P01',
  INSUFFICIENT_PRIVILEGE: '42501',
};

/**
 * ✅ Classification intelligente des erreurs
 */
function classifyError(error) {
  if (!error) {
    return {
      type: ERROR_TYPES.UNKNOWN_ERROR,
      shouldRetry: false,
      httpStatus: 500,
    };
  }

  const code = error.code;
  const message = error.message?.toLowerCase() || '';

  if (
    [
      PG_ERROR_CODES.CONNECTION_FAILURE,
      PG_ERROR_CODES.CONNECTION_EXCEPTION,
    ].includes(code)
  ) {
    return {
      type: ERROR_TYPES.CONNECTION_ERROR,
      shouldRetry: true,
      httpStatus: 503,
      userMessage: 'Service temporairement indisponible.',
    };
  }

  if (code === PG_ERROR_CODES.QUERY_CANCELED || message.includes('timeout')) {
    return {
      type: ERROR_TYPES.TIMEOUT,
      shouldRetry: true,
      httpStatus: 503,
      userMessage: 'La requête a pris trop de temps.',
    };
  }

  if (
    message.includes('not found') ||
    message.includes('introuvable') ||
    message.includes('application not found')
  ) {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      shouldRetry: false,
      httpStatus: 404,
      userMessage: 'Application introuvable.',
    };
  }

  return {
    type: ERROR_TYPES.DATABASE_ERROR,
    shouldRetry: false,
    httpStatus: 500,
    userMessage: 'Erreur lors du chargement.',
  };
}

/**
 * ✅ Promise avec timeout
 */
function withTimeout(promise, timeoutMs, errorMessage = 'Timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(errorMessage);
        timeoutError.name = 'TimeoutError';
        reject(timeoutError);
      }, timeoutMs);
    }),
  ]);
}

/**
 * ✅ Retry logic avec backoff exponentiel
 */
async function executeWithRetry(
  operation,
  maxAttempts = CONFIG.retry.maxAttempts,
) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = classifyError(error);

      if (!errorInfo.shouldRetry || attempt === maxAttempts) {
        throw error;
      }

      const delay = CONFIG.retry.baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      captureMessage(
        `Retry application fetch (attempt ${attempt}/${maxAttempts})`,
        {
          level: 'info',
          tags: { component: 'single_application', retry: true },
          extra: { attempt, maxAttempts, errorType: errorInfo.type },
        },
      );
    }
  }

  throw lastError;
}

/**
 * ✅ Validation robuste des IDs
 */
function validateIds(appId, templateId) {
  const cleanApplicationId = sanitizeAndValidateUUID(appId);
  if (!cleanApplicationId) {
    return {
      isValid: false,
      error: 'Application ID invalide',
      field: 'applicationId',
      errorType: ERROR_TYPES.VALIDATION_ERROR,
    };
  }

  const cleanTemplateId = sanitizeAndValidateUUID(templateId);
  if (!cleanTemplateId) {
    return {
      isValid: false,
      error: 'Template ID invalide',
      field: 'templateId',
      errorType: ERROR_TYPES.VALIDATION_ERROR,
    };
  }

  return {
    isValid: true,
    applicationId: cleanApplicationId,
    templateId: cleanTemplateId,
  };
}

/**
 * ✅ MODIFICATION 1: COLONNES EXPLICITES
 * Récupère les données de l'application avec performance et sécurité maximales
 */
async function getApplicationData(applicationId, templateId) {
  const startTime = performance.now();

  try {
    return await executeWithRetry(async () => {
      const client = await getClient();

      try {
        // ✅ QUERY OPTIMISÉE - Colonnes explicites au lieu de a.*
        const queryPromise = client.query(
          `SELECT 
            -- ✅ Application complète (colonnes explicites)
            a.application_id,
            a.application_name,
            a.application_link,
            a.application_admin_link,
            a.application_description,
            a.application_category,
            a.application_fee,
            a.application_rent,
            a.application_images,
            a.application_other_versions,
            a.application_level,
            a.sales_count as application_sales,
            
            -- ✅ Template parent
            t.template_id,
            t.template_name,
            
            -- ✅ Stats template
            (SELECT COUNT(*) 
             FROM catalog.applications 
             WHERE application_template_id = t.template_id 
               AND is_active = true
            ) as template_total_applications,
            
            -- ✅ Applications similaires (JSON aggregation pour performance)
            (SELECT COALESCE(json_agg(
              json_build_object(
                'application_id', app.application_id,
                'application_name', app.application_name,
                'application_category', app.application_category,
                'application_fee', app.application_fee,
                'application_level', app.application_level,
                'primary_image', app.application_images[1],
                'sales_count', app.sales_count
              ) ORDER BY app.application_level ASC, app.sales_count DESC
            ), '[]'::json)
             FROM catalog.applications app
             WHERE app.application_template_id = $2
               AND app.application_id != $1
               AND app.is_active = true
             LIMIT 6
            ) as related_applications,
            
            -- ✅ Plateformes de paiement (JSON aggregation avec toutes les colonnes)
            (SELECT COALESCE(json_agg(
              json_build_object(
                'platform_id', p.platform_id,
                'platform_name', p.platform_name,
                'is_cash_payment', COALESCE(p.is_cash_payment, false),
                'account_name', p.account_name,
                'account_number', p.account_number,
                'description', p.description
              ) ORDER BY p.platform_name ASC
            ), '[]'::json)
             FROM admin.platforms p
             WHERE p.is_active = true
            ) as platforms
            
          FROM catalog.applications a
          JOIN catalog.templates t 
            ON a.application_template_id = t.template_id
          WHERE a.application_id = $1 
            AND a.application_template_id = $2
            AND a.is_active = true 
            AND t.is_active = true`,
          [applicationId, templateId],
        );

        const result = await withTimeout(
          queryPromise,
          CONFIG.performance.queryTimeout,
          'Database query timeout',
        );

        const queryDuration = performance.now() - startTime;

        if (queryDuration > CONFIG.performance.slowQueryThreshold) {
          captureMessage('Slow application query', {
            level: 'warning',
            tags: { component: 'single_application', performance: true },
            extra: {
              applicationId,
              templateId,
              duration: queryDuration,
              timeout: CONFIG.performance.queryTimeout,
            },
          });
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Application] Query: ${Math.round(queryDuration)}ms (timeout: ${CONFIG.performance.queryTimeout}ms)`,
          );
        }

        if (result.rows.length === 0) {
          return {
            application: null,
            template: null,
            relatedApplications: [],
            platforms: [],
            success: false,
            errorType: ERROR_TYPES.NOT_FOUND,
            httpStatus: 404,
            userMessage: 'Application introuvable.',
          };
        }

        const data = result.rows[0];

        const relatedApps = Array.isArray(data.related_applications)
          ? data.related_applications
          : [];
        const platforms = Array.isArray(data.platforms) ? data.platforms : [];

        const application = {
          application_id: data.application_id,
          application_name: data.application_name,
          application_link: data.application_link,
          application_admin_link: data.application_admin_link,
          application_description: data.application_description,
          application_category: data.application_category,
          application_fee: data.application_fee,
          application_rent: data.application_rent,
          application_images: data.application_images,
          application_other_versions: data.application_other_versions,
          application_level: data.application_level,
          application_sales: data.application_sales,
        };

        const template = {
          template_id: data.template_id,
          template_name: data.template_name,
          template_total_applications: data.template_total_applications,
        };

        return {
          application,
          template,
          relatedApplications: relatedApps,
          platforms,
          success: true,
          queryDuration,
        };
      } finally {
        client.release();
      }
    });
  } catch (error) {
    const errorInfo = classifyError(error);
    const queryDuration = performance.now() - startTime;

    captureException(error, {
      tags: {
        component: 'single_application',
        error_type: errorInfo.type,
        should_retry: errorInfo.shouldRetry.toString(),
        http_status: errorInfo.httpStatus.toString(),
      },
      extra: {
        applicationId,
        templateId,
        queryDuration,
        pgErrorCode: error.code,
        errorMessage: error.message,
      },
    });

    return {
      application: null,
      template: null,
      relatedApplications: [],
      platforms: [],
      success: false,
      errorType: errorInfo.type,
      httpStatus: errorInfo.httpStatus,
      userMessage: errorInfo.userMessage,
      shouldRetry: errorInfo.shouldRetry,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
}

/**
 * ✅ Composant d'erreur réutilisable
 */
function ApplicationError({
  errorType,
  userMessage,
  shouldRetry,
  templateId,
  applicationId,
}) {
  return (
    <div className="application-error-page">
      <section className="first">
        <div className="error-content">
          {errorType === ERROR_TYPES.NOT_FOUND ? (
            <div className="not-found-error">
              <div className="error-icon">🔍</div>
              <h1 className="error-code">404</h1>
              <h2 className="error-title">Application introuvable</h2>
              <p className="error-message">
                L&apos;application demandée n&apos;existe pas ou a été
                supprimée.
              </p>
              <div className="error-actions">
                <Link
                  href={`/templates/${templateId}`}
                  className="cta-button primary"
                >
                  🔙 Retour au template
                </Link>
                <Link href="/templates" className="cta-button secondary">
                  📋 Tous les templates
                </Link>
                <Link href="/" className="cta-button outline">
                  🏠 Accueil
                </Link>
              </div>
            </div>
          ) : (
            <div className="server-error">
              <div className="error-icon">
                {errorType === ERROR_TYPES.TIMEOUT ? '⏱️' : '⚠️'}
              </div>
              <h1 className="error-code">
                {errorType === ERROR_TYPES.TIMEOUT ? '503' : '500'}
              </h1>
              <h2 className="error-title">
                {shouldRetry ? 'Erreur temporaire' : 'Erreur technique'}
              </h2>
              <p className="error-message">{userMessage}</p>
              <div className="error-actions">
                {shouldRetry && (
                  <button
                    onClick={() => window.location.reload()}
                    className="cta-button primary"
                  >
                    🔄 Réessayer
                  </button>
                )}
                <Link
                  href={`/templates/${templateId}`}
                  className="cta-button secondary"
                >
                  🔙 Retour
                </Link>
                <Link href="/templates" className="cta-button outline">
                  📋 Templates
                </Link>
              </div>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="debug-section">
              <details className="debug-details">
                <summary>Debug</summary>
                <div className="debug-content">
                  <p>
                    <strong>Type:</strong> {errorType}
                  </p>
                  <p>
                    <strong>App ID:</strong> {applicationId}
                  </p>
                  <p>
                    <strong>Template ID:</strong> {templateId}
                  </p>
                  <p>
                    <strong>Retry:</strong> {shouldRetry ? 'Oui' : 'Non'}
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * ✅ COMPOSANT PRINCIPAL - Page Server Component
 */
export default async function SingleApplicationPage({ params }) {
  const { id: templateId, appID: appId } = await params;

  const validation = validateIds(appId, templateId);
  if (!validation.isValid) {
    captureMessage('Invalid ID format', {
      level: 'info',
      tags: { component: 'single_application', validation: true },
      extra: {
        rawAppId: appId,
        rawTemplateId: templateId,
        validationError: validation.error,
      },
    });

    notFound();
  }

  const data = await getApplicationData(
    validation.applicationId,
    validation.templateId,
  );

  if (!data.success) {
    if (data.errorType === ERROR_TYPES.NOT_FOUND) {
      notFound();
    }

    return (
      <ApplicationError
        errorType={data.errorType}
        userMessage={data.userMessage}
        shouldRetry={data.shouldRetry}
        templateId={validation.templateId}
        applicationId={validation.applicationId}
      />
    );
  }

  if (!data.application) {
    notFound();
  }

  return (
    <Suspense fallback={<Loading />}>
      <SingleApplication
        application={data.application}
        template={data.template}
        relatedApplications={data.relatedApplications}
        platforms={data.platforms}
        context={{
          templateId: validation.templateId,
          applicationId: validation.applicationId,
        }}
      />
    </Suspense>
  );
}

/**
 * ✅ METADATA OPTIMISÉE
 */
export async function generateMetadata({ params }) {
  const { id: templateId, appID: appId } = await params;

  const validation = validateIds(appId, templateId);
  if (!validation.isValid) {
    return {
      title: 'Application non trouvée - Benew',
      description: "L'application demandée n'existe pas.",
      robots: { index: false, follow: false },
    };
  }

  try {
    const client = await getClient();
    try {
      const queryPromise = client.query(
        `SELECT 
          a.application_name,
          a.application_description,
          a.application_category,
          a.application_images,
          t.template_name
        FROM catalog.applications a
        JOIN catalog.templates t 
          ON a.application_template_id = t.template_id
        WHERE a.application_id = $1 
          AND a.application_template_id = $2
          AND a.is_active = true`,
        [validation.applicationId, validation.templateId],
      );

      const result = await withTimeout(queryPromise, 2000, 'Metadata timeout');

      if (result.rows.length > 0) {
        const app = result.rows[0];

        return {
          title: `${app.application_name} - ${app.template_name} | Benew`,
          description:
            app.application_description ||
            `Découvrez ${app.application_name} sur Benew.`,
          keywords: [
            app.application_name,
            app.template_name,
            app.application_category,
            'e-commerce',
            'Benew',
            'Djibouti',
          ],
          openGraph: {
            title: `${app.application_name} - ${app.template_name}`,
            description:
              app.application_description ||
              `Application ${app.application_name}.`,
            images:
              app.application_images?.length > 0
                ? [app.application_images[0]]
                : [],
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/templates/${validation.templateId}/applications/${validation.applicationId}`,
          },
          alternates: {
            canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/templates/${validation.templateId}/applications/${validation.applicationId}`,
          },
        };
      }
    } finally {
      client.release();
    }
  } catch (error) {
    captureMessage('Metadata generation failed', {
      level: 'warning',
      tags: { component: 'single_application_metadata' },
      extra: {
        applicationId: validation.applicationId,
        templateId: validation.templateId,
        errorMessage: error.message,
      },
    });
  }

  return {
    title: 'Application - Benew',
    description: 'Découvrez cette application sur Benew.',
    openGraph: {
      title: 'Application Benew',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/templates/${validation.templateId}/applications/${validation.applicationId}`,
    },
  };
}

export const revalidate = 300;
export const dynamic = 'force-static';
