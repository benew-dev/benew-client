// components/channel/ChannelList.jsx
'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { CldVideoPlayer } from 'next-cloudinary';
import { CldImage } from 'next-cloudinary';
import { incrementVideoViews } from '@/actions/channelActions';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';
import './channelStyles/index.scss';

import ParallaxSkeleton from '../layouts/parallax/ParallaxSkeleton';
const Parallax = dynamic(() => import('components/layouts/parallax'), {
  loading: () => <ParallaxSkeleton />,
  ssr: true,
});

// =============================
// UTILITAIRES
// =============================

/**
 * Formate une durée en secondes → "mm:ss" ou "h:mm:ss"
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Formate un nombre de vues
 */
function formatViews(count) {
  if (!count || count === 0) return '0 vue';
  if (count === 1) return '1 vue';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M vues`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k vues`;
  return `${count} vues`;
}

/**
 * Formate une date → "12 jan. 2025"
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Config des catégories
 */
const CATEGORY_CONFIG = {
  tutorial: { label: 'Tutoriel', color: 'category-tutorial' },
  overview: { label: 'Présentation', color: 'category-overview' },
  demo: { label: 'Démo', color: 'category-demo' },
  setup: { label: 'Configuration', color: 'category-setup' },
  tips: { label: 'Conseils', color: 'category-tips' },
};

function getCategoryConfig(category) {
  return (
    CATEGORY_CONFIG[category] || { label: category, color: 'category-default' }
  );
}

// =============================
// COMPOSANT LECTEUR ACTIF
// =============================

const ActivePlayer = memo(({ video, onClose }) => {
  const catConfig = getCategoryConfig(video.video_category);
  const duration = formatDuration(video.video_duration_seconds);

  return (
    <div className="active-player" role="region" aria-label="Lecteur vidéo">
      {/* Header du lecteur */}
      <div className="active-player__header">
        <div className="active-player__meta-top">
          <span className={`active-player__category ${catConfig.color}`}>
            {catConfig.label}
          </span>
          {duration && (
            <span className="active-player__duration">⏱ {duration}</span>
          )}
        </div>
        <button
          className="active-player__close"
          onClick={onClose}
          aria-label="Fermer le lecteur"
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Lecteur vidéo Cloudinary */}
      <div className="active-player__video-wrapper">
        <CldVideoPlayer
          src={video.video_cloudinary_id}
          width={1280}
          height={720}
          autoPlay
          controls
          className="active-player__video"
          colors={{
            accent: '#f97316',
            base: '#1a1a2e',
            text: '#ffffff',
          }}
        />
      </div>

      {/* Informations de la vidéo */}
      <div className="active-player__details">
        <h2 className="active-player__title">{video.video_title}</h2>
        <div className="active-player__stats">
          <span className="active-player__views">
            {formatViews(video.views_count)}
          </span>
          <span className="active-player__separator" aria-hidden="true">
            ·
          </span>
          <span className="active-player__date">
            Publiée le {formatDate(video.created_at)}
          </span>
        </div>
        {video.video_description && (
          <p className="active-player__description">
            {video.video_description}
          </p>
        )}
      </div>
    </div>
  );
});

ActivePlayer.displayName = 'ActivePlayer';

// =============================
// COMPOSANT CARTE VIDÉO
// =============================

const VideoCard = memo(({ video, isActive, onClick }) => {
  const catConfig = getCategoryConfig(video.video_category);
  const duration = formatDuration(video.video_duration_seconds);

  return (
    <button
      className={`video-card ${isActive ? 'video-card--active' : ''}`}
      onClick={() => onClick(video)}
      aria-label={`Lire ${video.video_title}`}
      aria-pressed={isActive}
      type="button"
    >
      {/* Thumbnail */}
      <div className="video-card__thumbnail">
        {video.video_thumbnail_id ? (
          <CldImage
            src={video.video_thumbnail_id}
            alt={video.video_title}
            width={320}
            height={180}
            className="video-card__thumb-img"
            loading="lazy"
            quality="auto"
            format="auto"
            crop={{ type: 'fill', gravity: 'auto' }}
          />
        ) : (
          <div className="video-card__thumb-placeholder">
            <span className="thumb-icon">▶</span>
          </div>
        )}

        {/* Durée en overlay */}
        {duration && <span className="video-card__duration">{duration}</span>}

        {/* Indicateur lecture active */}
        {isActive && (
          <div className="video-card__playing-indicator" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="video-card__info">
        <span className={`video-card__category ${catConfig.color}`}>
          {catConfig.label}
        </span>
        <h3 className="video-card__title">{video.video_title}</h3>
        <div className="video-card__meta">
          <span className="video-card__views">
            {formatViews(video.views_count)}
          </span>
          <span className="video-card__separator" aria-hidden="true">
            ·
          </span>
          <span className="video-card__date">
            {formatDate(video.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
});

VideoCard.displayName = 'VideoCard';

// =============================
// COMPOSANT PRINCIPAL
// =============================

const ChannelList = ({ videos: initialVideos = [] }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const playerRef = useRef(null);

  // Tracking page view
  useEffect(() => {
    if (initialVideos.length > 0) {
      try {
        trackEvent('page_view', {
          event_category: 'channel',
          event_label: 'channel_list',
          videos_count: initialVideos.length,
        });
      } catch (e) {
        console.warn('[Analytics] Error tracking channel page view:', e);
      }
    }
  }, [initialVideos.length]);

  // Scroll vers le lecteur quand une vidéo devient active
  useEffect(() => {
    if (activeVideo && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeVideo]);

  // Sélectionner une vidéo
  const handleVideoSelect = useCallback(async (video) => {
    setActiveVideo(video);

    try {
      trackEvent('video_play', {
        event_category: 'channel',
        event_label: video.video_title,
        video_id: video.video_id,
        video_category: video.video_category,
      });
    } catch (e) {
      console.warn('[Analytics] Error tracking video play:', e);
    }

    // Incrémenter les vues (non bloquant)
    incrementVideoViews(video.video_id).catch(() => {
      // Silencieux
    });
  }, []);

  // Fermer le lecteur
  const handleClosePlayer = useCallback(() => {
    setActiveVideo(null);
  }, []);

  return (
    <div className="channel-container">
      <PageTracker pageName="channel_list" />

      {/* Section Parallax — même pattern que TemplatesList */}
      <section className="first">
        <Parallax bgColor="#0c0c1d" title="Chaine" planets="/sun.png" />
      </section>

      {/* Lecteur actif — affiché entre le parallax et la grille */}
      {activeVideo && (
        <div className="channel-player-wrapper" ref={playerRef}>
          <div className="channel-player-wrapper__inner">
            <ActivePlayer video={activeVideo} onClose={handleClosePlayer} />
          </div>
        </div>
      )}

      {/* Grille de vidéos — même pattern que templates-grid */}
      <div className="channel-grid" role="list">
        {initialVideos.map((video) => (
          <section
            key={video.video_id}
            className="others projectSection"
            role="listitem"
          >
            <VideoCard
              video={video}
              isActive={activeVideo?.video_id === video.video_id}
              onClick={handleVideoSelect}
            />
          </section>
        ))}
      </div>
    </div>
  );
};

export default ChannelList;
