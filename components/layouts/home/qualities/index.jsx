'use client';

import './index.scss';
import { useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { MdPlayArrow, MdPause } from 'react-icons/md';

const QualitiesHome = () => {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const playerRef = useRef(null);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
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
          {/* Player */}
          <ReactPlayer
            ref={playerRef}
            url="/video/personnalisable.mp4"
            playing={playing}
            controls={false}
            width="100%"
            height="100%"
            onReady={handleReady}
            onEnded={handleEnded}
            playsinline
            config={{
              file: {
                attributes: {
                  preload: 'metadata',
                  playsInline: true,
                },
              },
            }}
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
