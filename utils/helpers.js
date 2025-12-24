// utils/helpers.js

/**
 * Formate un prix avec séparateurs de milliers
 * @param {number} price - Prix à formater
 * @returns {string} Prix formaté
 */

// Méthode pour formater les prix avec K si nécessaire
export const formatPrice = (price) => {
  // Convertir en nombre si c'est une string
  const numPrice = typeof price === 'string' ? parseInt(price) : price;

  // Vérifier si le nombre est divisible par 1000
  if (numPrice >= 1000 && numPrice % 1000 === 0) {
    return `${numPrice / 1000} K`;
  }
  // Vérifier si le nombre est supérieur à 1000 mais pas exactement divisible
  else if (numPrice >= 1000) {
    const kValue = numPrice / 1000;
    // Si c'est un nombre décimal, garder une décimale
    return kValue % 1 === 0 ? `${kValue} K` : `${kValue.toFixed(1)} K`;
  }
  // Retourner le nombre original si moins de 1000
  else {
    return numPrice.toString();
  }
};

/**
 * Retourne le label complet d'un niveau d'application
 * @param {number} level - Niveau d'application (1-5)
 * @returns {object} { short: string, long: string }
 */
export function getApplicationLevelLabel(level) {
  const levels = {
    1: {
      short: 'MS',
      long: 'Magasin Simplifié',
    },
    2: {
      short: 'MS+',
      long: 'Magasin Standard',
    },
    3: {
      short: 'MS2+',
      long: 'Magasin Supérieur',
    },
    4: {
      short: 'MS*',
      long: 'Magasin Sophistiqué',
    },
    5: {
      short: 'MP',
      long: 'Magasin Premium',
    },
  };

  return levels[level] || { short: 'MS', long: 'MS / Magasin Simplifié' };
}

/**
 * Valide un UUID v4
 * @param {string} uuid - UUID à valider
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Formatte une date en français
 * @param {string|Date} date - Date à formatter
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Génère un ID unique côté client
 * @returns {string}
 */
export function generateClientId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vérifie si une URL est valide
 * @param {string} url - URL à vérifier
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retourne le nom de la plateforme de paiement formaté
 * @param {object} platform - Objet plateforme
 * @returns {string}
 */
export function getPlatformDisplayName(platform) {
  if (!platform) return '';

  if (platform.is_cash_payment) {
    return 'Paiement en Espèces (CASH)';
  }

  return platform.platform_name;
}

/**
 * Vérifie si un objet est vide
 * @param {object} obj - Objet à vérifier
 * @returns {boolean}
 */
export function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}
