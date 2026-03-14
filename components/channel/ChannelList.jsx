// components/channel/ChannelList.jsx
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { CldImage } from 'next-cloudinary';
import { CldVideoPlayer } from 'next-cloudinary';
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

function formatViews(count) {
  if (!count || count === 0) return '0 vue';
  if (count === 1) return '1 vue';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M vues`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k vues`;
  return `${count} vues`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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
// MODAL LECTEUR VIDÉO
// =============================

const VideoModal = memo(({ video, onClose }) => {
  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="video-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur : ${video.video_title}`}
    >
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        {/* Bouton fermer */}
        <button
          className="video-modal__close"
          onClick={onClose}
          aria-label="Fermer le lecteur"
          type="button"
        >
          ✕
        </button>

        {/* Lecteur */}
        <div className="video-modal__player">
          <CldVideoPlayer
            src={video.video_cloudinary_id}
            width={1280}
            height={720}
            autoPlay
            controls
            className="video-modal__player-instance"
            colors={{
              accent: '#f6a037',
              base: '#0c0c1a',
              text: '#fae6d1',
            }}
            playerProps={{
              fluid: true,
              responsive: true,
            }}
          />
        </div>

        {/* Infos sous le lecteur */}
        <div className="video-modal__info">
          <h2 className="video-modal__title">{video.video_title}</h2>
          <div className="video-modal__meta">
            <span className="video-modal__views">
              {formatViews(video.views_count)}
            </span>
            <span className="video-modal__separator" aria-hidden="true">
              ·
            </span>
            <span className="video-modal__date">
              Publiée le {formatDate(video.created_at)}
            </span>
          </div>
          {video.video_description && (
            <p className="video-modal__description">
              {video.video_description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

VideoModal.displayName = 'VideoModal';

// =============================
// CARTE VIDÉO
// =============================

const VideoCard = memo(({ video, onPlay }) => {
  const catConfig = getCategoryConfig(video.video_category);
  const duration = formatDuration(video.video_duration_seconds);

  return (
    <div className="video-card">
      <div className="video-card__inner">
        {/* Thumbnail avec bouton play */}
        <div className="video-card__thumbnail">
          {video.video_thumbnail_id ? (
            <CldImage
              src={video.video_thumbnail_id}
              alt={video.video_title}
              width={520}
              height={293}
              className="video-card__thumb-img"
              loading="lazy"
              quality="auto"
              format="auto"
              crop={{ type: 'fill', gravity: 'auto' }}
            />
          ) : (
            <div className="video-card__thumb-placeholder">
              <span className="video-card__thumb-icon" aria-hidden="true">
                🎬
              </span>
            </div>
          )}

          {/* Overlay au hover + bouton play */}
          <button
            className="video-card__play-btn"
            onClick={() => onPlay(video)}
            aria-label={`Lire ${video.video_title}`}
            type="button"
          >
            <span className="video-card__play-icon" aria-hidden="true">
              ▶
            </span>
          </button>

          {/* Badge durée */}
          {duration && <span className="video-card__duration">{duration}</span>}
        </div>

        {/* Infos */}
        <div className="video-card__info">
          <div className="video-card__info-top">
            <span className={`video-card__category ${catConfig.color}`}>
              {catConfig.label}
            </span>
          </div>
          <h3 className="video-card__title">{video.video_title}</h3>
          {video.video_description && (
            <p className="video-card__description">{video.video_description}</p>
          )}
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
      </div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

// =============================
// COMPOSANT PRINCIPAL
// =============================

const ChannelList = ({ videos: initialVideos = [] }) => {
  const [activeVideo, setActiveVideo] = useState(null);

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

  const handleVideoPlay = useCallback((video) => {
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

    incrementVideoViews(video.video_id).catch(() => {});
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveVideo(null);
  }, []);

  return (
    <div className="channel-container">
      <PageTracker pageName="channel_list" />

      <section className="first">
        <Parallax bgColor="#0c0c1d" title="Chaine" planets="/sun.png" />
      </section>

      <div className="channel-grid" role="list">
        {initialVideos.map((video) => (
          <section
            key={video.video_id}
            className="others projectSection"
            role="listitem"
          >
            <VideoCard video={video} onPlay={handleVideoPlay} />
          </section>
        ))}
      </div>

      {/* Modal lecteur */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default ChannelList;
