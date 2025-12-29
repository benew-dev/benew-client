'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { captureMessage } from '@/instrumentation';
import { trackEvent } from '@/utils/analytics';
import './not-found.scss';

/**
 * ✅ PAGE 404 OPTIMISÉE
 * - Tracking Sentry + Analytics
 * - Suggestions intelligentes
 * - Production-ready pour 500 users/day
 */
export default function ApplicationDetailNotFound() {
  const params = useParams();
  const templateId = params?.id;
  const appId = params?.appID;

  useEffect(() => {
    // ✅ Capture Sentry (sécurisé)
    try {
      captureMessage('404 - Application not found', {
        level: 'info',
        tags: {
          component: 'application_detail_not_found',
          page_type: 'application_detail',
          error_type: '404',
          template_id: templateId || 'unknown',
          application_id: appId || 'unknown',
        },
        extra: {
          templateId,
          appId,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          referrer:
            typeof document !== 'undefined' ? document.referrer : 'unknown',
        },
      });
    } catch (error) {
      console.warn('[Sentry] Capture failed:', error);
    }

    // ✅ Analytics tracking (sécurisé)
    try {
      trackEvent('page_not_found', {
        event_category: 'errors',
        event_label: '404_application_detail',
        page_path: `/templates/${templateId}/applications/${appId}`,
        template_id: templateId,
        application_id: appId,
      });
    } catch (error) {
      console.warn('[Analytics] Tracking failed:', error);
    }

    // Log dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[404] Application not found:', {
        templateId,
        appId,
      });
    }
  }, [templateId, appId]);

  /**
   * ✅ Handler avec tracking
   */
  const handleLinkClick = (destination, extra = {}) => {
    try {
      trackEvent('404_navigation', {
        event_category: 'errors',
        event_label: `404_to_${destination}`,
        from_page: 'application_detail',
        template_id: templateId,
        application_id: appId,
        ...extra,
      });
    } catch (error) {
      console.warn('[Analytics] Navigation tracking failed:', error);
    }
  };

  return (
    <section className="first">
      <div className="app-not-found-container">
        <div className="content-wrapper">
          {/* Titre */}
          <h1 className="error-title">Application Introuvable</h1>

          {/* Badges IDs */}
          <div className="id-badges">
            {templateId && (
              <div className="template-id-badge">Template: {templateId}</div>
            )}
            {appId && <div className="app-id-badge">App: {appId}</div>}
          </div>

          {/* Message */}
          <p className="error-message">
            Désolé, l&apos;application que vous recherchez n&apos;existe pas ou
            a été retirée de notre catalogue.
            {templateId && " Explorez d'autres applications de ce template !"}
          </p>

          {/* Actions */}
          <div className="button-group">
            {templateId && (
              <Link
                href={`/templates/${templateId}`}
                className="retry-button"
                onClick={() => handleLinkClick('template_applications')}
              >
                📋 Applications du template
              </Link>
            )}

            <Link
              href="/templates"
              className="templates-button"
              onClick={() => handleLinkClick('all_templates')}
            >
              🎯 Tous les templates
            </Link>

            <Link
              href="/"
              className="home-button"
              onClick={() => handleLinkClick('home')}
            >
              🏠 Accueil
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
