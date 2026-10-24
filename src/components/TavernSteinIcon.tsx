import React from 'react';

interface TavernSteinIconProps {
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Ícone minimalista medieval de Caneca de Chopp (Stein / Tankard de Taverna).
 * Desenho vetorial autoral com ripas de madeira, aros de ferro forjado e colarinho de espuma.
 */
export const TavernSteinIcon: React.FC<TavernSteinIconProps> = ({
  size = 22,
  className = '',
  color = 'currentColor',
  style = {}
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Colarinho de Espuma Medieval estilizado com arcos suaves */}
      <path
        d="M5.5 8c-.8 0-1.5-.7-1.5-1.5 0-.7.5-1.3 1.2-1.5a2.1 2.1 0 0 1 3.5-.8 2.3 2.3 0 0 1 4 .2 2.1 2.1 0 0 1 3.4.6c.7.2 1.4.8 1.4 1.5 0 .8-.7 1.5-1.5 1.5H5.5z"
        fill="currentColor"
        fillOpacity="0.22"
      />

      {/* Corpo cônico da caneca medieval */}
      <path
        d="M6 8.5v9.5c0 1.4 1.1 2.5 2.5 2.5h5c1.4 0 2.5-1.1 2.5-2.5V8.5"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Aros de ferro forjado estruturais (reforço de estalagem medieval) */}
      <path d="M6 11.5h10" strokeWidth="1.5" strokeOpacity="0.8" />
      <path d="M6 17.5h10" strokeWidth="1.5" strokeOpacity="0.8" />

      {/* Sulcos verticais das tábuas de carvalho da caneca */}
      <line x1="9.3" y1="8.5" x2="9.3" y2="20.5" strokeWidth="1.1" strokeOpacity="0.45" />
      <line x1="12.7" y1="8.5" x2="12.7" y2="20.5" strokeWidth="1.1" strokeOpacity="0.45" />

      {/* Alça rústica forjada medieval à direita */}
      <path
        d="M16 10.5h2a2.2 2.2 0 0 1 2.2 2.2v1.6a2.2 2.2 0 0 1-2.2 2.2h-2"
        strokeWidth="1.8"
      />
    </svg>
  );
};
