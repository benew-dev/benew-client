// components/channel/ReactVideoPlayer.jsx
// Wrapper react-player pour Next.js 15 App Router
// react-player doit être chargé côté client uniquement (SSR crash sinon)
// On utilise next/dynamic avec ssr:false dans ChannelList.jsx
'use client';

// =============================
// CONSTANTE URL CDN — masque le nom du service de stockage
// =============================

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE_URL;

function buildVideoUrl(publicId) {
  if (!publicId) return null;
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  if (!CDN_BASE) {
    console.warn('[ReactVideoPlayer] NEXT_PUBLIC_CDN_BASE_URL is not defined');
    return null;
  }
  return `${CDN_BASE}/video/upload/${publicId}`;
}

function buildPosterUrl(thumbnailId) {
  if (!thumbnailId) return null;
  if (thumbnailId.startsWith('http://') || thumbnailId.startsWith('https://')) {
    return thumbnailId;
  }
  if (!CDN_BASE) {
    return null; // Pas de warning ici — buildVideoUrl l'a déjà émis
  }
  return `${CDN_BASE}/image/upload/f_auto,q_auto,w_1280/${thumbnailId}`;
}

// =============================
// COMPOSANT REACTVIDEOPLAYER
// Importé dynamiquement (ssr:false) depuis ChannelList.jsx
// =============================

import ReactPlayer from 'react-player';

/**
 * @param {string}   props.src       - public_id ou URL directe
 * @param {string}   [props.poster]  - public_id thumbnail ou URL directe
 * @param {boolean}  [props.autoPlay]
 * @param {boolean}  [props.controls]
 * @param {string}   [props.className]
 * @param {Function} [props.onReady]
 * @param {Function} [props.onPlay]
 * @param {Function} [props.onPause]
 * @param {Function} [props.onEnded]
 */
const ReactVideoPlayer = ({
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
  const videoUrl = buildVideoUrl(src);
  const posterUrl = poster ? buildPosterUrl(poster) : null;

  if (!videoUrl) return null;

  return (
    <div className={`react-video-wrapper ${className}`}>
      <ReactPlayer
        src={videoUrl}
        playing={autoPlay}
        controls={controls}
        // width/height en % — react-player applique ces valeurs directement
        // sur son conteneur interne. Le ratio 16/9 est géré par le CSS parent.
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        config={{
          file: {
            attributes: {
              poster: posterUrl || undefined,
              preload: 'auto',
              playsInline: true,
            },
          },
        }}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={(e) => console.warn('[ReactVideoPlayer] Error:', e)}
      />
    </div>
  );
};

export default ReactVideoPlayer;
