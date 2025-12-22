// app/fonts.js
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

// =============================
// ORBITRON - Titres et UI (LOCAL)
// =============================
export const orbitron = localFont({
  src: [
    {
      path: './fonts/Orbitron-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Orbitron-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Orbitron-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/Orbitron-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/Orbitron-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/Orbitron-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-orbitron',
  display: 'swap',
  adjustFontFallback: 'Arial',
  preload: true,
});

// =============================
// INTER - Contenu et corps de texte (GOOGLE FONTS)
// =============================
// ✅ Utilise next/font/google - pas besoin de télécharger
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});
