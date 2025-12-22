import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// CONFIGURATION OPTIMISÉE POUR NEXT.JS 15.5.9
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

// ===== VALIDATION INTELLIGENTE DES VARIABLES D'ENVIRONNEMENT =====
const validateEnv = () => {
  // 🔍 DÉTECTION DU CONTEXTE D'EXÉCUTION
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const IS_CI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const IS_BUILD_PHASE = process.env.NEXT_PHASE === 'phase-production-build';

  console.log(`🔍 Environment Detection:
    - NODE_ENV: ${NODE_ENV}
    - IS_CI: ${IS_CI}
    - IS_BUILD_PHASE: ${IS_BUILD_PHASE}
    - GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS}
  `);

  // 📋 CATÉGORISATION DES VARIABLES
  const BUILD_TIME_VARS = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_API_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_GTM_CONTAINER_ID',
    'NEXT_PUBLIC_SENTRY_DSN',
  ];

  const RUNTIME_VARS = [
    'CLOUDINARY_API_SECRET',
    'DB_USER_NAME',
    'DB_HOST_NAME',
    'DB_NAME',
    'DB_PASSWORD',
    'DB_PORT',
    'CLIENT_EXISTENCE',
    'CONNECTION_TIMEOUT',
    'MAXIMUM_CLIENTS',
    'SENTRY_PROJECT',
    'SENTRY_ORG',
    'SENTRY_AUTH_TOKEN',
    'SENTRY_URL',
    'SENTRY_RELEASE',
    'ANALYZE',
    'SENTRY_DEBUG',
    'SENTRY_IGNORE_API_RESOLUTION_ERROR',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'RESEND_TO_EMAIL',
  ];

  const ALWAYS_REQUIRED = ['NODE_ENV'];

  // 🎯 LOGIQUE DE VALIDATION SELON LE CONTEXTE
  let requiredVars = [];

  if (NODE_ENV === 'development') {
    // 🔧 DÉVELOPPEMENT : Validation complète mais permissive
    requiredVars = [...ALWAYS_REQUIRED, ...RUNTIME_VARS];
    console.log('🔧 Dev mode: Validating ALWAYS_REQUIRED + RUNTIME_VARS');
  } else if (IS_CI && NODE_ENV === 'production') {
    // 🏗️ BUILD CI/CD : Seulement les variables nécessaires au build
    requiredVars = [...ALWAYS_REQUIRED, ...BUILD_TIME_VARS];
    console.log(
      '🏗️ CI Build mode: Validating ALWAYS_REQUIRED + BUILD_TIME_VARS',
    );
  } else if (NODE_ENV === 'production' && !IS_CI) {
    // 🚀 PRODUCTION RUNTIME : Validation complète
    requiredVars = [...ALWAYS_REQUIRED, ...RUNTIME_VARS, ...BUILD_TIME_VARS];
    console.log('🚀 Production runtime: Validating ALL variables');
  }

  // ✅ VÉRIFICATION DES VARIABLES
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    const context = IS_CI ? 'CI Build' : NODE_ENV;
    console.warn(
      `⚠️ [${context}] Missing environment variables: ${missingVars.join(', ')}`,
    );

    // 🛡️ ÉCHEC STRICT EN PRODUCTION RUNTIME SEULEMENT
    if (NODE_ENV === 'production' && !IS_CI) {
      throw new Error(
        `❌ Production runtime failed: Missing critical environment variables: ${missingVars.join(', ')}`,
      );
    }

    // 🔧 DÉVELOPPEMENT : Warning seulement
    if (NODE_ENV === 'development') {
      console.log('🔧 Development mode: Continuing with missing variables...');
    }
  } else {
    const context = IS_CI ? 'CI Build' : NODE_ENV;
    console.log(
      `✅ [${context}] All required environment variables are present`,
    );
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🚀 EXÉCUTER LA VALIDATION
validateEnv();

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  analyzerMode: 'static',
  openAnalyzer: false,
});

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // ===== CONFIGURATION CLOUDINARY OPTIMISÉE =====
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 1 jour
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // ✅ OPTIMISATION CLOUDINARY : Loader custom pour optimisations automatiques
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.js',
    unoptimized: false,
  },

  // ===== OPTIMISATION DU COMPILATEUR =====
  compiler: {
    // Suppression des console.log en production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn', 'log'],
          }
        : false,

    // Suppression des props de test en production
    reactRemoveProperties:
      process.env.NODE_ENV === 'production'
        ? {
            properties: ['^data-testid$', '^data-test$', '^data-cy$'],
          }
        : false,

    // Optimisation React en production
    emotion: process.env.NODE_ENV === 'production',
  },

  // Timeout pour la génération de pages statiques
  staticPageGenerationTimeout: 60,

  // ===== HEADERS HTTP - CSP SIMPLIFIÉ (4 CONFIGURATIONS AU LIEU DE 14) =====
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Headers de sécurité de base réutilisables
    const baseSecurityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-site',
      },
      {
        key: 'Permissions-Policy',
        value:
          'geolocation=(), microphone=(), camera=(), payment=(self), usb=()',
      },
    ];

    // HSTS en production uniquement
    const hstsHeader =
      process.env.NODE_ENV === 'production'
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : [];

    // CSP pour pages HTML avec contenu dynamique
    const buildDynamicPageCSP = (includeAnalytics = false) => {
      const baseCSP = [
        "default-src 'self'",
        `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline'${includeAnalytics ? ' https://*.googletagmanager.com https://*.google-analytics.com' : ''}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        `img-src 'self' https://res.cloudinary.com${includeAnalytics ? ' https://www.google-analytics.com https://www.googletagmanager.com' : ''} data:`,
        "font-src 'self' https://fonts.gstatic.com",
        `connect-src 'self'${includeAnalytics ? ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net' : ''}`,
        "worker-src 'self' blob:",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
      ];
      return baseCSP.join('; ');
    };

    return [
      // ===== 1. HEADERS GLOBAUX POUR TOUTES LES ROUTES =====
      {
        source: '/(.*)',
        headers: [
          ...baseSecurityHeaders,
          ...hstsHeader,
          {
            key: 'Content-Security-Policy',
            value: buildDynamicPageCSP(false),
          },
        ],
      },

      // ===== 2. ASSETS STATIQUES (Cache optimisé + Sécurité) =====
      {
        source:
          '/:path*\\.(js|css|woff|woff2|eot|ttf|otf|json|xml|txt|ico|manifest|png|jpg|jpeg|gif|webp|svg|avif)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },

      // ===== 3. NEXT.JS STATIC ASSETS + SERVER ACTIONS =====
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'none'; script-src 'self' ${isDev ? "'unsafe-eval'" : ''}; connect-src 'self'`,
          },
        ],
      },

      // ===== 4. PAGE D'ACCUEIL AVEC ANALYTICS =====
      {
        source: '/',
        headers: [
          ...baseSecurityHeaders,
          ...hstsHeader,
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
          {
            key: 'Content-Security-Policy',
            value: buildDynamicPageCSP(true),
          },
        ],
      },
    ];
  },

  // ===== REDIRECTIONS SEO =====
  async redirects() {
    return [
      // Canonicalisation des URLs
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blog/',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/templates/',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/contact/',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/presentation/',
        destination: '/presentation',
        permanent: true,
      },

      // URLs avec variantes courantes
      {
        source: '/template/:id',
        destination: '/templates/:id',
        permanent: true,
      },
      {
        source: '/article/:id',
        destination: '/blog/:id',
        permanent: true,
      },
      {
        source: '/post/:id',
        destination: '/blog/:id',
        permanent: true,
      },

      // Nettoyage des paramètres UTM
      {
        source: '/blog/:path*',
        has: [
          {
            type: 'query',
            key: 'utm_source',
          },
        ],
        destination: '/blog/:path*',
        permanent: false,
      },
      {
        source: '/templates/:path*',
        has: [
          {
            type: 'query',
            key: 'utm_source',
          },
        ],
        destination: '/templates/:path*',
        permanent: false,
      },

      // Redirections business logiques
      {
        source: '/commande',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/order',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/boutique',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/apps',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/applications',
        destination: '/templates',
        permanent: true,
      },

      // Gestion des erreurs courantes
      {
        source: '/templates/:id/app/:appId',
        destination: '/templates/:id/applications/:appId',
        permanent: true,
      },
      {
        source: '/template/:id/applications/:appId',
        destination: '/templates/:id/applications/:appId',
        permanent: true,
      },
    ];
  },

  // ===== CONFIGURATION WEBPACK SIMPLIFIÉE (DEFAULTS NEXT.JS 15) =====
  webpack: (config, { isServer }) => {
    // Alias pour améliorer les performances de résolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Optimisation pour les bibliothèques externes
    if (isServer) {
      config.externals = [...config.externals, 'pg-native'];
    }

    return config;
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // 🎯 CONFIGURATION STANDALONE CONDITIONNELLE
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Optimisation des logs
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

// Configuration Sentry optimisée
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || 'benew',
  project: process.env.SENTRY_PROJECT || 'benew-client',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  dryRun:
    process.env.NODE_ENV !== 'production' || !process.env.SENTRY_AUTH_TOKEN,
  debug: process.env.NODE_ENV === 'development',

  include: '.next',
  ignore: ['node_modules', '*.map'],

  release: process.env.SENTRY_RELEASE || '1.0.0',
  deploy: {
    env: process.env.NODE_ENV,
  },
};

export default withSentryConfig(
  bundleAnalyzer(nextConfig),
  sentryWebpackPluginOptions,
);
