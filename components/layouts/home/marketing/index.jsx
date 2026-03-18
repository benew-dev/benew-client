'use client';

import './index.scss';
import Image from 'next/image';
import Link from 'next/link';

const MarketingHome = () => {
  return (
    <div className="main-content">
      <Image
        src="/tirelire.png"
        alt="Tirelire symbolisant l'économie et les profits"
        width={256}
        height={384}
        className="profit-image"
        priority
        unoptimized
      />

      <div className="text-container">
        <h2 className="main-title">GÉNÈRES PLUS DE PROFIT,</h2>
        <h2 className="main-title">PAIES MOINS DE CHARGES</h2>

        <Link href="/blog" className="profit-blog-link">
          En savoir plus
        </Link>

        {/* Croissance - en haut à droite des titres */}
        <Image
          src="/homepage/croissance.png"
          alt="Graphique de croissance"
          width={150}
          height={150}
          className="deco-image deco-croissance"
          unoptimized
        />

        {/* Île - en bas à gauche sous le bouton */}
        <Image
          src="/homepage/ile.png"
          alt="Île tropicale"
          width={150}
          height={150}
          className="deco-image deco-ile"
          unoptimized
        />

        {/* Globe - en bas à droite */}
        <Image
          src="/homepage/globe_voyage.png"
          alt="Globe voyage"
          width={150}
          height={150}
          className="deco-image deco-globe"
          unoptimized
        />
      </div>
    </div>
  );
};

export default MarketingHome;
