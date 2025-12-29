/* eslint-disable no-unused-vars */
// components/templates/SingleApplication.jsx
'use client';

import dynamic from 'next/dynamic';
import './appStyles/index.scss';
import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';

import ParallaxSkeleton from '../layouts/parallax/ParallaxSkeleton';
const Parallax = dynamic(() => import('components/layouts/parallax'), {
  loading: () => <ParallaxSkeleton />,
  ssr: true,
});

import OrderModal from '../modal/OrderModal';
import { formatPrice, getApplicationLevelLabel } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';

// =============================
// ✅ CAROUSEL GALERIE OPTIMISÉ POUR 500 USERS/DAY
// =============================
const ApplicationGalleryCarousel = memo(
  ({ images, applicationName, applicationId }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // ✅ Fallback robuste avec placeholder
    const imageList = useMemo(() => {
      if (!images || images.length === 0) {
        return ['/placeholder-application.png'];
      }
      return images;
    }, [images]);

    // ✅ Auto-scroll avec 5 secondes
    useEffect(() => {
      if (!isAutoScrolling || imageList.length <= 1 || isTransitioning) {
        return;
      }

      const interval = setInterval(() => {
        handleSlideChange((currentSlide + 1) % imageList.length);
      }, 5000);

      return () => clearInterval(interval);
    }, [isAutoScrolling, imageList.length, currentSlide, isTransitioning]);

    // ✅ Reprendre auto-scroll après 15s inactivité
    useEffect(() => {
      if (!isAutoScrolling) {
        const timeout = setTimeout(() => {
          setIsAutoScrolling(true);
        }, 15000);
        return () => clearTimeout(timeout);
      }
    }, [isAutoScrolling]);

    // ✅ Changement de slide avec animation
    const handleSlideChange = useCallback(
      (newIndex) => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentSlide(newIndex);

        setTimeout(() => {
          setIsTransitioning(false);
        }, 600);
      },
      [isTransitioning],
    );

    // ✅ Navigation dots
    const goToSlide = useCallback(
      (index) => {
        if (index === currentSlide || isTransitioning) return;
        setIsAutoScrolling(false);
        handleSlideChange(index);

        try {
          trackEvent('gallery_dot_click', {
            event_category: 'gallery',
            event_label: `image_${index + 1}`,
            application_id: applicationId,
          });
        } catch (error) {
          console.warn('[Analytics] Error:', error);
        }
      },
      [currentSlide, isTransitioning, handleSlideChange, applicationId],
    );

    // ✅ Navigation flèches
    const handleArrowNavigation = useCallback(
      (direction) => {
        if (isTransitioning) return;

        setIsAutoScrolling(false);

        let nextIndex;
        if (direction === 'next') {
          nextIndex = (currentSlide + 1) % imageList.length;
        } else {
          nextIndex = (currentSlide - 1 + imageList.length) % imageList.length;
        }

        handleSlideChange(nextIndex);

        try {
          trackEvent('gallery_arrow_click', {
            event_category: 'gallery',
            event_label: direction,
            application_id: applicationId,
          });
        } catch (error) {
          console.warn('[Analytics] Error:', error);
        }
      },
      [
        currentSlide,
        imageList.length,
        isTransitioning,
        handleSlideChange,
        applicationId,
      ],
    );

    // ✅ Swipe tactile
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = useCallback(() => {
      if (!touchStart || !touchEnd || isTransitioning) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe || isRightSwipe) {
        setIsAutoScrolling(false);
        handleArrowNavigation(isLeftSwipe ? 'next' : 'prev');
      }
    }, [touchStart, touchEnd, isTransitioning, handleArrowNavigation]);

    // ✅ Image seule si pas de carousel
    if (imageList.length === 1) {
      return (
        <div className="gallery-single-image">
          <CldImage
            src={imageList[0]}
            alt={applicationName}
            width={800}
            height={600}
            className="gallery-image-solo"
            loading="eager"
            quality="auto"
            format="auto"
            crop={{ type: 'fit', gravity: 'center' }}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-application.png';
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="gallery-carousel-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Track slides */}
        <div className="gallery-carousel-track">
          {imageList.map((imgUrl, index) => {
            let slidePosition = 'hidden-right';

            if (index === currentSlide) {
              slidePosition = isTransitioning ? 'entering' : 'active';
            } else if (
              index ===
              (currentSlide - 1 + imageList.length) % imageList.length
            ) {
              slidePosition = isTransitioning ? 'exiting' : 'hidden-left';
            }

            return (
              <div
                key={index}
                className={`gallery-carousel-slide ${slidePosition}`}
              >
                <CldImage
                  src={imgUrl}
                  alt={`${applicationName} - Image ${index + 1}`}
                  width={800}
                  height={600}
                  className="gallery-carousel-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  quality="auto"
                  format="auto"
                  crop={{ type: 'fit', gravity: 'center' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-application.png';
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Flèches DISCRÈTES */}
        {imageList.length > 1 && (
          <>
            <button
              className="gallery-arrow gallery-arrow-left"
              onClick={() => handleArrowNavigation('prev')}
              aria-label="Image précédente"
              disabled={isTransitioning}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              className="gallery-arrow gallery-arrow-right"
              onClick={() => handleArrowNavigation('next')}
              aria-label="Image suivante"
              disabled={isTransitioning}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {imageList.length > 1 && (
          <div className="gallery-carousel-indicators">
            {imageList.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`gallery-carousel-dot ${index === currentSlide ? 'active' : ''}`}
                aria-label={`Image ${index + 1}`}
                disabled={isTransitioning}
              />
            ))}
          </div>
        )}

        {/* Compteur */}
        {imageList.length > 1 && (
          <div className="gallery-carousel-counter">
            {currentSlide + 1} / {imageList.length}
          </div>
        )}
      </div>
    );
  },
);

ApplicationGalleryCarousel.displayName = 'ApplicationGalleryCarousel';

// Composant infos techniques
const TechnicalInfo = memo(({ application, template, onExternalLinkClick }) => (
  <div className="technical-section">
    <h3 className="section-title">Informations Techniques</h3>
    <div className="info-table-container">
      <table className="info-table">
        <tbody>
          <tr className="info-row">
            <td className="info-label">Template</td>
            <td className="info-value">
              {template?.template_name || 'Non spécifié'}
            </td>
          </tr>
          <tr className="info-row">
            <td className="info-label">Type</td>
            <td className="info-value">
              {getApplicationLevelLabel(application.application_level).long}
            </td>
          </tr>
          <tr className="info-row">
            <td className="info-label">Niveau</td>
            <td className="info-value">{application.application_level}</td>
          </tr>
          <tr className="info-row">
            <td className="info-label">Catégorie</td>
            <td className="info-value">{application.application_category}</td>
          </tr>
          <tr className="info-row">
            <td className="info-label">Lien boutique</td>
            <td className="info-value">
              <Link
                href={application.application_link}
                target="_blank"
                rel="noopener noreferrer"
                className="info-link"
                onClick={() =>
                  onExternalLinkClick('store', application.application_link)
                }
              >
                Voir la boutique
              </Link>
            </td>
          </tr>
          {application.application_admin_link && (
            <tr className="info-row">
              <td className="info-label">Gestion</td>
              <td className="info-value">
                <Link
                  href={application.application_admin_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-link"
                  onClick={() =>
                    onExternalLinkClick(
                      'admin',
                      application.application_admin_link,
                    )
                  }
                >
                  Interface admin
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
));

TechnicalInfo.displayName = 'TechnicalInfo';

// Composant besoins
const SpecificNeeds = memo(() => (
  <div className="needs-section">
    <h3 className="section-title">Besoins spécifiques</h3>
    <div className="needs-table-container">
      <table className="needs-table">
        <tbody>
          <tr className="needs-row">
            <td className="needs-item">
              <span className="needs-icon">🌐</span>
              <span className="needs-text">Hébergement web</span>
            </td>
          </tr>
          <tr className="needs-row">
            <td className="needs-item">
              <span className="needs-icon">💾</span>
              <span className="needs-text">Base de données</span>
            </td>
          </tr>
          <tr className="needs-row">
            <td className="needs-item">
              <span className="needs-icon">🔗</span>
              <span className="needs-text">Nom de domaine</span>
            </td>
          </tr>
          <tr className="needs-row">
            <td className="needs-item">
              <span className="needs-icon">📧</span>
              <span className="needs-text">Email professionnel</span>
            </td>
          </tr>
          <tr className="needs-row free-tools">
            <td className="needs-item">
              <span className="needs-icon">🎁</span>
              <span className="needs-text">Autres outils gratuits</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
));

SpecificNeeds.displayName = 'SpecificNeeds';

// Composant tarification
const PricingSection = memo(({ application }) => (
  <div className="pricing-section">
    <h3 className="section-title">Tarification</h3>
    <div className="pricing-table-container">
      <table className="pricing-table">
        <tbody>
          <tr className="pricing-row">
            <td className="pricing-label">Acquisition</td>
            <td className="pricing-value">
              FDJ {formatPrice(application.application_fee)}
            </td>
          </tr>
          <tr className="pricing-row">
            <td className="pricing-label">Gestion</td>
            <td className="pricing-value">
              FDJ {formatPrice(application.application_rent)}
            </td>
          </tr>
          <tr className="pricing-row total-row">
            <td className="pricing-label">Total</td>
            <td className="pricing-value">
              FDJ{' '}
              {formatPrice(
                application.application_fee + application.application_rent,
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="pricing-note">
        <small>Francs Djiboutiens (FDJ)</small>
      </div>
    </div>
  </div>
));

PricingSection.displayName = 'PricingSection';

// =============================
// ✅ COMPOSANT PRINCIPAL SÉCURISÉ
// =============================
const SingleApplication = ({
  application,
  template,
  relatedApplications,
  platforms,
  context,
}) => {
  // ✅ COMBINAISON SÉCURISÉE des images
  const allImages = useMemo(() => {
    const mainImages = application?.application_images || [];
    const otherVersions = application?.application_other_versions || [];

    const combined = [...mainImages, ...otherVersions];
    const unique = [...new Set(combined)].filter(Boolean);

    return unique.length > 0 ? unique : ['/placeholder-application.png'];
  }, [application]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContentSection, setActiveContentSection] =
    useState('description');
  const [activePricingSection, setActivePricingSection] = useState('needs');

  // Tracking page view
  useEffect(() => {
    if (context?.applicationId && application?.application_name) {
      try {
        trackEvent('application_page_view', {
          event_category: 'application',
          event_label: application.application_name,
          application_id: context.applicationId,
          total_images: allImages.length,
        });
      } catch (error) {
        console.warn('[Analytics] Error:', error);
      }
    }
  }, []);

  // Handlers
  const handleContentToggle = useCallback(
    (section) => {
      setActiveContentSection(section);
      try {
        trackEvent('content_toggle', {
          event_category: 'ui',
          event_label: section,
          application_id: context?.applicationId,
        });
      } catch (error) {
        console.warn('[Analytics] Error:', error);
      }
    },
    [context?.applicationId],
  );

  const handlePricingSectionToggle = useCallback(
    (section) => {
      setActivePricingSection(section);
      try {
        trackEvent('pricing_toggle', {
          event_category: 'ui',
          event_label: section,
          application_id: context?.applicationId,
        });
      } catch (error) {
        console.warn('[Analytics] Error:', error);
      }
    },
    [context?.applicationId],
  );

  const handleExternalLinkClick = useCallback(
    (linkType, url) => {
      try {
        trackEvent('external_link', {
          event_category: 'navigation',
          event_label: linkType,
          application_id: context?.applicationId,
        });
      } catch (error) {
        console.warn('[Analytics] Error:', error);
      }
    },
    [context?.applicationId],
  );

  const handleOrderModalOpen = useCallback(() => {
    if (!platforms || platforms.length === 0) {
      alert('Paiement indisponible');
      return;
    }

    try {
      trackEvent('order_modal_open', {
        event_category: 'ecommerce',
        application_id: context?.applicationId,
      });
    } catch (error) {
      console.warn('[Analytics] Error:', error);
    }

    setIsModalOpen(true);
  }, [platforms, context]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // État vide
  if (!application || Object.keys(application).length === 0) {
    return (
      <div className="application-empty">
        <PageTracker pageName="application_empty" pageType="product_detail" />
        <section className="first">
          <Parallax bgColor="#0c0c1d" title="Application" planets="/sun.png" />
        </section>
        <section className="empty-state">
          <h2>Application non trouvée</h2>
          <p>Cette application n&apos;est pas disponible.</p>
          <Link href="/templates" className="cta-button">
            Voir les templates
          </Link>
        </section>
      </div>
    );
  }

  const hasPaymentMethods = platforms && platforms.length > 0;

  return (
    <div>
      <PageTracker
        pageName={`application_${context?.applicationId || 'unknown'}`}
        pageType="product_detail"
      />

      {/* Parallax */}
      <section className="first">
        <Parallax
          bgColor="#0c0c1d"
          title={application.application_name}
          planets="/sun.png"
        />
      </section>

      {/* ✅ GALERIE CAROUSEL */}
      {/* <section className="others gallery-section">
        <ApplicationGalleryCarousel
          images={allImages}
          applicationName={application.application_name}
          applicationId={context?.applicationId}
        />
      </section> */}

      {/* Header */}
      <section className="others app-header-section">
        <div className="app-header-container">
          <div className="app-header">
            <div className="title-block">
              <h1 className="app-title">{application.application_name}</h1>
            </div>

            <div className="app-badges">
              <div className="badge level-badge">
                <span className="badge-value">
                  {
                    getApplicationLevelLabel(application.application_level)
                      .short
                  }
                </span>
              </div>
              <div className="badge category-badge">
                <span className="badge-value">
                  {application.application_category}
                </span>
              </div>
            </div>
          </div>

          <div className="main-content">
            <div className="mobile-toggle-buttons">
              <button
                className={`toggle-btn ${activeContentSection === 'description' ? 'active' : ''}`}
                onClick={() => handleContentToggle('description')}
              >
                <span className="toggle-icon">📄</span>
                <span className="toggle-text">Description</span>
              </button>
              <button
                className={`toggle-btn ${activeContentSection === 'technical' ? 'active' : ''}`}
                onClick={() => handleContentToggle('technical')}
              >
                <span className="toggle-icon">⚙️</span>
                <span className="toggle-text">Technique</span>
              </button>
            </div>

            <div className="content-grid">
              <div
                className={`description-section ${activeContentSection === 'description' ? 'active' : ''}`}
              >
                <h2 className="section-title">Description</h2>
                <div className="description-content">
                  <p className="description-text">
                    {application.application_description ||
                      'Aucune description disponible.'}
                  </p>
                </div>
              </div>

              <div
                className={activeContentSection === 'technical' ? 'active' : ''}
              >
                <TechnicalInfo
                  application={application}
                  template={template}
                  onExternalLinkClick={handleExternalLinkClick}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tarification */}
      <section className="others app-details-section">
        <div className="app-details-container">
          <div className="mobile-section-nav">
            <button
              className={`section-btn ${activePricingSection === 'needs' ? 'active' : ''}`}
              onClick={() => handlePricingSectionToggle('needs')}
            >
              <span className="btn-icon">📋</span>
              <span className="btn-text">Besoins</span>
            </button>
            <button
              className={`section-btn ${activePricingSection === 'pricing' ? 'active' : ''}`}
              onClick={() => handlePricingSectionToggle('pricing')}
            >
              <span className="btn-icon">💰</span>
              <span className="btn-text">Prix</span>
            </button>
          </div>

          <div className="purchase-grid">
            <div
              className={`${activePricingSection === 'needs' ? 'active' : ''}`}
            >
              <SpecificNeeds />
            </div>

            <div
              className={`${activePricingSection === 'pricing' ? 'active' : ''}`}
            >
              <PricingSection application={application} />
            </div>
          </div>

          <div className="order-button-container">
            <button
              onClick={handleOrderModalOpen}
              className={`btn btn-primary purchase-btn ${!hasPaymentMethods ? 'disabled' : ''}`}
              disabled={!hasPaymentMethods}
            >
              <span className="btn-icon">💳</span>
              <span className="btn-text">
                {!hasPaymentMethods ? 'Indisponible' : 'Commander'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        platforms={platforms}
        applicationId={application.application_id}
        applicationFee={application.application_fee}
      />
    </div>
  );
};

export default SingleApplication;
