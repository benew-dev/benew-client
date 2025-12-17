/**
 * CLOUDINARY CUSTOM LOADER
 * Optimisation automatique des images pour Next.js 15
 *
 * Fonctionnalités :
 * - Format automatique (AVIF/WebP selon le navigateur)
 * - Qualité adaptative
 * - Compression intelligente
 * - Lazy loading natif
 *
 * Économie attendue : ~30-40% de bande passante
 */

export default function cloudinaryLoader({ src, width, quality }) {
  // Si l'URL est déjà complète (contient https://), la retourner telle quelle
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.warn(
      "⚠️ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME non défini, utilisation de l'URL source brute"
    );
    return src;
  }

  // Paramètres d'optimisation Cloudinary
  const params = [
    "f_auto", // Format automatique (AVIF/WebP/etc.)
    "c_limit", // Crop mode: limiter les dimensions sans déformer
    `w_${width}`, // Largeur responsive
    `q_${quality || "auto"}`, // Qualité auto ou spécifique
    "dpr_auto", // Device Pixel Ratio automatique (Retina, etc.)
  ];

  // Construire l'URL Cloudinary optimisée
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(",")}${normalizedSrc}`;
}
