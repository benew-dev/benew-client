// instrumentation.js
// Configuration Sentry Next.js 15 - Architecture 3 fichiers séparés
// Hook officiel Next.js 15 pour monitoring serveur
// E-commerce Djibouti - 500 utilisateurs/jour

// =============================================
// HOOK NEXT.JS 15 - INITIALISATION SERVEUR
// =============================================

/**
 * Fonction register() appelée une seule fois au démarrage du serveur Next.js
 * Architecture recommandée Sentry : imports conditionnels selon runtime
 */
export async function register() {
  // Initialisation serveur Node.js
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 Loading Sentry server configuration...');
    await import('./sentry.server.config');
  }

  // Initialisation Edge Runtime (si nécessaire)
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('🔧 Loading Sentry edge configuration...');
    // Note: Pas de config edge pour l'instant
    // Décommenter si besoin : await import('./sentry.edge.config');
  }

  console.log('✅ Sentry instrumentation registered successfully');
}

// =============================================
// HOOK NEXT.JS 15 - CAPTURE ERREURS REQUÊTES
// =============================================

/**
 * onRequestError : Hook Next.js 15 pour capturer automatiquement
 * toutes les erreurs de requêtes serveur (RSC, Server Actions, API Routes)
 *
 * Documentation : https://nextjs.org/docs/app/guides/instrumentation
 */
export const onRequestError = async (err, request, context) => {
  // Import dynamique de Sentry pour éviter problèmes de bundle
  const Sentry = await import('@sentry/nextjs');

  // Capturer l'erreur avec contexte Next.js 15
  Sentry.captureRequestError(err, request, context);
};

// =============================================
// NOTES IMPORTANTES
// =============================================

/**
 * ARCHITECTURE 3 FICHIERS SÉPARÉS :
 *
 * 1. instrumentation.js (ce fichier)
 *    - Hook Next.js 15 officiel
 *    - Import des configs serveur/edge
 *    - Capture erreurs via onRequestError
 *
 * 2. instrumentation-client.js
 *    - Configuration Sentry côté navigateur
 *    - Chargé automatiquement par Next.js
 *
 * 3. sentry.server.config.js
 *    - Configuration Sentry côté serveur
 *    - Importé par instrumentation.js
 *
 * POURQUOI CETTE ARCHITECTURE ?
 * - Séparation claire client/serveur
 * - Recommandée par documentation Sentry officielle
 * - Compatible Next.js 15 + Sentry v10+
 * - Évite les problèmes de bundle/tree-shaking
 */
