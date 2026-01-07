'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import './index.scss';
import Image from 'next/image';

import ParallaxSkeleton from '../layouts/parallax/ParallaxSkeleton';
// Import dynamique des composants
const Parallax = dynamic(() => import('components/layouts/parallax'), {
  loading: () => <ParallaxSkeleton />,
  ssr: true,
});

import PresentationModal from 'components/modal/PresentationModal';
import PageTracker from '../analytics/PageTracker';
import { trackEvent } from '@/utils/analytics';

// Nouveau contenu unique pour le modal
const contentData = {
  title: 'Notre Vision',
  paragraphs: [
    "Chez BeNew, nous croyons en l'innovation.",
    'Nous croyons en notre capacité à accomplir de grandes choses pour notre pays.',
    'Nous croyons en notre pouvoir de le transformer — et de nous élever avec lui.',
    '',
    'Nous croyons en notre potentiel à rivaliser avec les grandes nations.',
    "Nous croyons en la richesse de nos talents, prêts à s'exprimer pleinement.",
    '',
    "Dans un monde en pleine mutation, nous refusons l'attente.",
    "Nous choisissons d'être des catalyseurs, pas des suiveurs.",
    'Des créateurs, pas de simples consommateurs.',
    '',
    "C'est pourquoi notre mission est claire : proposer des solutions modernes, innovantes et utiles.",
    "Et tracer la voie vers l'excellence, chaque jour un peu plus.",
    '',
    'Chez BeNew, nous croyons en vous.',
    'Et vous ? Croyez-vous en vous-même ?',
  ],
};

// Données des catégories
const categories = [
  { id: 'offre', title: "L'offre", icon: '🎁' },
  { id: 'modeles', title: 'Les modèles', icon: '📐' },
  { id: 'magasins', title: 'Les magasins', icon: '🏪' },
  { id: 'travail', title: 'Le travail', icon: '💼' },
  { id: 'technologies', title: 'Les technologies', icon: '⚙️' },
  { id: 'formule', title: 'La formule', icon: '🧪' },
  { id: 'prix', title: 'Le prix', icon: '💰' },
];

const PresentationComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    // ⭐ TRACKING MODAL OPEN
    trackEvent('presentation_modal_open', {
      event_category: 'presentation',
      event_label: 'sky_is_the_limit',
      modal_type: 'vision',
      page_section: 'main_card',
    });

    setIsModalOpen(true);
  };

  const handleCategoryClick = (categoryId) => {
    // ⭐ TRACKING CATEGORY CLICK
    trackEvent('presentation_category_click', {
      event_category: 'presentation',
      event_label: categoryId,
      category_type: categoryId,
      page_section: 'categories',
    });

    // TODO: Implémenter la navigation ou le modal pour chaque catégorie
    console.log(`Catégorie cliquée: ${categoryId}`);
  };

  const closeModal = () => {
    // ⭐ TRACKING MODAL CLOSE
    trackEvent('presentation_modal_close', {
      event_category: 'presentation',
      event_label: 'sky_is_the_limit',
      modal_type: 'vision',
    });

    setIsModalOpen(false);
  };

  return (
    <>
      {/* ⭐ PAGETRACKER */}
      <PageTracker
        pageName="presentation"
        pageType="informational"
        sections={[
          'hero_parallax',
          'presentation_card',
          'categories_grid',
          'modal_interaction',
        ]}
      />

      {/* SECTION 1: Parallax */}
      <section className="first">
        <Parallax bgColor="#0c0c1d" title="Presentation" planets="/sun.png" />
      </section>

      {/* SECTION 2: Carte SKY IS THE LIMIT */}
      <section className="others">
        {/* ✅ BACKGROUNDS OPTIMISÉS avec Next.js Image */}
        <div className="planets-background-container">
          <Image
            src="/planets.png"
            alt=""
            fill
            priority
            quality={75}
            style={{
              objectFit: 'cover',
              objectPosition: 'bottom',
            }}
          />
        </div>

        <div className="stars-container">
          <Image
            src="/stars.png"
            alt=""
            fill
            priority
            quality={60}
            style={{
              objectFit: 'cover',
              objectPosition: 'bottom',
            }}
          />
        </div>

        {/* Contenu principal */}
        <div className="presentation-content">
          {/* Titre BENEW */}
          <h1 className="benew-title">BENEW</h1>

          {/* Carte centrale cliquable */}
          <div className="sky-limit-card" onClick={handleCardClick}>
            <h2 className="sky-limit-text">SKY IS THE LIMIT</h2>
            <p className="card-hint">Lire →</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Grille des catégories */}
      <section className="others">
        {/* Backgrounds réutilisés */}
        <div className="planets-background-container">
          <Image
            src="/planets.png"
            alt=""
            fill
            priority={false}
            quality={75}
            style={{
              objectFit: 'cover',
              objectPosition: 'bottom',
            }}
          />
        </div>

        <div className="stars-container">
          <Image
            src="/stars.png"
            alt=""
            fill
            priority={false}
            quality={60}
            style={{
              objectFit: 'cover',
              objectPosition: 'bottom',
            }}
          />
        </div>

        {/* Contenu catégories */}
        <div className="categories-content">
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3 className="category-title">{category.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PresentationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        content={contentData}
      />
    </>
  );
};

export default PresentationComponent;
