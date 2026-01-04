// components/templates/TemplatesList.jsx
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { MdMonitor, MdPhoneIphone } from 'react-icons/md';
import './templatesStyles/index.scss';

import ParallaxSkeleton from '../layouts/parallax/ParallaxSkeleton';
const Parallax = dynamic(() => import('components/layouts/parallax'), {
  loading: () => <ParallaxSkeleton />,
  ssr: true,
});

import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';

// Composant Carousel pour les images du template
const TemplateImageCarousel = memo(({ images, templateName }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fallback si pas d'images
  const imageList = useMemo(() => {
    if (!images || images.length === 0) {
      return ['/placeholder-template.png'];
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

      // Fin de la transition après 600ms (durée de l'animation CSS)
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
      <div className="minimalImageContainer">
        <CldImage
          src={imageList[0]}
          alt={`Template ${templateName}`}
          width={520}
          height={460}
          className="minimalImage"
          loading="lazy"
          quality="auto"
          format="auto"
          crop={{ type: 'fit', gravity: 'auto' }}
          onError={(e) => {
            e.currentTarget.src = '/placeholder-template.png';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="minimalImageContainer carousel-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Images avec animation de défilement */}
      <div className="carousel-track">
        {imageList.map((imgUrl, index) => {
          // Déterminer la position de chaque slide
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
                alt={`${templateName} - Image ${index + 1}`}
                width={520}
                height={460}
                className="minimalImage"
                loading={index === 0 ? 'eager' : 'lazy'}
                quality="auto"
                format="auto"
                crop={{ type: 'fit', gravity: 'auto' }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-template.png';
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Indicateurs (dots) - Toujours visibles */}
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

TemplateImageCarousel.displayName = 'TemplateImageCarousel';

// Composant de carte avec Link uniquement sur le titre
const TemplateCard = memo(({ template, onClick }) => {
  const categoryIcons = [];
  const categoryLabel = [];

  if (template.template_has_web) {
    categoryIcons.push(<MdMonitor key="web" size={14} aria-hidden="true" />);
    categoryLabel.push('web');
  }
  if (template.template_has_mobile) {
    categoryIcons.push(
      <MdPhoneIphone key="mobile" size={14} aria-hidden="true" />,
    );
    categoryLabel.push('mobile');
  }

  return (
    <div
      className="minimalCard"
      aria-label={`Template ${template.template_name}`}
    >
      <div className="minimalCardInner">
        {/* Carousel SANS Link */}
        <TemplateImageCarousel
          images={template.template_images}
          templateName={template.template_name}
        />

        <div className="minimalContent">
          {/* Link UNIQUEMENT sur le titre avec indicateur visuel */}
          <Link
            href={`/templates/${template.template_id}`}
            className="minimalTitleLink"
            onClick={() => onClick(template)}
          >
            <h3 className="minimalTitle">{template.template_name}</h3>

            {/* ✅ INDICATEUR VISUEL ATTRACTIF */}
            <div className="view-details-indicator">
              <span className="indicator-text">Voir les détails</span>
              <svg
                className="indicator-arrow"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M1 8H15M15 8L8 1M15 8L8 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>

          {/* ✅ CATÉGORIE SOUS LE TITRE */}
          <div className="minimalCategory">
            {categoryIcons}
            <span>{categoryLabel.join(' & ')}</span>
          </div>

          {/* Affichage du nombre d'applications si > 0 */}
          {template.applications_count > 0 && (
            <div className="applications-count">
              <span className="count-badge">
                {template.applications_count} magasin
                {template.applications_count > 1 ? 's' : ''} disponible
                {template.applications_count > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TemplateCard.displayName = 'TemplateCard';

// Composant principal simplifié
const TemplatesList = ({ templates = [] }) => {
  const [viewedTemplates, setViewedTemplates] = useState(new Set());

  // Tracking de la page view
  useEffect(() => {
    if (templates.length > 0) {
      try {
        trackEvent('page_view', {
          event_category: 'templates',
          event_label: 'templates_list',
          templates_count: templates.length,
        });
      } catch (error) {
        console.warn('[Analytics] Error tracking page view:', error);
      }
    }
  }, [templates.length]);

  // Handler pour le clic sur un template
  const handleTemplateClick = useCallback(
    (template) => {
      if (!viewedTemplates.has(template.template_id)) {
        try {
          trackEvent('template_click', {
            event_category: 'ecommerce',
            event_label: template.template_name,
            template_id: template.template_id,
            template_name: template.template_name,
            applications_count: template.applications_count || 0,
          });

          setViewedTemplates(
            (prev) => new Set([...prev, template.template_id]),
          );
        } catch (error) {
          console.warn('[Analytics] Error tracking template click:', error);
        }
      }
    },
    [viewedTemplates],
  );

  // États vides
  if (!templates || templates.length === 0) {
    return (
      <>
        <PageTracker pageName="templates_list_empty" />
        <div className="templates-empty">
          <section className="first">
            <Parallax bgColor="#0c0c1d" title="Modeles" planets="/sun.png" />
          </section>
          <section className="empty-state">
            <h2>Aucun template disponible</h2>
            <p>Revenez bientôt pour découvrir nos nouveaux templates</p>
            <Link href="/" className="cta-button">
              Retour à l&apos;accueil
            </Link>
          </section>
        </div>
      </>
    );
  }

  // Rendu principal
  return (
    <div className="templates-container">
      <PageTracker pageName="templates_list" />
      <section className="first">
        <Parallax bgColor="#0c0c1d" title="Modeles" planets="/sun.png" />
      </section>

      <div className="templates-grid" role="list">
        {templates.map((template) => (
          <section
            key={template.template_id}
            className="others projectSection"
            role="listitem"
          >
            <TemplateCard template={template} onClick={handleTemplateClick} />
          </section>
        ))}
      </div>
    </div>
  );
};

export default TemplatesList;
