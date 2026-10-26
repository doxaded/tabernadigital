import React, { useState, useEffect } from 'react';
import { cleanImageBackground } from '../utils/cleanImageBackground';

interface CleanArtworkImageProps {
  src: string;
  alt: string;
  room: 'I' | 'II' | 'III' | 'IV' | 'V';
  className?: string;
  style?: React.CSSProperties;
}

export const CleanArtworkImage: React.FC<CleanArtworkImageProps> = ({
  src,
  alt,
  room,
  className = '',
  style = {},
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [isCleaned, setIsCleaned] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setCurrentSrc(src);
    setIsCleaned(false);

    cleanImageBackground(src).then((cleaned) => {
      if (isMounted) {
        setCurrentSrc(cleaned);
        setIsCleaned(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`awwwards-gallery-img awwwards-room-${room} ${className}`}
      style={{
        objectFit: 'contain',
        width: 'auto',
        height: 'auto',
        maxWidth: '420px',
        maxHeight: '380px',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        filter: isCleaned ? 'none' : undefined,
        ...style,
      }}
      draggable={false}
    />
  );
};
