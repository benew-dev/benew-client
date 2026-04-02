'use server';

import { getClient } from '@/backend/dbConnect';
import {
  checkServerActionRateLimit,
  getClientIPFromAction,
} from '@/backend/rateLimiter';
import { captureException, captureMessage } from '../sentry.server.config';
// Importé dans les deux fichiers
import { withTimeout, formatVideo } from '../lib/channelUtils';

// =============================
// UTILITAIRES
// =============================

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
  let client = null;
  const startTime = Date.now();

  try {
    // ===== RATE LIMITING =====
    const identifier = await getClientIPFromAction();
    const rateLimitResult = await checkServerActionRateLimit(
      `channel_search:${identifier}`,
      'api',
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
      client = await getClient();

      await client.query('SET LOCAL statement_timeout = 5000');

      const result = await withTimeout(
        client.query(`
          SELECT
            video_id, video_title, video_description, video_category,
            video_duration_seconds, views_count, created_at,
            video_cloudinary_id, video_thumbnail_id
          FROM catalog.channel_videos
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT 20
        `),
        5000,
        'Get all videos timeout',
      );

      return {
        videos: result.rows.map(formatVideo),
        success: true,
        total: result.rows.length,
      };
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

    await client.query('SET LOCAL statement_timeout = 5000');

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
      total: result.rows.length,
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
  let client = null;

  try {
    if (!isValidUUID(videoId)) {
      return { success: false, error: 'Invalid video ID' };
    }

    const identifier = await getClientIPFromAction();
    const rateLimitResult = await checkServerActionRateLimit(
      `channel_view:${identifier}:${videoId}`,
      'api',
    );

    if (!rateLimitResult.success) {
      return { success: false, code: 'RATE_LIMITED' };
    }

    client = await getClient();

    const result = await client.query(
      `UPDATE catalog.channel_videos
      SET views_count = views_count + 1
      WHERE video_id = $1
      RETURNING views_count`,
      [videoId],
    );

    return { success: true, newCount: result.rows[0]?.views_count ?? null };
  } catch (error) {
    captureException(error, {
      tags: { component: 'channel_actions', operation: 'increment_views' },
      extra: { videoId, errorCode: error.code },
    });
    return { success: false, error: error.message };
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        /* ignore */
      }
    }
  }
}
