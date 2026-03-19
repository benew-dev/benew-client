'use client';

import './index.scss';
import { useState, useRef, useCallback } from 'react';
import { MdPlayArrow, MdPause } from 'react-icons/md';

const QualitiesHome = () => {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  // ✅ Guard pour éviter les appels play/pause simultanés
  const isTransitioning = useRef(false);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isTransitioning.current) return;

    isTransitioning.current = true;

    try {
      if (playing) {
        video.pause();
        setPlaying(false);
      } else {
        // ✅ S'assurer que la vidéo est bien en pause avant de lancer play()
        if (!video.paused) {
          video.pause();
        }
        await video.play();
        setPlaying(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Conflit play/pause - réinitialiser l'état selon la réalité
        setPlaying(!video.paused);
      } else if (error.name === 'NotAllowedError') {
        // Politique autoplay du navigateur - ignorer
        setPlaying(false);
      } else {
        console.error('[VideoPlayer] Erreur:', error);
        setPlaying(false);
      }
    } finally {
      // ✅ Libérer le guard après un délai court
      setTimeout(() => {
        isTransitioning.current = false;
      }, 300);
    }
  }, [playing]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    isTransitioning.current = false;
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
          {/* Vidéo native HTML */}
          <video
            ref={videoRef}
            src="/video/personnalisable.mp4"
            preload="none"
            playsInline
            onEnded={handleEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

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
              className="video-play-btn video-play-btn--ready"
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
