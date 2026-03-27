'use client';

import './index.scss';
import { useState, useRef, useCallback, useEffect } from 'react';
import { MdPlayArrow, MdPause } from 'react-icons/md';

const QualitiesHome = () => {
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);
  const isTransitioning = useRef(false);

  useEffect(() => {
    const checkDevice = () => {
      console.log('checkDevice est declenchee');
      setIsMobile(window.innerWidth < 1200);
    };

    // Exécution initiale
    checkDevice();

    // Debounce — attend 200ms après le dernier resize avant d'exécuter
    let debounceTimer;
    const handleResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkDevice, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(debounceTimer); // nettoyage si le composant est démonté pendant un resize
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isTransitioning.current) return;

    isTransitioning.current = true;

    try {
      if (playing) {
        video.pause();
        setPlaying(false);
      } else {
        if (!video.paused) video.pause();
        await video.play();
        setPlaying(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setPlaying(!video.paused);
      } else if (error.name === 'NotAllowedError') {
        setPlaying(false);
      } else {
        console.error('[VideoPlayer] Erreur:', error);
        setPlaying(false);
      }
    } finally {
      setTimeout(() => {
        isTransitioning.current = false;
      }, 300);
    }
  }, [playing]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    isTransitioning.current = false;
  }, []);

  const handleNativePlay = useCallback(() => setPlaying(true), []);
  const handleNativePause = useCallback(() => setPlaying(false), []);

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
          <video
            ref={videoRef}
            src="/video/Qualities.mp4"
            preload="none"
            playsInline
            // Contrôles natifs sur mobile/tablette, aucun sur desktop
            controls={isMobile}
            controlsList="noplaybackrate nodownload"
            onEnded={handleEnded}
            onPlay={handleNativePlay}
            onPause={handleNativePause}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Overlay + bouton personnalisé uniquement sur desktop */}
          {!isMobile && (
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
                className={`video-play-btn video-play-btn--ready ${playing ? 'video-play-btn--playing' : ''}`}
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
          )}
        </div>
      </div>
    </>
  );
};

export default QualitiesHome;
