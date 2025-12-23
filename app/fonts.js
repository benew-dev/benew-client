// app/fonts.js
import localFont from 'next/font/local';

// =============================
// ORBITRON - Titres et UI
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
// INTER - Contenu et corps de texte (LOCAL)
// =============================
export const inter = localFont({
  src: [
    {
      path: './fonts/Inter_18pt-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Inter_18pt-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Inter_18pt-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/Inter_18pt-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: 'Arial',
  preload: true,
});
