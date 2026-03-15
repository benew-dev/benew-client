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
  return `${CDN_BASE}/video/upload/${publicId}`;
}

function buildPosterUrl(thumbnailId) {
  if (!thumbnailId) return null;
  if (thumbnailId.startsWith('http://') || thumbnailId.startsWith('https://')) {
    return thumbnailId;
  }
  return `${CDN_BASE}/image/upload/f_auto,q_auto,w_1280/${thumbnailId}`;
}

// =============================
// COMPOSANT REACTVIDEOPLAYER
// Importé dynamiquement (ssr:false) depuis ChannelList.jsx
// =============================

import ReactPlayer from 'react-player/file';

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
        // Pattern responsive officiel react-player v3
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '16/9',
          display: 'block',
        }}
        // Poster via config file
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
