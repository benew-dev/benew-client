// components/channel/VideoJSPlayer.jsx
// Lecteur Video.js natif — remplace CldVideoPlayer
// Compatible React 18 StrictMode (pattern placeholder ref)
'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// =============================
// CONSTANTE — NE PAS EXPOSER LE NOM DU SERVICE
// =============================

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE_URL;

/**
 * Construit l'URL de streaming à partir d'un public_id
 * Supporte les formats : "folder/nom" ou "nom" directement
 */
function buildVideoUrl(publicId) {
  if (!publicId) return null;
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  return `${CDN_BASE}/video/upload/${publicId}`;
}

/**
 * Construit l'URL du poster (thumbnail) à partir d'un public_id image
 */
function buildPosterUrl(thumbnailId) {
  if (!thumbnailId) return null;
  if (thumbnailId.startsWith('http://') || thumbnailId.startsWith('https://')) {
    return thumbnailId;
  }
  return `${CDN_BASE}/image/upload/f_auto,q_auto,w_1280/${thumbnailId}`;
}

// =============================
// COMPOSANT VIDEOJSPLAYER
// =============================

/**
 * @param {Object} props
 * @param {string} props.id            - ID unique du player (obligatoire)
 * @param {string} props.src           - public_id Cloudinary ou URL directe
 * @param {string} [props.poster]      - public_id thumbnail ou URL directe
 * @param {boolean} [props.autoPlay]   - Lecture automatique
 * @param {boolean} [props.controls]   - Afficher les contrôles
 * @param {string} [props.className]   - Classe CSS additionnelle
 * @param {Function} [props.onReady]   - Callback quand le player est prêt
 * @param {Function} [props.onPlay]    - Callback à la lecture
 * @param {Function} [props.onPause]   - Callback à la pause
 * @param {Function} [props.onEnded]   - Callback à la fin
 */
const VideoJSPlayer = ({
  id,
  src,
  poster,
  autoPlay = false,
  controls = true,
  className = '',
  onReady,
  onPlay,
  onPause,
  onEnded,
}) => {
  // Pattern recommandé pour React 18 StrictMode :
  // on utilise un div placeholder pour éviter les erreurs de double mount/unmount
  const placeholderRef = useRef(null);
  const playerRef = useRef(null);

  const videoUrl = buildVideoUrl(src);
  const posterUrl = poster ? buildPosterUrl(poster) : null;

  useEffect(() => {
    // Ne pas initialiser sans src ou sans container
    if (!videoUrl || !placeholderRef.current) return;
    // Ne pas réinitialiser si déjà initialisé
    if (playerRef.current) return;

    // Créer l'élément video-js dynamiquement (évite les conflits StrictMode)
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    placeholderRef.current.appendChild(videoElement);

    const player = videojs(
      videoElement,
      {
        controls,
        autoplay: autoPlay,
        preload: 'auto',
        responsive: true,
        fluid: false, // On gère nous-mêmes le sizing via CSS
        fill: true, // Remplit le conteneur parent
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        poster: posterUrl || undefined,
        sources: videoUrl ? [{ src: videoUrl, type: 'video/mp4' }] : [],
        // Thème couleurs via les options HTML5
        html5: {
          vhs: {
            overrideNative: false,
          },
        },
      },
      function onPlayerReady() {
        if (onReady) onReady(this);
      },
    );

    playerRef.current = player;

    // Event listeners
    if (onPlay) player.on('play', onPlay);
    if (onPause) player.on('pause', onPause);
    if (onEnded) player.on('ended', onEnded);

    // Cleanup
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note : on ne rerun pas l'effet si src change (dispose + recréation via key)

  // Si src change sur un player existant, mettre à jour la source
  useEffect(() => {
    if (playerRef.current && videoUrl && !playerRef.current.isDisposed()) {
      playerRef.current.src([{ src: videoUrl, type: 'video/mp4' }]);
      if (posterUrl) {
        playerRef.current.poster(posterUrl);
      }
    }
  }, [videoUrl, posterUrl]);

  return (
    <div
      ref={placeholderRef}
      className={`vjs-player-wrapper ${className}`}
      data-vjs-player
    />
  );
};

export default VideoJSPlayer;
