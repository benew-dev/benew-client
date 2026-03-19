'use client';

import './index.scss';
import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MdPlayArrow, MdPause } from 'react-icons/md';

// ✅ Import dynamique de ReactPlayer pour éviter le conflit SSR/hydratation
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

const QualitiesHome = () => {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef(null);

  // ✅ S'assurer que le composant est monté côté client avant tout
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
  }, []);

  // ✅ Gérer l'erreur AbortError silencieusement
  const handleError = useCallback((error) => {
    if (
      error?.name === 'AbortError' ||
      error?.message?.includes('AbortError')
    ) {
      return; // Ignorer silencieusement
    }
    console.error('[VideoPlayer] Erreur:', error);
  }, []);

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
          {/* Player - rendu uniquement côté client */}
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
                    preload: 'metadata',
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
            onClick={handlePlayPause}
            role="button"
            tabIndex={0}
            aria-label={playing ? 'Mettre en pause' : 'Lancer la vidéo'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlayPause();
              }
            }}
          >
            <button
              className={`video-play-btn ${playing ? 'video-play-btn--playing' : ''} ${ready ? 'video-play-btn--ready' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
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
