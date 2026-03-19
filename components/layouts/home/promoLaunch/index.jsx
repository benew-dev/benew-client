'use client';

import './index.scss';
import Link from 'next/link';
import { MdStorefront, MdStar, MdRocketLaunch } from 'react-icons/md';

const promoTiers = [
  {
    id: 1,
    icon: MdStar,
    rank: '10 premiers',
    months: 3,
    label: 'mois offerts',
    description: "Sans frais d'abonnement",
    color: 'orange',
    badge: 'Meilleure offre',
  },
  {
    id: 2,
    icon: MdRocketLaunch,
    rank: '10 suivants',
    months: 2,
    label: 'mois offerts',
    description: "Sans frais d'abonnement",
    color: 'pink',
    badge: 'Offre populaire',
  },
  {
    id: 3,
    icon: MdStorefront,
    rank: '10 derniers',
    months: 1,
    label: 'mois offert',
    description: "Sans frais d'abonnement",
    color: 'purple',
    badge: 'Offre de lancement',
  },
];

const PromoLaunch = () => {
  return (
    <div className="promo-container">
      {/* HEADER */}
      <div className="promo-header">
        <p className="promo-subtitle">Offre de bienvenue</p>
        <h2 className="promo-title">Lancement Exclusif</h2>
        <p className="promo-description">
          Pour les 30 premiers clients qui rejoignent l&apos;aventure, profitez
          de mois gratuits sans frais d&apos;abonnement.
        </p>
      </div>

      {/* CARTES */}
      <div className="promo-cards">
        {promoTiers.map((tier) => {
          const IconComponent = tier.icon;
          return (
            <div
              key={tier.id}
              className={`promo-card promo-card--${tier.color}`}
            >
              {/* Badge */}
              <div className="promo-card__badge">{tier.badge}</div>

              {/* Icône */}
              <div className="promo-card__icon">
                <IconComponent />
              </div>

              {/* Rang */}
              <p className="promo-card__rank">{tier.rank}</p>

              {/* Nombre de mois */}
              <div className="promo-card__months">
                <span className="promo-card__months-number">{tier.months}</span>
                <span className="promo-card__months-label">{tier.label}</span>
              </div>

              {/* Description */}
              <p className="promo-card__description">{tier.description}</p>
            </div>
          );
        })}
      </div>

      {/* BOUTON */}
      <div className="promo-cta">
        <Link href="/templates" className="promo-cta__button">
          Visiter la boutique
        </Link>
      </div>
    </div>
  );
};

export default PromoLaunch;
