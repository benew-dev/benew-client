// components/contact/FormContainer.jsx
// ✅ MODIFICATION : Honeypot + fillTime tracking

'use client';

import { useState, useRef, memo, useCallback } from 'react';
import { sendContactEmail } from '@/actions/sendContactEmail';
import { trackEvent } from '@/utils/analytics';
import './formStyles/index.scss';

// =============================
// CHAMPS FORMULAIRE
// =============================
const FormField = memo(
  ({ name, label, type = 'text', required = false, rows = null }) => {
    const isTextarea = type === 'textarea';
    const inputId = `contact-${name}`;

    return (
      <div className="form-field">
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-asterisk"> *</span>}
        </label>
        {isTextarea ? (
          <textarea
            id={inputId}
            name={name}
            rows={rows}
            required={required}
            className="form-input form-textarea"
            placeholder={`Entrez ${label.toLowerCase()}`}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            name={name}
            required={required}
            className="form-input"
            placeholder={`Entrez ${label.toLowerCase()}`}
          />
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';

// =============================
// MESSAGE STATUS
// =============================
const StatusMessage = memo(({ type, message }) => {
  if (!message) return null;

  const icon = type === 'success' ? '✅' : '❌';
  const className = `status-message ${type}`;

  return (
    <div className={className} role="alert">
      <span className="status-icon">{icon}</span>
      <span className="status-text">{message}</span>
    </div>
  );
});

StatusMessage.displayName = 'StatusMessage';

// =============================
// CONTENEUR FORMULAIRE
// =============================
const FormContainer = () => {
  const [formState, setFormState] = useState({
    error: false,
    success: false,
    loading: false,
    message: '',
  });

  // ✅ NOUVEAU : Tracking fillTime
  const [fillStartTime] = useState(() => Date.now());

  const formRef = useRef(null);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      setFormState({
        error: false,
        success: false,
        loading: true,
        message: '',
      });

      try {
        trackEvent('contact_form_submit_start', {
          event_category: 'contact',
          event_label: 'form_submission_attempt',
        });
      } catch (error) {
        console.warn('[Analytics] Error:', error);
      }

      const formData = new FormData(event.target);

      // ✅ NOUVEAU : Ajouter fillTime
      const fillTime = Date.now() - fillStartTime;
      formData.append('_fillTime', fillTime.toString());

      const result = await sendContactEmail(null, formData);

      if (result.success) {
        setFormState({
          error: false,
          success: true,
          loading: false,
          message: result.message || 'Message envoyé avec succès !',
        });

        formRef.current?.reset();

        try {
          trackEvent('contact_form_submit_success', {
            event_category: 'contact',
            event_label: 'form_submission_success',
            conversion: true,
          });
        } catch (error) {
          console.warn('[Analytics] Error:', error);
        }
      } else {
        setFormState({
          error: true,
          success: false,
          loading: false,
          message:
            result.message || "Une erreur s'est produite. Veuillez réessayer.",
        });

        try {
          trackEvent('contact_form_submit_error', {
            event_category: 'contact',
            event_label: 'form_submission_error',
            error_type: result.code || 'unknown',
          });
        } catch (error) {
          console.warn('[Analytics] Error:', error);
        }
      }
    },
    [fillStartTime],
  );

  return (
    <div className="form-container">
      <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
        <FormField name="name" label="Nom complet" required />
        <FormField name="email" label="Email" type="email" required />
        <FormField name="subject" label="Sujet" required />
        <FormField
          name="message"
          label="Message"
          type="textarea"
          rows={6}
          required
        />

        {/* ✅ NOUVEAU : Honeypot field */}
        <div
          className="form-field-honeypot"
          style={{ position: 'absolute', left: '-9999px' }}
          aria-hidden="true"
        >
          <label htmlFor="website">
            If you are human, leave this field blank
          </label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            placeholder="Leave this blank"
          />
        </div>

        {formState.error && (
          <StatusMessage type="error" message={formState.message} />
        )}
        {formState.success && (
          <StatusMessage type="success" message={formState.message} />
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={formState.loading}
        >
          {formState.loading ? (
            <>
              <span className="spinner"></span>
              Envoi en cours...
            </>
          ) : (
            <>
              <span className="button-icon">📧</span>
              Envoyer le message
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FormContainer;
