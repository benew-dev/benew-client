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

// =============================
// CONTENUS DES CATÉGORIES
// =============================
const categoryContents = {
  vision: {
    title: 'Notre Vision',
    paragraphs: [
      "Chez BeNew, nous croyons en l'innovation.",
      'Nous croyons en notre pouvoir à accomplir de grandes choses pour notre pays.',
      'Nous croyons en notre capacité à le transformer — et de nous élever avec lui.',
      '',
      'Nous croyons en notre potentiel à rivaliser avec les grandes nations.',
      "Nous croyons en la richesse de nos talents, prêts à s'exprimer pleinement.",
      '',
      "Dans un monde en pleine mutation, nous refusons l'attente.",
      "Nous choisissons d'être des catalyseurs, pas des suiveurs.",
      'Des créateurs, pas de simples consommateurs.',
      '',
      'Notre mission est claire : proposer des solutions modernes, innovantes et utiles.',
      "Et tracer la voie vers l'excellence, chaque jour un peu plus.",
      '',
      'Chez BeNew, nous croyons en vous.',
      'Et vous ? Croyez-vous en vous-même ?',
    ],
  },
  offre: {
    title: "L'offre",
    paragraphs: [
      "Nous vous proposons des magasins en ligne, appelés aussi boutiques e-commerce ou sites web e-commerce, sous forme d'abonnement.",
      '',
      "Notre offre est une première puisqu'elle permet de se concentrer pleinement sur votre affaire/métier sans se soucier de la complexité liée au bon fonctionnement du magasin.",
    ],
  },
  modeles: {
    title: 'Les modèles',
    paragraphs: [
      "Un modèle, dans notre cas, est un site web qui est à l'origine de plusieurs magasins. Chaque modèle sera à l'origine de plusieurs magasins de différents niveau et catégorie.",
      '',
      "Nos modèles sont identiques sur le fond car ils permettent tous de vendre tout type d'objet mais sont différents sur la forme (architecture, thème, …).",
      '',
      "Nous venons de publier notre premier modèle et nous comptons en publier d'autres.",
    ],
  },
  magasins: {
    title: 'Les magasins',
    paragraphs: [
      'Nos magasins, plus connus sous les appellations boutiques e-commerce ou sites web e-commerce, sont créés et adaptés pour Djibouti.',
      '',
      'Ils intègrent tous les moyens de paiement électronique mobile existants et sont accessibles financièrement.',
      '',
      'Chaque magasin aura une catégorie, site web ou application mobile, et un niveau qui sera déterminé par les fonctionnalités et les pages du magasin.',
      '',
      "Les différents niveaux sont, dans l'ordre croissant :",
      '• Magasin Simplifié – MS (le moins cher)',
      '• Magasin Standard – MS+',
      '• Magasin Supérieur – MS2+',
      '• Magasin Sophistiqué – MS*',
      '• Magasin Premium – MP (le plus cher)',
      '',
      "À chaque fois que l'on passe au niveau supérieur d'un magasin, des nouvelles fonctionnalités et des nouvelles pages s'ajoutent.",
      '',
      'Nous venons de lancer les premiers magasins de notre premier modèle.',
    ],
  },
  travail: {
    title: 'Le travail',
    paragraphs: [
      "Chez BeNew, nous croyons au travail bien fait et à l'excellence dans chaque détail.",
      '',
      "Notre équipe s'engage à fournir un accompagnement complet tout au long de votre parcours e-commerce.",
      '',
      'Du développement initial à la maintenance continue, nous sommes là pour assurer le succès de votre magasin en ligne.',
      '',
      "Notre approche collaborative nous permet de comprendre vos besoins spécifiques et d'y répondre avec des solutions sur mesure.",
    ],
  },
  technologies: {
    title: 'Les technologies',
    paragraphs: [
      'Nous utilisons les technologies les plus modernes et performantes pour garantir la fiabilité et la rapidité de nos magasins.',
      '',
      'Nos plateformes sont conçues avec des frameworks de pointe, assurant une expérience utilisateur fluide et sécurisée.',
      '',
      "L'intégration des moyens de paiement mobile locaux est au cœur de notre approche technologique, permettant à vos clients de payer facilement et en toute sécurité.",
      '',
      "Nous restons constamment à l'écoute des évolutions technologiques pour vous offrir le meilleur du web moderne.",
    ],
  },
  formule: {
    title: 'La formule',
    paragraphs: [
      "Notre formule d'abonnement est simple et transparente.",
      '',
      'Vous choisissez le niveau de magasin qui correspond à vos besoins, et nous nous occupons de tout le reste : hébergement, maintenance, mises à jour et support technique.',
      '',
      'Pas de frais cachés, pas de surprises. Juste un service de qualité à un prix accessible.',
      '',
      "Cette formule vous permet de vous concentrer sur l'essentiel : développer votre activité et satisfaire vos clients.",
    ],
  },
  prix: {
    title: 'Le prix',
    paragraphs: [
      'Nos prix sont conçus pour être accessibles aux entreprises djiboutiennes de toutes tailles.',
      '',
      'Chaque niveau de magasin (MS, MS+, MS2+, MS*, MP) correspond à un tarif mensuel adapté aux fonctionnalités proposées.',
      '',
      "Notre objectif est de démocratiser l'accès au e-commerce à Djibouti en proposant des solutions professionnelles à des prix compétitifs.",
      '',
      'Contactez-nous pour obtenir un devis personnalisé selon vos besoins spécifiques.',
    ],
  },
};

// Données des catégories avec leurs contenus associés
const categories = [
  { id: 'offre', title: "L'offre", icon: '🚀', contentKey: 'offre' },
  { id: 'modeles', title: 'Les modèles', icon: '☀️', contentKey: 'modeles' },
  { id: 'magasins', title: 'Les magasins', icon: '🪐', contentKey: 'magasins' },
  { id: 'travail', title: 'Le travail', icon: '☄️', contentKey: 'travail' },
  {
    id: 'technologies',
    title: 'Les technologies',
    icon: '🛸',
    contentKey: 'technologies',
  },
  { id: 'formule', title: 'La formule', icon: '🌌', contentKey: 'formule' },
  { id: 'prix', title: 'Le prix', icon: '💰', contentKey: 'prix' },
];

const PresentationComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // Ouvrir le modal pour la carte "SKY IS THE LIMIT"
  const handleCardClick = () => {
    trackEvent('presentation_modal_open', {
      event_category: 'presentation',
      event_label: 'sky_is_the_limit',
      modal_type: 'vision',
      page_section: 'main_card',
    });

    setModalContent(categoryContents.vision);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour une catégorie spécifique
  const handleCategoryClick = (category) => {
    trackEvent('presentation_category_click', {
      event_category: 'presentation',
      event_label: category.id,
      category_type: category.id,
      page_section: 'categories',
    });

    // Charger le contenu de la catégorie
    setModalContent(categoryContents[category.contentKey]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    trackEvent('presentation_modal_close', {
      event_category: 'presentation',
      event_label: modalContent?.title || 'unknown',
      modal_type: modalContent?.title || 'unknown',
    });

    setIsModalOpen(false);
    // Réinitialiser le contenu après la fermeture (optionnel)
    setTimeout(() => setModalContent(null), 300);
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

      {/* SECTION 3: Grille des catégories - CLASSE SUPPLÉMENTAIRE */}
      <section className="others categories-section">
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
                onClick={() => handleCategoryClick(category)}
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
        content={modalContent}
      />
    </>
  );
};

export default PresentationComponent;
