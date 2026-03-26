'use server';

import { getClient } from '@/backend/dbConnect';
import { captureException, captureMessage } from '../sentry.server.config';
import { checkServerActionRateLimit } from '@/backend/rateLimiter';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';

// =============================
// UTILITAIRES
// =============================

/**
 * Extrait l'IP du client depuis les headers (pour rate limiting)
 */
async function getClientIdentifier() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = headersList.get('x-real-ip');
    if (realIp) return realIp;
    return 'anonymous';
  } catch {
    return 'anonymous';
  }
}

/**
 * Sanitize une chaîne de recherche
 * - Trim + limite de longueur
 * - Supprime les caractères dangereux pour ILIKE
 */
function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';

  return query
    .trim()
    .substring(0, 100)
    .replace(/[<>"'%;()&+\\]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Valide un UUID PostgreSQL
 */
function isValidUUID(value) {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Formate les données brutes d'une vidéo pour le client
 * Seules les colonnes demandées sont exposées
 */
function formatVideo(row) {
  return {
    video_id: row.video_id,
    video_title: row.video_title || '[Sans titre]',
    video_description: row.video_description || null,
    video_category: row.video_category,
    video_duration_seconds: row.video_duration_seconds
      ? parseInt(row.video_duration_seconds, 10)
      : null,
    views_count: parseInt(row.views_count, 10) || 0,
    created_at: row.created_at,
    video_cloudinary_id: row.video_cloudinary_id,
    video_thumbnail_id: row.video_thumbnail_id || null,
  };
}

// =============================
// FETCH INITIAL — appelé par page.jsx (Server Component)
// =============================

function withTimeout(promise, timeoutMs, errorMessage = 'Timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(errorMessage);
        timeoutError.name = 'TimeoutError';
        reject(timeoutError);
      }, timeoutMs);
    }),
  ]);
}

/**
 * Récupère toutes les vidéos actives, triées par date de création DESC
 * Utilisé uniquement côté serveur dans page.jsx — pas de rate limiting nécessaire
 *
 * @returns {Promise<{ videos: Array, success: boolean, error?: string }>}
 */
export async function getVideos() {
  let client = null;
  const startTime = Date.now();

  try {
    client = await getClient();

    const result = await withTimeout(
      client.query(`
      SELECT
        video_id,
        video_title,
        video_description,
        video_category,
        video_duration_seconds,
        views_count,
        created_at,
        video_cloudinary_id,
        video_thumbnail_id
      FROM catalog.channel_videos
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 20
  `),
      5000,
      'Get videos timeout',
    );

    const queryDuration = Date.now() - startTime;

    if (queryDuration > 2000) {
      captureMessage('Slow channel videos query', {
        level: 'warning',
        tags: { component: 'channel_actions', operation: 'get_videos' },
        extra: { queryDuration, rowCount: result.rows.length },
      });
    }

    return {
      videos: result.rows.map(formatVideo),
      success: true,
    };
  } catch (error) {
    captureException(error, {
      tags: { component: 'channel_actions', operation: 'get_videos' },
      extra: { durationMs: Date.now() - startTime, errorCode: error.code },
    });

    return {
      videos: [],
      success: false,
      error: error.message,
    };
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        captureException(releaseError, {
          tags: { component: 'channel_actions', operation: 'client_release' },
        });
      }
    }
  }
}

// =============================
// RECHERCHE — appelé côté client via useTransition
// =============================

/**
 * Recherche des vidéos par titre, description ou tags
 * Rate limitée : 20 requêtes/minute par IP
 *
 * @param {string} query - Terme de recherche
 * @returns {Promise<{ videos: Array, success: boolean, total: number, error?: string }>}
 */
export async function searchVideos(query) {
  return Sentry.withServerActionInstrumentation(
    'searchVideos',
    {
      headers: await headers(),
      recordResponse: true,
    },
    async () => {
      let client = null;
      const startTime = Date.now();

      try {
        // ===== RATE LIMITING =====
        const identifier = await getClientIdentifier();
        const rateLimitResult = await checkServerActionRateLimit(
          `channel_search:${identifier}`,
          'api', // 20 req/min
        );

        if (!rateLimitResult.success) {
          const waitSeconds = rateLimitResult.reset;
          return {
            videos: [],
            success: false,
            total: 0,
            code: rateLimitResult.code || 'RATE_LIMITED',
            message: `Trop de recherches. Réessayez dans ${waitSeconds} seconde${waitSeconds > 1 ? 's' : ''}.`,
          };
        }

        // ===== SANITIZATION =====
        const cleanQuery = sanitizeSearchQuery(query);

        // Requête vide → retourner toutes les vidéos
        if (!cleanQuery || cleanQuery.length < 1) {
          return await getVideos().then((result) => ({
            ...result,
            total: result.videos.length,
          }));
        }

        // Minimum 2 caractères pour une vraie recherche
        if (cleanQuery.length < 2) {
          return {
            videos: [],
            success: true,
            total: 0,
            message: 'Saisissez au moins 2 caractères.',
          };
        }

        // ===== REQUÊTE DB =====
        client = await getClient();

        const searchPattern = `%${cleanQuery}%`;

        const result = await withTimeout(
          client.query(
            `
          SELECT
            video_id,
            video_title,
            video_description,
            video_category,
            video_duration_seconds,
            views_count,
            created_at,
            video_cloudinary_id,
            video_thumbnail_id
          FROM catalog.channel_videos
          WHERE is_active = true
            AND (
              video_title ILIKE $1
              OR video_description ILIKE $1
              OR array_to_string(video_tags, ' ') ILIKE $1
            )
          ORDER BY
            -- Priorité : correspondance exacte dans le titre d'abord
            CASE WHEN video_title ILIKE $1 THEN 0 ELSE 1 END,
            views_count DESC,
            created_at DESC
          LIMIT 100
          `,
            [searchPattern],
          ),
          5000,
          'Search videos timeout',
        );

        const countResult = await withTimeout(
          client.query(
            `
          SELECT COUNT(*) as total
          FROM catalog.channel_videos
          WHERE is_active = true
            AND (
              video_title ILIKE $1
              OR video_description ILIKE $1
              OR array_to_string(video_tags, ' ') ILIKE $1
            )
          `,
            [searchPattern],
          ),
          5000,
          'Search videos count timeout',
        );

        const queryDuration = Date.now() - startTime;

        if (queryDuration > 2000) {
          captureMessage('Slow channel search query', {
            level: 'warning',
            tags: { component: 'channel_actions', operation: 'search_videos' },
            extra: {
              queryDuration,
              query: cleanQuery,
              rowCount: result.rows.length,
            },
          });
        }

        return {
          videos: result.rows.map(formatVideo),
          success: true,
          total: parseInt(countResult.rows[0].total, 10),
          query: cleanQuery,
        };
      } catch (error) {
        captureException(error, {
          tags: { component: 'channel_actions', operation: 'search_videos' },
          extra: {
            query: query?.substring(0, 50),
            durationMs: Date.now() - startTime,
            errorCode: error.code,
          },
        });

        return {
          videos: [],
          success: false,
          total: 0,
          error:
            process.env.NODE_ENV === 'production'
              ? 'Erreur lors de la recherche.'
              : error.message,
        };
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            captureException(releaseError, {
              tags: {
                component: 'channel_actions',
                operation: 'client_release',
              },
            });
          }
        }
      }
    },
  );
}

// =============================
// INCREMENT VIEWS — appelé quand une vidéo commence à jouer
// =============================

/**
 * Incrémente le compteur de vues d'une vidéo
 * Rate limitée : 20 req/min par IP
 * Insert dans catalog.video_views + update views_count en async
 *
 * @param {string} videoId - UUID de la vidéo
 * @returns {Promise<{ success: boolean, newCount?: number }>}
 */
export async function incrementVideoViews(videoId) {
  return Sentry.withServerActionInstrumentation(
    'incrementVideoViews',
    {
      headers: await headers(),
      recordResponse: true,
    },
    async () => {
      let client = null;

      try {
        // ===== VALIDATION =====
        if (!isValidUUID(videoId)) {
          return { success: false, error: 'Invalid video ID' };
        }

        // ===== RATE LIMITING =====
        const identifier = await getClientIdentifier();
        const rateLimitResult = await checkServerActionRateLimit(
          `channel_view:${identifier}:${videoId}`,
          'api',
        );

        if (!rateLimitResult.success) {
          // Silencieux — pas besoin de notifier l'utilisateur
          return { success: false, code: 'RATE_LIMITED' };
        }

        // ===== DB =====
        client = await getClient();

        // Insert dans video_views (évite les conflits sur views_count)
        await client.query(
          `INSERT INTO catalog.video_views (video_id, viewed_at)
           VALUES ($1, NOW())`,
          [videoId],
        );

        // Update du cache views_count
        const updateResult = await client.query(
          `UPDATE catalog.channel_videos
           SET views_count = views_count + 1
           WHERE video_id = $1
           RETURNING views_count`,
          [videoId],
        );

        const newCount = updateResult.rows[0]?.views_count ?? null;

        return { success: true, newCount };
      } catch (error) {
        // Non critique — on log mais on ne bloque pas l'UX
        captureException(error, {
          tags: { component: 'channel_actions', operation: 'increment_views' },
          extra: { videoId, errorCode: error.code },
        });

        return { success: false, error: error.message };
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            captureException(releaseError, {
              tags: {
                component: 'channel_actions',
                operation: 'client_release',
              },
            });
          }
        }
      }
    },
  );
}
