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

  // Fallback si pas d'images
  const imageList = useMemo(() => {
    if (!images || images.length === 0) {
      return ['/placeholder-template.png'];
    }
    return images;
  }, [images]);

  // Auto-scroll avec 4 secondes d'intervalle
  useEffect(() => {
    if (!isAutoScrolling || imageList.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % imageList.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, imageList.length]);

  // Reprendre l'auto-scroll après 10 secondes d'inactivité
  useEffect(() => {
    if (!isAutoScrolling) {
      const timeout = setTimeout(() => {
        setIsAutoScrolling(true);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isAutoScrolling]);

  // Navigation manuelle
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsAutoScrolling(false);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % imageList.length);
    setIsAutoScrolling(false);
  }, [imageList.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + imageList.length) % imageList.length);
    setIsAutoScrolling(false);
  }, [imageList.length]);

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

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Si une seule image, pas besoin de carousel
  if (imageList.length === 1) {
    return (
      <div className="minimalImageContainer">
        <CldImage
          src={imageList[0]}
          alt={`Template ${templateName}`}
          width={800}
          height={600}
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
      {/* Images */}
      <div className="carousel-track">
        {imageList.map((imgUrl, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            style={{
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
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
        ))}
      </div>

      {/* Boutons de navigation (desktop) */}
      {imageList.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="carousel-button carousel-button-prev"
            aria-label="Image précédente"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="carousel-button carousel-button-next"
            aria-label="Image suivante"
          >
            ›
          </button>
        </>
      )}

      {/* Indicateurs (dots) */}
      {imageList.length > 1 && (
        <div className="carousel-indicators">
          {imageList.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TemplateImageCarousel.displayName = 'TemplateImageCarousel';

// Composant de carte simplifié avec carousel intégré
const TemplateCard = memo(({ template, onClick }) => {
  const categoryIcons = [];
  const categoryLabel = [];

  if (template.template_has_web) {
    categoryIcons.push(<MdMonitor key="web" size={14} aria-hidden="true" />);
    categoryLabel.push('Web');
  }
  if (template.template_has_mobile) {
    categoryIcons.push(
      <MdPhoneIphone key="mobile" size={14} aria-hidden="true" />,
    );
    categoryLabel.push('Mobile');
  }

  return (
    <Link
      href={`/templates/${template.template_id}`}
      className="minimalCard"
      onClick={() => onClick(template)}
      aria-label={`Voir le template ${template.template_name}`}
    >
      <div className="minimalCardInner">
        <TemplateImageCarousel
          images={template.template_images}
          templateName={template.template_name}
        />
        <div className="minimalContent">
          <div className="minimalCategory">
            {categoryIcons}
            <span>{categoryLabel.join(' & ')}</span>
          </div>
          <h3 className="minimalTitle">{template.template_name}</h3>

          {/* Affichage du nombre d'applications si > 0 */}
          {template.applications_count > 0 && (
            <div className="applications-count">
              <span className="count-badge">
                {template.applications_count} application
                {template.applications_count > 1 ? 's' : ''} disponible
                {template.applications_count > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
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
