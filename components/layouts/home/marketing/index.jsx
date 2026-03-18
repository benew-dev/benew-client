'use client';

import './index.scss';
import Image from 'next/image';
import Link from 'next/link';

const MarketingHome = () => {
  return (
    <div className="main-content">
      {/* BLOC 1 - Tirelire */}
      <Image
        src="/tirelire.png"
        alt="Tirelire symbolisant l'économie et les profits"
        width={256}
        height={384}
        className="profit-image"
        priority
        unoptimized
      />

      {/* BLOC 2 - Titres + Bouton */}
      <div className="text-container">
        <h2 className="main-title">GÉNÈRES PLUS DE PROFIT,</h2>
        <h2 className="main-title">PAIES MOINS DE CHARGES</h2>

        <Link href="/blog" className="profit-blog-link">
          En savoir plus
        </Link>
      </div>

      {/* BLOC 3 - Image croissance */}
      <Image
        src="/homepage/croissance.png"
        alt="Graphique de croissance"
        width={190}
        height={190}
        className="deco-image deco-croissance"
        unoptimized
      />

      {/* BLOC 4 - Image île */}
      <Image
        src="/homepage/ile.png"
        alt="Île tropicale"
        width={190}
        height={190}
        className="deco-image deco-ile"
        unoptimized
      />

      {/* BLOC 5 - Image globe */}
      <Image
        src="/homepage/globe_voyage.png"
        alt="Globe voyage"
        width={190}
        height={190}
        className="deco-image deco-globe"
        unoptimized
      />
    </div>
  );
};

export default MarketingHome;
