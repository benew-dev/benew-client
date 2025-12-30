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

import OrderModal from '../modal/OrderModal';
import { formatPrice, getApplicationLevelLabel } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';

// Composant Carousel pour les images d'application
const ApplicationImageCarousel = memo(({ images, applicationName }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fallback si pas d'images
  const imageList = useMemo(() => {
    if (!images || images.length === 0) {
      return ['/placeholder-application.png'];
    }
    return images;
  }, [images]);

  // Auto-scroll avec 4 secondes d'intervalle
  useEffect(() => {
    if (!isAutoScrolling || imageList.length <= 1 || isTransitioning) {
      return;
    }

    const interval = setInterval(() => {
      handleSlideChange((currentSlide + 1) % imageList.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, imageList.length, currentSlide, isTransitioning]);

  // Reprendre l'auto-scroll après 10 secondes d'inactivité
  useEffect(() => {
    if (!isAutoScrolling) {
      const timeout = setTimeout(() => {
        setIsAutoScrolling(true);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isAutoScrolling]);

  // Gérer le changement de slide avec animation
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

  // Navigation manuelle via dots
  const goToSlide = useCallback(
    (index) => {
      if (index === currentSlide || isTransitioning) return;
      setIsAutoScrolling(false);
      handleSlideChange(index);
    },
    [currentSlide, isTransitioning, handleSlideChange],
  );

  // Gestion du swipe tactile
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
      handleSlideChange((currentSlide + 1) % imageList.length);
    } else if (isRightSwipe) {
      setIsAutoScrolling(false);
      handleSlideChange(
        (currentSlide - 1 + imageList.length) % imageList.length,
      );
    }
  }, [
    touchStart,
    touchEnd,
    currentSlide,
    imageList.length,
    isTransitioning,
    handleSlideChange,
  ]);

  // Si une seule image, pas besoin de carousel
  if (imageList.length === 1) {
    return (
      <div className="card-image">
        <CldImage
          src={imageList[0]}
          alt={applicationName}
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
    );
  }

  return (
    <div
      className="card-image carousel-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Images avec animation de défilement */}
      <div className="carousel-track">
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
            <div key={index} className={`carousel-slide ${slidePosition}`}>
              <CldImage
                src={imgUrl}
                alt={`${applicationName} - Image ${index + 1}`}
                width={400}
                height={200}
                className="app-image"
                loading={index === 0 ? 'eager' : 'lazy'}
                quality="auto"
                format="auto"
                crop={{ type: 'fit', gravity: 'auto' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-application.png';
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Indicateurs (dots) */}
      {imageList.length > 1 && (
        <div className="carousel-indicators">
          {imageList.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              aria-label={`Aller à l'image ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}
    </div>
  );
});

ApplicationImageCarousel.displayName = 'ApplicationImageCarousel';

// =============================
// ✅ COMPOSANT GALLERYMODAL CORRIGÉ - DIMENSIONS 120x120
// =============================
// Remplace le composant GalleryModal existant dans SingleTemplateShops.jsx
// LIGNE ~52 à ~143 environ

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

  // ✅ AUTO-SCROLL : Navigation automatique toutes les 4 secondes
  useEffect(() => {
    if (!isOpen || !images || images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }, 4000); // 4 secondes

    return () => clearInterval(interval);
  }, [isOpen, images]);

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div
        className="gallery-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ BOUTON FERMETURE - Position absolue */}
        <button
          className="gallery-close-btn"
          onClick={onClose}
          aria-label="Fermer la galerie"
        >
          <FaX />
        </button>

        {/* ✅ HEADER RESTRUCTURÉ - Titre + Compteur groupés */}
        <div className="gallery-header">
          <div className="gallery-header-left">
            <h3>{applicationName} - Galerie</h3>
            <p className="gallery-counter">
              {selectedImage + 1} / {images.length}
            </p>
          </div>
        </div>

        {/* ✅ BODY - Layout adaptatif (vertical mobile/tablet, horizontal desktop) */}
        <div className="gallery-body">
          {/* ✅ THUMBNAILS - Images CARRÉES 120x120 pour remplir tout l'espace */}
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

          {/* ✅ IMAGE CONTAINER - Prend l'espace restant */}
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

            {/* ✅ NAVIGATION SUPPRIMÉE - Uniquement via thumbnails + auto-scroll */}
          </div>
        </div>
      </div>
    </div>
  );
});

GalleryModal.displayName = 'GalleryModal';

// Composant de carte d'application mémorisé
const ApplicationCard = memo(
  ({
    app,
    templateID,
    onOrderClick,
    onViewClick,
    onGalleryClick,
    hasPaymentMethods,
  }) => {
    const hasOtherVersions =
      app.application_other_versions &&
      app.application_other_versions.length > 0;

    return (
      <div
        className="application-card"
        data-app-id={app.application_id}
        data-app-name={app.application_name}
      >
        <ApplicationImageCarousel
          images={app.application_images}
          applicationName={app.application_name}
        />

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

            {hasOtherVersions && (
              <button
                className="btn btn-gallery"
                onClick={() => onGalleryClick(app)}
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

// Composant principal
const SingleTemplateShops = ({
  templateID,
  applications = [],
  platforms = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewedApps, setViewedApps] = useState(new Set());
  const [galleryApp, setGalleryApp] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Tracking de la vue de la page
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

  // Handler pour l'ouverture de la modal de commande
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

  // Handler pour la galerie
  const handleGalleryClick = useCallback(
    (app) => {
      try {
        trackEvent('gallery_open', {
          event_category: 'engagement',
          event_label: app.application_name,
          application_id: app.application_id,
          template_id: templateID,
          versions_count: app.application_other_versions?.length || 0,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking gallery:', error);
      }

      setGalleryApp(app);
      setIsGalleryOpen(true);
    },
    [templateID],
  );

  // Handler pour fermer la galerie
  const handleGalleryClose = useCallback(() => {
    setIsGalleryOpen(false);
    setTimeout(() => setGalleryApp(null), 300);
  }, []);

  // Handler pour voir les détails
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

  // Handler pour fermer la modal
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

  // Gestion de l'état vide
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

  const templateName = applications[0]?.template_name || 'Template';
  const hasPaymentMethods = platforms && platforms.length > 0;

  return (
    <div className="single-template-container">
      <PageTracker
        pageName={`template_${templateID}`}
        pageType="product_detail"
      />

      <section className="first">
        <Parallax bgColor="#0c0c1d" title={templateName} planets="/sun.png" />
      </section>

      <div className="applications-list">
        {applications.map((app) => (
          <section
            key={app.application_id}
            className="others projectSection"
            role="article"
          >
            <ApplicationCard
              app={app}
              templateID={templateID}
              onOrderClick={handleOrderClick}
              onViewClick={handleApplicationView}
              onGalleryClick={handleGalleryClick}
              hasPaymentMethods={hasPaymentMethods}
            />
          </section>
        ))}
      </div>

      {/* Modal de commande */}
      {selectedApp && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          platforms={platforms}
          applicationId={selectedApp.application_id}
          applicationFee={selectedApp.application_fee}
        />
      )}

      {/* Modal Gallery */}
      {galleryApp && (
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={handleGalleryClose}
          images={galleryApp.application_other_versions}
          applicationName={galleryApp.application_name}
        />
      )}
    </div>
  );
};

export default SingleTemplateShops;
