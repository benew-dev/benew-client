'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdKeyboardArrowDown } from 'react-icons/md';

import './index.scss';

export default function Navbar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setOpenDropdown(null);
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const menuVariants = {
    open: { opacity: 1, y: 0, display: 'flex' },
    closed: { opacity: 0, y: -10, transitionEnd: { display: 'none' } },
  };

  return (
    <nav className="navbar">
      <div className="navbar-wrapper">
        {/* LOGO */}
        <Link href="/" className="navbar-logo" aria-label="Accueil BENEW">
          <Image
            src="/icon-64x64.png"
            alt="Logo BENEW"
            width={60}
            height={60}
            priority
          />
        </Link>

        {/* LIENS DESKTOP */}
        <div className="navbar-links-desktop">
          <Link href="/" className="navbar-link">
            Accueil
          </Link>

          <Link href="/presentation" className="navbar-link">
            Présentation
          </Link>

          <div className="navbar-dropdown">
            <button className="navbar-link dropdown-trigger">
              Nos services
              <MdKeyboardArrowDown className="dropdown-icon" />
            </button>
            <div className="dropdown-content">
              <Link href="/templates" className="dropdown-link">
                Nos boutiques
              </Link>
              <Link href="/blog" className="dropdown-link">
                Blog
              </Link>
            </div>
          </div>

          <Link href="/contact" className="navbar-link">
            Contact
          </Link>
        </div>

        {/* RÉSEAUX SOCIAUX + HAMBURGER */}
        <div className="navbar-actions">
          {/* RÉSEAUX SOCIAUX DESKTOP */}
          <div className="social-links">
            <Link href="#" aria-label="Facebook">
              <Image
                src="/facebook.png"
                alt="Facebook logo"
                width={24}
                height={24}
              />
            </Link>
            <Link href="#" aria-label="Instagram">
              <Image
                src="/instagram.png"
                alt="Instagram logo"
                width={24}
                height={24}
              />
            </Link>
            <Link href="#" aria-label="TikTok">
              <Image
                src="/tiktok.png"
                alt="TikTok logo"
                width={24}
                height={24}
              />
            </Link>
          </div>

          {/* HAMBURGER MOBILE */}
          <button
            className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Menu mobile"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      <motion.div
        className="navbar-mobile-menu"
        initial="closed"
        animate={isMobileMenuOpen ? 'open' : 'closed'}
        variants={menuVariants}
        transition={{ duration: 0.3 }}
      >
        <div className="mobile-menu-content">
          {/* LIENS MOBILES */}
          <div className="mobile-links">
            <Link href="/" className="mobile-link" onClick={closeMobileMenu}>
              Accueil
            </Link>

            <Link
              href="/presentation"
              className="mobile-link"
              onClick={closeMobileMenu}
            >
              Présentation
            </Link>

            {/* DROPDOWN MOBILE */}
            <div className="mobile-dropdown">
              <button
                className="mobile-link dropdown-trigger-mobile"
                onClick={() => toggleDropdown('services')}
                aria-expanded={openDropdown === 'services'}
              >
                Nos services
                <MdKeyboardArrowDown
                  className={`dropdown-icon ${openDropdown === 'services' ? 'open' : ''}`}
                />
              </button>
              {openDropdown === 'services' && (
                <div className="mobile-dropdown-content">
                  <Link
                    href="/templates"
                    className="mobile-dropdown-link"
                    onClick={closeMobileMenu}
                  >
                    Nos boutiques
                  </Link>
                  <Link
                    href="/blog"
                    className="mobile-dropdown-link"
                    onClick={closeMobileMenu}
                  >
                    Blog
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              className="mobile-link"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </div>

          {/* RÉSEAUX SOCIAUX MOBILE */}
          <div className="mobile-social-links">
            <Link href="#" aria-label="Facebook" onClick={closeMobileMenu}>
              <Image
                src="/facebook.png"
                alt="Facebook logo"
                width={28}
                height={28}
              />
            </Link>
            <Link href="#" aria-label="Instagram" onClick={closeMobileMenu}>
              <Image
                src="/instagram.png"
                alt="Instagram logo"
                width={28}
                height={28}
              />
            </Link>
            <Link href="#" aria-label="TikTok" onClick={closeMobileMenu}>
              <Image
                src="/tiktok.png"
                alt="TikTok logo"
                width={28}
                height={28}
              />
            </Link>
          </div>
        </div>

        {/* BACKDROP */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-backdrop" onClick={closeMobileMenu}></div>
        )}
      </motion.div>
    </nav>
  );
}
