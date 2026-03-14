// components/channel/ChannelList.jsx
'use client';

import { useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
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
// COMPOSANT CARTE VIDÉO
// Lecteur intégré directement — pas de thumbnail
// =============================

const VideoCard = memo(({ video, onPlay }) => {
  const catConfig = getCategoryConfig(video.video_category);
  const duration = formatDuration(video.video_duration_seconds);

  return (
    <div className="video-card">
      {/* Lecteur Cloudinary avec tous les contrôles */}
      <div className="video-card__player">
        <CldVideoPlayer
          src={video.video_cloudinary_id}
          width={1280}
          height={720}
          controls
          className="video-card__player-instance"
          onPlay={() => onPlay(video)}
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

      {/* Informations sous le lecteur */}
      <div className="video-card__info">
        <div className="video-card__info-top">
          <span className={`video-card__category ${catConfig.color}`}>
            {catConfig.label}
          </span>
          {duration && <span className="video-card__duration">{duration}</span>}
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
  );
});

VideoCard.displayName = 'VideoCard';

// =============================
// COMPOSANT PRINCIPAL
// =============================

const ChannelList = ({ videos: initialVideos = [] }) => {
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
    </div>
  );
};

export default ChannelList;
