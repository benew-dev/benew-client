'use client';

import { useEffect, useState } from 'react';
import { createOrder } from '../../actions/orderActions';
import './orderStyles/index.scss';

import {
  trackPurchase,
  trackModalOpen,
  trackModalClose,
} from '@/utils/analytics';

const OrderModal = ({
  isOpen,
  onClose,
  platforms,
  applicationId,
  applicationFee,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    paymentMethod: '',
    accountName: '',
    accountNumber: '',
  });

  // Trouver la plateforme sélectionnée
  const selectedPlatform = platforms?.find(
    (p) => p.platform_id === formData.paymentMethod,
  );
  const isCashPayment = selectedPlatform?.is_cash_payment || false;

  // Tracker l'ouverture/fermeture de la modal
  useEffect(() => {
    if (isOpen) {
      try {
        trackModalOpen('order_modal', `application_${applicationId}`);
      } catch (error) {
        console.warn('[Analytics] Error tracking modal open:', error);
      }
    }
  }, [isOpen, applicationId]);

  const closeModal = () => {
    try {
      trackModalClose('order_modal', 'user_close');
    } catch (error) {
      console.warn('[Analytics] Error tracking modal close:', error);
    }
    onClose();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateStep1 = () => {
    if (
      !formData.lastName ||
      !formData.firstName ||
      !formData.email ||
      !formData.phone
    ) {
      setError('Veuillez remplir tous les champs requis');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez fournir une adresse email valide');
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^\d{8,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Veuillez fournir un numéro de téléphone valide');
      return false;
    }

    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.paymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement');
      return false;
    }

    // Si ce n'est PAS un paiement CASH, vérifier les champs compte
    if (!isCashPayment) {
      if (!formData.accountName || !formData.accountNumber) {
        setError('Veuillez remplir le nom et le numéro de compte');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3); // Aller à l'étape récapitulatif
      }
    } else if (step === 3) {
      submitOrder(); // Soumettre depuis le récapitulatif
    }
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('lastName', formData.lastName);
      formDataToSubmit.append('firstName', formData.firstName);
      formDataToSubmit.append('email', formData.email);
      formDataToSubmit.append('phone', formData.phone);
      formDataToSubmit.append('paymentMethod', formData.paymentMethod);

      // Si CASH, envoyer des valeurs par défaut
      if (isCashPayment) {
        formDataToSubmit.append('accountName', 'CASH');
        formDataToSubmit.append('accountNumber', 'N/A');
      } else {
        formDataToSubmit.append('accountName', formData.accountName);
        formDataToSubmit.append('accountNumber', formData.accountNumber);
      }

      const result = await createOrder(
        formDataToSubmit,
        applicationId,
        applicationFee,
      );

      if (!result.success) {
        throw new Error(
          result.message || 'Erreur lors de la création de la commande',
        );
      }

      // Tracker la commande réussie
      try {
        trackPurchase(
          {
            application_id: applicationId,
            application_fee: applicationFee,
            application_name: `Application ${applicationId}`,
            application_category: 'web',
          },
          result.orderId || Date.now().toString(),
          formData.paymentMethod,
        );
      } catch (error) {
        console.warn('[Analytics] Error tracking purchase:', error);
      }

      // Aller à la confirmation
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modal">
        {error && <div className="errorMessage">{error}</div>}

        {/* ÉTAPE 1 : Informations personnelles */}
        {step === 1 && (
          <div className="step">
            <h2>Étape 1: Informations personnelles</h2>
            <input
              type="text"
              name="lastName"
              placeholder="Nom de famille"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="firstName"
              placeholder="Prénom"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Adresse email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Numéro de téléphone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <div className="buttonContainer">
              <button
                onClick={() => closeModal('user_cancel_step1')}
                className="cancelButton"
              >
                Annuler
              </button>
              <button onClick={handleNext} className="nextButton">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Méthode de paiement */}
        {step === 2 && (
          <div className="step">
            <h2>Étape 2: Méthode de paiement</h2>
            <div className="checkboxGroup">
              {platforms?.map((platform) => (
                <label key={platform?.platform_id} className="radioLabel">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={platform?.platform_id}
                    onChange={handleInputChange}
                    checked={formData.paymentMethod === platform?.platform_id}
                    required
                  />
                  <span className="platform-name">
                    {platform?.is_cash_payment ? (
                      <strong>💵 {platform?.platform_name} (Espèces)</strong>
                    ) : (
                      platform?.platform_name
                    )}
                  </span>
                  {platform?.description && (
                    <span className="platform-description">
                      {platform?.description}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Afficher les champs uniquement si ce n'est PAS CASH */}
            {formData.paymentMethod && !isCashPayment && (
              <>
                <input
                  type="text"
                  name="accountName"
                  placeholder="Nom du compte"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Numéro du compte"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}

            {/* Message pour CASH */}
            {isCashPayment && (
              <div className="cash-info">
                <p className="cash-message">
                  ✅ Paiement en espèces sélectionné. Aucune information de
                  compte requise.
                </p>
              </div>
            )}

            <div className="buttonContainer">
              <button onClick={handleBack} className="backButton">
                Retour
              </button>
              <button onClick={handleNext} className="nextButton">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Récapitulatif */}
        {step === 3 && (
          <div className="step">
            <h2>Étape 3: Récapitulatif</h2>

            <div className="summary-section">
              <h3 className="summary-title">Informations personnelles</h3>
              <div className="summary-item">
                <span className="summary-label">Nom complet :</span>
                <span className="summary-value">
                  {formData.firstName} {formData.lastName}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Email :</span>
                <span className="summary-value">{formData.email}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Téléphone :</span>
                <span className="summary-value">{formData.phone}</span>
              </div>
            </div>

            <div className="summary-section">
              <h3 className="summary-title">Informations de paiement</h3>

              {platforms?.map((platform) => {
                if (platform.platform_id !== formData.paymentMethod)
                  return null;

                return (
                  <div key={platform.platform_id} className="platform-summary">
                    <div className="summary-item">
                      <span className="summary-label">Plateforme :</span>
                      <span className="summary-value platform-name-highlight">
                        {platform.is_cash_payment ? (
                          <strong>💵 {platform.platform_name} (Espèces)</strong>
                        ) : (
                          platform.platform_name
                        )}
                      </span>
                    </div>

                    {!platform.is_cash_payment && (
                      <>
                        <div className="summary-item">
                          <span className="summary-label">Nom du compte :</span>
                          <span className="summary-value">
                            {platform.account_name || formData.accountName}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">
                            Numéro du compte :
                          </span>
                          <span className="summary-value">
                            {platform.account_number || formData.accountNumber}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="summary-section summary-total">
              <div className="summary-item">
                <span className="summary-label">Montant total :</span>
                <span className="summary-value total-amount">
                  {applicationFee} FDJ
                </span>
              </div>
            </div>

            <div className="buttonContainer">
              <button onClick={handleBack} className="backButton">
                Retour
              </button>
              <button
                onClick={handleNext}
                className="nextButton"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Traitement...' : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Confirmation */}
        {step === 4 && (
          <div className="step confirmationStep">
            <h2>Étape 4: Confirmation</h2>
            <div className="confirmation-icon">✅</div>
            <p>
              Merci pour votre commande. Nous avons bien reçu vos informations
              et nous vous contacterons dans les plus brefs délais pour
              finaliser votre commande. Un email de confirmation vous sera
              envoyé à l&apos;adresse fournie.
            </p>
            <button
              onClick={() => closeModal('purchase_complete')}
              className="closeButton"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
