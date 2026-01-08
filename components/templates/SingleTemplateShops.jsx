// components/templates/SingleTemplateShops.jsx
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { FaDollarSign, FaImages, FaEye } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';
import './shopsStyles/index.scss';

import ParallaxSkeleton from '../layouts/parallax/ParallaxSkeleton';
const Parallax = dynamic(() => import('components/layouts/parallax'), {
  loading: () => <ParallaxSkeleton />,
  ssr: true,
});

import { formatPrice, getApplicationLevelLabel } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';

const OrderModal = dynamic(() => import('../modal/OrderModal'), {
  ssr: false,
});

// =============================
// COMPOSANT GALLERYMODAL AVEC IMAGES COMBINÉES
// =============================
const GalleryModal = memo(({ isOpen, onClose, images, applicationName }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !images || images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, images]);

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div
        className="gallery-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="gallery-close-btn"
          onClick={onClose}
          aria-label="Fermer la galerie"
        >
          <FaX className="close-icon" />
        </button>

        <div className="gallery-header">
          <div className="gallery-header-left">
            <h3>{applicationName} - Galerie</h3>
            <p className="gallery-counter">
              {selectedImage + 1} / {images.length}
            </p>
          </div>
        </div>

        <div className="gallery-body">
          <div className="gallery-thumbnails">
            {images.map((img, index) => (
              <button
                key={index}
                className={`gallery-thumb ${index === selectedImage ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
                aria-label={`Aller à l'image ${index + 1}`}
              >
                <CldImage
                  src={img}
                  alt={`Miniature ${index + 1}`}
                  width={120}
                  height={120}
                  crop={{ type: 'fill', gravity: 'center' }}
                  quality="auto"
                  format="auto"
                />
              </button>
            ))}
          </div>

          <div className="gallery-image-container">
            <CldImage
              src={images[selectedImage]}
              alt={`${applicationName} - Version ${selectedImage + 1}`}
              width={800}
              height={600}
              className="gallery-image"
              quality="auto"
              format="auto"
              crop={{ type: 'fit', gravity: 'center' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-application.png';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

GalleryModal.displayName = 'GalleryModal';

// =============================
// CARTE D'APPLICATION - UNE SEULE IMAGE
// =============================
const ApplicationCard = memo(
  ({
    app,
    templateID,
    onOrderClick,
    onViewClick,
    onGalleryClick,
    hasPaymentMethods,
  }) => {
    const firstImage = useMemo(() => {
      if (app.application_images && app.application_images.length > 0) {
        return app.application_images[0];
      }
      return '/placeholder-application.png';
    }, [app.application_images]);

    const allImages = useMemo(() => {
      const mainImages = app.application_images || [];
      const otherVersions = app.application_other_versions || [];
      const combined = [...mainImages, ...otherVersions];
      const unique = [...new Set(combined)].filter(Boolean);
      return unique.length > 0 ? unique : ['/placeholder-application.png'];
    }, [app.application_images, app.application_other_versions]);

    const hasMultipleImages = allImages.length > 1;

    return (
      <div
        className="application-card"
        data-app-id={app.application_id}
        data-app-name={app.application_name}
      >
        <div className="card-image">
          <CldImage
            src={firstImage}
            alt={app.application_name}
            width={400}
            height={200}
            className="app-image"
            loading="lazy"
            quality="auto"
            format="auto"
            crop={{ type: 'fit', gravity: 'auto' }}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-application.png';
            }}
          />
        </div>

        <div className="card-content">
          <h3 className="app-title">{app.application_name}</h3>

          <p className="app-meta">
            <span className="level">
              {getApplicationLevelLabel(app.application_level).long}
            </span>
            <span className="separator">•</span>
            <span className="category">{app.application_category}</span>
          </p>

          <div className="price-section">
            <div className="price-item">
              <span className="price-label">Frais d&apos;acquisition</span>
              <span className="price">{formatPrice(app.application_fee)}</span>
            </div>
            <div className="price-item">
              <span className="price-label">Frais de gestion</span>
              <span className="rent-price">
                {formatPrice(app.application_rent)}/mois
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-cart"
              onClick={() => onOrderClick(app)}
              disabled={!hasPaymentMethods}
              aria-label={`Commander ${app.application_name}`}
            >
              <FaDollarSign size={16} />
              <span className="btn-text">Commander</span>
            </button>

            {hasMultipleImages && (
              <button
                className="btn btn-gallery"
                onClick={() => onGalleryClick(app, allImages)}
                aria-label={`Voir la galerie de ${app.application_name}`}
              >
                <FaImages size={16} />
                <span className="btn-text">Galerie</span>
              </button>
            )}

            <Link
              href={`/templates/${templateID}/applications/${app.application_id}`}
              className="btn btn-preview"
              onClick={() => onViewClick(app)}
              aria-label={`Voir détails de ${app.application_name}`}
            >
              <FaEye />
              <span className="btn-text">Voir +</span>
            </Link>
          </div>
        </div>
      </div>
    );
  },
);

ApplicationCard.displayName = 'ApplicationCard';

// =============================
// CAROUSEL D'APPLICATIONS - FADE IN/OUT
// =============================
const ApplicationsCarousel = memo(
  ({
    applications,
    templateID,
    hasPaymentMethods,
    onOrderClick,
    onViewClick,
    onGalleryClick,
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
      if (!isAutoScrolling || applications.length <= 1 || isTransitioning) {
        return;
      }

      const interval = setInterval(() => {
        handleSlideChange((currentIndex + 1) % applications.length);
      }, 6000);

      return () => clearInterval(interval);
    }, [isAutoScrolling, applications.length, currentIndex, isTransitioning]);

    useEffect(() => {
      if (!isAutoScrolling) {
        const timeout = setTimeout(() => {
          setIsAutoScrolling(true);
        }, 15000);
        return () => clearTimeout(timeout);
      }
    }, [isAutoScrolling]);

    const handleSlideChange = useCallback(
      (newIndex) => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex(newIndex);

        setTimeout(() => {
          setIsTransitioning(false);
        }, 800);
      },
      [isTransitioning],
    );

    const goToSlide = useCallback(
      (index) => {
        if (index === currentIndex || isTransitioning) return;
        setIsAutoScrolling(false);
        handleSlideChange(index);

        try {
          trackEvent('application_carousel_dot_click', {
            event_category: 'navigation',
            event_label: `app_${index + 1}`,
            application_id: applications[index]?.application_id,
          });
        } catch (error) {
          console.warn('[Analytics] Error:', error);
        }
      },
      [currentIndex, isTransitioning, handleSlideChange, applications],
    );

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

      if (isLeftSwipe) {
        setIsAutoScrolling(false);
        handleSlideChange((currentIndex + 1) % applications.length);
      } else if (isRightSwipe) {
        setIsAutoScrolling(false);
        handleSlideChange(
          (currentIndex - 1 + applications.length) % applications.length,
        );
      }
    }, [
      touchStart,
      touchEnd,
      currentIndex,
      applications.length,
      isTransitioning,
      handleSlideChange,
    ]);

    if (applications.length === 1) {
      return (
        <section className="others projectSection" role="article">
          <ApplicationCard
            app={applications[0]}
            templateID={templateID}
            onOrderClick={onOrderClick}
            onViewClick={onViewClick}
            onGalleryClick={onGalleryClick}
            hasPaymentMethods={hasPaymentMethods}
          />
        </section>
      );
    }

    return (
      <div className="applications-carousel-wrapper">
        <section
          className="others projectSection applications-carousel-container"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="applications-carousel-track">
            {applications.map((app, index) => {
              let cardVisibility = 'hidden';

              if (index === currentIndex) {
                cardVisibility = 'active';
              }

              return (
                <div
                  key={app.application_id}
                  className={`applications-carousel-slide ${cardVisibility}`}
                >
                  <ApplicationCard
                    app={app}
                    templateID={templateID}
                    onOrderClick={onOrderClick}
                    onViewClick={onViewClick}
                    onGalleryClick={onGalleryClick}
                    hasPaymentMethods={hasPaymentMethods}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <div className="applications-carousel-indicators">
          {applications.map((app, index) => (
            <button
              key={app.application_id}
              onClick={() => goToSlide(index)}
              className={`applications-carousel-dot ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Application ${index + 1} - ${app.application_name}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>
    );
  },
);

ApplicationsCarousel.displayName = 'ApplicationsCarousel';

// =============================
// COMPOSANT PRINCIPAL
// =============================
const SingleTemplateShops = ({
  templateID,
  applications = [],
  template,
  platforms = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewedApps, setViewedApps] = useState(new Set());
  const [galleryApp, setGalleryApp] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (templateID && applications.length > 0) {
      const templateName = applications[0]?.template_name || 'Template';

      try {
        trackEvent('template_detail_view', {
          event_category: 'ecommerce',
          event_label: templateName,
          template_id: templateID,
          template_name: templateName,
          applications_count: applications.length,
          has_payment_methods: platforms.length > 0,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking page view:', error);
      }
    }
  }, [templateID, applications, platforms]);

  const handleOrderClick = useCallback(
    (app) => {
      if (!platforms || platforms.length === 0) {
        alert('Aucune méthode de paiement disponible pour le moment');
        return;
      }

      try {
        trackEvent('order_start', {
          event_category: 'ecommerce',
          event_label: app.application_name,
          application_id: app.application_id,
          template_id: templateID,
          application_fee: app.application_fee,
          application_rent: app.application_rent,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking order start:', error);
      }

      setSelectedApp(app);
      setIsModalOpen(true);
    },
    [platforms, templateID],
  );

  const handleGalleryClick = useCallback(
    (app, combinedImages) => {
      try {
        trackEvent('gallery_open', {
          event_category: 'engagement',
          event_label: app.application_name,
          application_id: app.application_id,
          template_id: templateID,
          total_images: combinedImages.length,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking gallery:', error);
      }

      setGalleryApp(app);
      setGalleryImages(combinedImages);
      setIsGalleryOpen(true);
    },
    [templateID],
  );

  const handleGalleryClose = useCallback(() => {
    setIsGalleryOpen(false);
    setTimeout(() => {
      setGalleryApp(null);
      setGalleryImages([]);
    }, 300);
  }, []);

  const handleApplicationView = useCallback(
    (app) => {
      if (!viewedApps.has(app.application_id)) {
        try {
          trackEvent('application_detail_click', {
            event_category: 'navigation',
            event_label: app.application_name,
            application_id: app.application_id,
            template_id: templateID,
          });
        } catch (error) {
          console.warn('[Analytics] Error tracking view:', error);
        }

        setViewedApps((prev) => new Set([...prev, app.application_id]));
      }
    },
    [templateID, viewedApps],
  );

  const handleModalClose = useCallback(() => {
    if (selectedApp) {
      try {
        trackEvent('order_modal_close', {
          event_category: 'ecommerce',
          event_label: 'modal_closed',
          application_id: selectedApp.application_id,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking modal close:', error);
      }
    }

    setIsModalOpen(false);
    setSelectedApp(null);
  }, [selectedApp]);

  if (!applications || applications.length === 0) {
    return (
      <div className="template-empty">
        <PageTracker pageName="template_empty" pageType="product_detail" />
        <section className="first">
          <Parallax bgColor="#0c0c1d" title="Template" planets="/sun.png" />
        </section>
        <section className="empty-state">
          <h2>Aucune application disponible</h2>
          <p>Ce template n&apos;a pas encore d&apos;applications associées.</p>
          <Link href="/templates" className="cta-button">
            Voir d&apos;autres templates
          </Link>
        </section>
      </div>
    );
  }

  const templateName = template?.template_name || 'Template';
  const hasPaymentMethods = platforms && platforms.length > 0;

  return (
    <div className="single-template-container">
      <PageTracker
        pageName={`template_${templateID}`}
        pageType="product_detail"
      />

      <section className="first">
        <Parallax
          bgColor="#0c0c1d"
          title={templateName.toUpperCase()}
          planets="/sun.png"
        />
      </section>

      <ApplicationsCarousel
        applications={applications}
        templateID={templateID}
        hasPaymentMethods={hasPaymentMethods}
        onOrderClick={handleOrderClick}
        onViewClick={handleApplicationView}
        onGalleryClick={handleGalleryClick}
      />

      {selectedApp && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          platforms={platforms}
          applicationId={selectedApp.application_id}
          applicationFee={selectedApp.application_fee}
        />
      )}

      {galleryApp && (
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={handleGalleryClose}
          images={galleryImages}
          applicationName={galleryApp.application_name}
        />
      )}
    </div>
  );
};

export default SingleTemplateShops;
