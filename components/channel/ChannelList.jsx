// components/channel/ChannelList.jsx
'use client';

import {
  useState,
  useEffect,
  useTransition,
  useRef,
  useCallback,
  memo,
} from 'react';
import { CldVideoPlayer } from 'next-cloudinary';
import { CldImage } from 'next-cloudinary';
import { searchVideos, incrementVideoViews } from '@/actions/channelActions';
import { trackEvent } from '@/utils/analytics';
import PageTracker from '../analytics/PageTracker';
import './channelStyles/index.scss';

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
 * Formate un nombre de vues : 1200 → "1,2k"
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
 * Retourne la couleur et le label d'une catégorie
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
// COMPOSANT BARRE DE RECHERCHE
// =============================

const SearchBar = memo(({ onSearch, isPending, resultCount, query }) => {
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInputValue(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="channel-search" role="search">
      <div className="channel-search__wrapper">
        <span className="channel-search__icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          className="channel-search__input"
          placeholder="Rechercher une vidéo..."
          value={inputValue}
          onChange={handleChange}
          aria-label="Rechercher des vidéos"
          aria-busy={isPending}
          autoComplete="off"
        />
        {isPending && (
          <span className="channel-search__spinner" aria-hidden="true" />
        )}
        {inputValue && !isPending && (
          <button
            className="channel-search__clear"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Résultats info */}
      {query && !isPending && (
        <p className="channel-search__results" role="status" aria-live="polite">
          {resultCount === 0
            ? `Aucun résultat pour « ${query} »`
            : `${resultCount} vidéo${resultCount > 1 ? 's' : ''} pour « ${query} »`}
        </p>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

// =============================
// COMPOSANT PRINCIPAL
// =============================

const ChannelList = ({ videos: initialVideos = [] }) => {
  const [videos, setVideos] = useState(initialVideos);
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [searchError, setSearchError] = useState(null);
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

  // Recherche
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      setSearchError(null);

      startTransition(async () => {
        try {
          const result = await searchVideos(query);

          if (!result.success) {
            if (result.code === 'RATE_LIMITED') {
              setSearchError(result.message);
              return;
            }
            setSearchError('Erreur lors de la recherche.');
            return;
          }

          setVideos(result.videos);

          // Si la vidéo active n'est plus dans les résultats, la fermer
          if (
            activeVideo &&
            !result.videos.some((v) => v.video_id === activeVideo.video_id)
          ) {
            setActiveVideo(null);
          }
        } catch (e) {
          console.error('[Channel] Search error:', e);
          setSearchError('Erreur lors de la recherche. Veuillez réessayer.');
        }
      });
    },
    [activeVideo],
  );

  return (
    <div className="channel-container">
      <PageTracker pageName="channel" />

      {/* Header de la page */}
      <section className="channel-header">
        <div className="channel-header__inner">
          <h1 className="channel-header__title">
            <span className="channel-header__icon" aria-hidden="true">
              📡
            </span>
            Notre Chaîne
          </h1>
          <p className="channel-header__subtitle">
            Tutoriels, démonstrations et conseils pour maîtriser nos solutions
          </p>
        </div>
      </section>

      {/* Lecteur actif */}
      {activeVideo && (
        <section className="channel-player-section" ref={playerRef}>
          <div className="channel-player-section__inner">
            <ActivePlayer video={activeVideo} onClose={handleClosePlayer} />
          </div>
        </section>
      )}

      {/* Barre de recherche + liste */}
      <section className="channel-content">
        <div className="channel-content__inner">
          {/* Barre de recherche */}
          <div className="channel-toolbar">
            <SearchBar
              onSearch={handleSearch}
              isPending={isPending}
              resultCount={videos.length}
              query={searchQuery}
            />
            {!searchQuery && (
              <p className="channel-toolbar__count" aria-live="polite">
                {initialVideos.length} vidéo
                {initialVideos.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Erreur de recherche */}
          {searchError && (
            <div className="channel-search-error" role="alert">
              ⚠️ {searchError}
            </div>
          )}

          {/* Grille de vidéos */}
          {videos.length > 0 ? (
            <div className="channel-grid" role="list">
              {videos.map((video) => (
                <div
                  key={video.video_id}
                  className="channel-grid__item"
                  role="listitem"
                >
                  <VideoCard
                    video={video}
                    isActive={activeVideo?.video_id === video.video_id}
                    onClick={handleVideoSelect}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="channel-empty" role="status">
              <div className="channel-empty__inner">
                <span className="channel-empty__icon" aria-hidden="true">
                  🎬
                </span>
                <h2 className="channel-empty__title">
                  {searchQuery
                    ? `Aucune vidéo pour « ${searchQuery} »`
                    : 'Aucune vidéo disponible'}
                </h2>
                {searchQuery && (
                  <button
                    className="channel-empty__reset"
                    onClick={() => handleSearch('')}
                    type="button"
                  >
                    Voir toutes les vidéos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ChannelList;
