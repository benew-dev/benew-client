'use client';

import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { captureMessage } from '@/sentry.client.config';
import { trackEvent } from '@/utils/analytics';
import './not-found.scss';

/**
 * Page 404 pour la route /templates/[id]
 * Gère le cas où un template spécifique n'existe pas
 * Production-ready avec suggestions intelligentes
 */
export default function TemplateDetailNotFound() {
  const params = useParams();
  const templateId = params?.id;

  useEffect(() => {
    // Capture dans Sentry
    captureMessage('404 - Template not found', {
      level: 'info',
      tags: {
        component: 'template_detail_not_found',
        page_type: 'template_detail',
        error_type: '404',
        template_id: templateId || 'unknown',
      },
      extra: {
        templateId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        referrer:
          typeof document !== 'undefined' ? document.referrer : 'unknown',
      },
    });

    // Track dans Analytics
    try {
      trackEvent('page_not_found', {
        event_category: 'errors',
        event_label: '404_template_detail',
        page_path: `/templates/${templateId}`,
        template_id: templateId || 'unknown',
      });
    } catch (error) {
      console.warn('[Analytics] Error tracking 404:', error);
    }

    // Log en dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[TemplateDetailNotFound] 404 for template:', templateId);
    }
  }, [templateId]);

  /**
   * Handler pour les liens avec tracking
   */
  const handleLinkClick = useCallback(
    (destination, extra = {}) => {
      try {
        trackEvent('404_navigation', {
          event_category: 'errors',
          event_label: `404_to_${destination}`,
          from_page: 'template_detail',
          template_id: templateId || 'unknown',
          ...extra,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking navigation:', error);
      }
    },
    [templateId],
  );

  return (
    <section className="first">
      <div className="not-found-container">
        <div className="content-wrapper">
          {/* Titre principal */}
          <h1 className="error-title">Template Introuvable</h1>

          {/* Badge de l'ID du template */}
          {templateId && (
            <div className="template-id-badge">ID recherché : {templateId}</div>
          )}

          {/* Message explicatif */}
          <p className="error-message">
            Désolé, le template que vous recherchez n&apos;existe pas ou a
            peut-être été retiré de notre catalogue. Mais ne vous inquiétez pas,
            nous avons plein d&apos;autres options fantastiques pour vous !
          </p>

          {/* Boutons d'action */}
          <div className="button-group">
            <Link
              href="/templates"
              className="retry-button"
              onClick={() => handleLinkClick('templates_list')}
            >
              📋 Voir tous les templates
            </Link>

            <Link
              href="/"
              className="home-button"
              onClick={() => handleLinkClick('home')}
            >
              🏠 Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
