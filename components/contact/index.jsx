'use client';

import './styles/index.scss';
import { useRef, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  MdMail,
  MdPhone,
  MdWhatsapp,
  MdKeyboardArrowDown,
  MdContactPage,
} from 'react-icons/md';

import FormContainer from './formContainer';
import ContactInfoModal from './ContactInfoModal';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';
import Parallax from '../layouts/parallax';

// Composant d'en-tête de contact mémorisé
const ContactHeader = memo(({ isCollapsed, onToggle }) => (
  <div className="collapsible-header" onClick={onToggle}>
    <h2>Coordonnées</h2>
    <MdKeyboardArrowDown
      className={`toggle-icon ${!isCollapsed ? 'open' : ''}`}
    />
  </div>
));

ContactHeader.displayName = 'ContactHeader';

// Composant d'élément de contact mémorisé
const ContactItem = memo(({ icon: Icon, text, variants }) => (
  <motion.div className="item" variants={variants}>
    <div className="icon">
      <Icon />
    </div>
    <p>{text}</p>
  </motion.div>
));

ContactItem.displayName = 'ContactItem';

// Composant des informations de contact mémorisé
const ContactInfo = memo(({ isCollapsed, variants }) => (
  <div className={`collapsible-content ${!isCollapsed ? 'open' : ''}`}>
    <div className="content-wrapper">
      {/* Titre principal - Desktop uniquement */}
      <motion.h1 variants={variants}>Coordonnées</motion.h1>

      <ContactItem icon={MdPhone} text="77.86.00.64" variants={variants} />

      <ContactItem icon={MdWhatsapp} text="77.86.00.64" variants={variants} />

      <ContactItem icon={MdMail} text="benew@gmail.com" variants={variants} />
    </div>
  </div>
));

ContactInfo.displayName = 'ContactInfo';

// Animations simplifiées
const variants = {
  initial: {
    y: 500,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

// Composant principal
const Contact = () => {
  const ref = useRef();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handler pour le toggle optimisé
  const handleToggle = useCallback(() => {
    trackEvent('contact_info_toggle', {
      event_category: 'contact',
      event_label: isCollapsed ? 'expand' : 'collapse',
      action: isCollapsed ? 'expand' : 'collapse',
    });

    setIsCollapsed((prev) => !prev);
  }, [isCollapsed]);

  // 🆕 Handler pour l'ouverture de la modal
  const handleOpenModal = useCallback(() => {
    trackEvent('contact_info_modal_open', {
      event_category: 'contact',
      event_label: 'modal_opened',
      trigger: 'button_click',
    });

    setIsModalOpen(true);
  }, []);

  // 🆕 Handler pour la fermeture de la modal
  const handleCloseModal = useCallback(() => {
    trackEvent('contact_info_modal_close', {
      event_category: 'contact',
      event_label: 'modal_closed',
    });

    setIsModalOpen(false);
  }, []);

  return (
    <div>
      <PageTracker
        pageName="contact"
        pageType="conversion"
        sections={[
          'hero_parallax',
          'contact_form',
          'contact_info',
          'form_interactions',
        ]}
      />

      <section className="first">
        <Parallax bgColor="#0c0c1d" title="Contact" planets="/planets.png" />
      </section>

      <section className="others">
        {/* 🆕 BOUTON FIXE - Visible uniquement sur mobile/tablette */}
        <button
          className="contact-info-trigger"
          onClick={handleOpenModal}
          aria-label="Afficher les coordonnées"
        >
          <MdContactPage />
          Coordonnées
        </button>

        {/* 🆕 MODAL COORDONNÉES - Visible uniquement sur mobile/tablette */}
        <ContactInfoModal isOpen={isModalOpen} onClose={handleCloseModal} />

        <motion.div
          ref={ref}
          className="contact"
          variants={variants}
          initial="initial"
          whileInView="animate"
        >
          {/* TextContainer - Visible uniquement sur DESKTOP */}
          <motion.div className="textContainer" variants={variants}>
            <ContactHeader isCollapsed={isCollapsed} onToggle={handleToggle} />

            <ContactInfo isCollapsed={isCollapsed} variants={variants} />
          </motion.div>

          {/* FormContainer - Toujours visible */}
          <FormContainer ref={ref} />
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
