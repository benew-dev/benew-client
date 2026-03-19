'use client';

import './index.scss';
import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MdPlayArrow, MdPause } from 'react-icons/md';

// ✅ Import dynamique - ssr: false pour éviter le conflit hydratation
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
});

const QualitiesHome = () => {
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  // ✅ pendingPlay : l'utilisateur a cliqué avant que le player soit prêt
  const [pendingPlay, setPendingPlay] = useState(false);
  const playerRef = useRef(null);

  // ✅ Monter uniquement côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  // ✅ Quand le player est prêt, lancer la lecture si l'utilisateur avait cliqué
  const handleReady = useCallback(() => {
    if (pendingPlay) {
      setPlaying(true);
      setPendingPlay(false);
    }
  }, [pendingPlay]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
  }, []);

  const handleError = useCallback((error) => {
    if (
      error?.name === 'AbortError' ||
      error?.message?.includes('AbortError')
    ) {
      return;
    }
    console.error('[VideoPlayer] Erreur:', error);
  }, []);

  // ✅ Gestion du clic : si le player n'est pas encore prêt, mémoriser l'intention
  const handleButtonClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!mounted) return;
      setPlaying((prev) => {
        if (!prev) setPendingPlay(true);
        return !prev;
      });
    },
    [mounted],
  );

  const handleOverlayClick = useCallback(() => {
    if (!mounted) return;
    setPlaying((prev) => {
      if (!prev) setPendingPlay(true);
      return !prev;
    });
  }, [mounted]);

  return (
    <>
      {/* BLOC 1 : TITRE */}
      <div className="services-title-block">
        <h2 className="section-main-title">
          Caractéristiques de nos magasins de vente en ligne
        </h2>
      </div>

      {/* BLOC 2 : VIDÉO */}
      <div className="services-video-block">
        <div className="video-wrapper">
          {/* Player - rendu uniquement côté client après montage */}
          {mounted && (
            <ReactPlayer
              ref={playerRef}
              url="/video/personnalisable.mp4"
              playing={playing}
              controls={false}
              width="100%"
              height="100%"
              onReady={handleReady}
              onEnded={handleEnded}
              onError={handleError}
              playsinline
              muted={false}
              config={{
                file: {
                  attributes: {
                    preload: 'auto',
                    playsInline: true,
                    controlsList: 'nodownload',
                  },
                },
              }}
            />
          )}

          {/* Overlay bouton play/pause */}
          <div
            className={`video-overlay ${playing ? 'video-overlay--playing' : 'video-overlay--paused'}`}
            onClick={handleOverlayClick}
            role="button"
            tabIndex={0}
            aria-label={playing ? 'Mettre en pause' : 'Lancer la vidéo'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOverlayClick();
              }
            }}
          >
            {/* ✅ Bouton toujours actif - pas de dépendance à ready */}
            <button
              className={`video-play-btn ${playing ? 'video-play-btn--playing' : ''} video-play-btn--ready`}
              onClick={handleButtonClick}
              aria-label={playing ? 'Pause' : 'Play'}
              type="button"
            >
              {playing ? (
                <MdPause className="video-play-btn__icon" />
              ) : (
                <MdPlayArrow className="video-play-btn__icon" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QualitiesHome;
