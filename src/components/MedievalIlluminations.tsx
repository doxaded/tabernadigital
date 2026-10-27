import React from 'react';

/**
 * Paleta de Pigmentos e Iluminuras Medievais Franciscanas:
 * - Ouro Velho / Ouro Brunido: #D4A359
 * - Vermelho Carmim / Nanquim Rubricado: #B8332A e #8B261D
 * - Azul Ultramarino Envelhecido (Lápis-lazúli): #2B4C65
 * - Verde Musgo / Malaquita: #4A5D3F
 */

/** Botão circular de ouro velho com traços de pena radiantes (Bezant Iluminado) */
export const GoldenBezant: React.FC<{ cx: number; cy: number; r?: number }> = ({ cx, cy, r = 4.5 }) => (
  <g className="golden-bezant">
    {/* Traços finos de pena / espinhos radiantes característicos de manuscritos */}
    <path
      d={`M ${cx - r - 4} ${cy} L ${cx - r} ${cy} M ${cx + r} ${cy} L ${cx + r + 4} ${cy} M ${cx} ${cy - r - 4} L ${cx} ${cy - r} M ${cx} ${cy + r} L ${cx} ${cy + r + 4} M ${cx - r - 2.5} ${cy - r - 2.5} L ${cx - r + 0.5} ${cy - r + 0.5} M ${cx + r - 0.5} ${cy + r - 0.5} L ${cx + r + 2.5} ${cy + r + 2.5} M ${cx - r - 2.5} ${cy + r + 2.5} L ${cx - r + 0.5} ${cy + r - 0.5} M ${cx + r - 0.5} ${cy - r + 0.5} L ${cx + r + 2.5} ${cy - r - 2.5}`}
      stroke="#D4A359"
      strokeWidth="0.85"
      strokeLinecap="round"
      opacity="0.9"
    />
    {/* Disco de ouro brunido */}
    <circle cx={cx} cy={cy} r={r} fill="#D4A359" stroke="#E6CCB2" strokeWidth="0.75" />
    <circle cx={cx - 1.2} cy={cy - 1.2} r={r * 0.35} fill="#FFF9E6" opacity="0.6" />
  </g>
);

/** SALA I: Grande Ramo Floral Iluminado (Foliate Border) que sobe pela margem externa esquerda */
export const FoliateVineLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 64 540"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-vine-left ${className}`}
    style={{
      position: 'absolute',
      left: '-48px',
      top: '-15px',
      height: '106%',
      width: '54px',
      pointerEvents: 'none',
      overflow: 'visible',
      opacity: 0.92,
    }}
    aria-hidden="true"
  >
    {/* Caule principal sinuoso em ouro e nanquim */}
    <path
      d="M32 530 C12 430 50 340 24 250 C4 165 44 85 28 8"
      stroke="#D4A359"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M32 530 C12 430 50 340 24 250 C4 165 44 85 28 8"
      stroke="#1E130C"
      strokeWidth="0.8"
      strokeLinecap="round"
      opacity="0.5"
    />

    {/* Volutas e gavinhas que se espalham lateralmente */}
    <path d="M26 470 C46 450 56 410 38 395 C28 385 16 392 20 405 C24 415 36 412 34 402" stroke="#D4A359" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M22 320 C2 300 -6 260 12 245 C22 235 34 242 30 255 C26 265 14 262 16 252" stroke="#D4A359" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M28 170 C48 150 58 110 40 95 C30 85 18 92 22 105 C26 115 38 112 36 102" stroke="#D4A359" strokeWidth="1.4" strokeLinecap="round" />

    {/* Folhas de Acanto em Verde Musgo */}
    <path d="M24 430 C40 422 48 438 42 452 C32 454 26 444 24 430 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M18 290 C4 282 -4 298 2 312 C12 314 18 304 18 290 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M26 140 C42 132 50 148 44 162 C34 164 28 154 26 140 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.9" />

    {/* Folhas de Acanto em Azul Ultramarino Envelhecido */}
    <path d="M28 380 C44 370 54 382 46 398 C36 400 30 390 28 380 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M16 230 C2 220 -8 232 0 248 C10 250 16 240 16 230 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M28 80 C44 70 54 82 46 98 C36 100 30 90 28 80 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.9" />

    {/* Flores e Cálices em Vermelho Carmim */}
    <path d="M38 395 C46 392 50 400 46 408 C40 410 36 402 38 395 Z" fill="#B8332A" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M12 245 C4 242 0 250 4 258 C10 260 14 252 12 245 Z" fill="#B8332A" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M40 95 C48 92 52 100 48 108 C42 110 38 102 40 95 Z" fill="#B8332A" stroke="#D4A359" strokeWidth="0.8" />

    {/* Botões Circulares em Ouro Velho com Traços de Pena (Golden Bezants) */}
    <GoldenBezant cx={46} cy={465} r={5} />
    <GoldenBezant cx={6} cy={335} r={5} />
    <GoldenBezant cx={48} cy={185} r={5} />
    <GoldenBezant cx={10} cy={60} r={4.5} />
    <GoldenBezant cx={28} cy={12} r={5.5} />
  </svg>
);

/** SALA II: Arabesco Iluminado ao redor da Letra Capitular (Broto de Acanto) */
export const FoliateSproutCapitular: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 70 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-capitular-sprout ${className}`}
    style={{
      position: 'absolute',
      left: '-28px',
      top: '-18px',
      width: '68px',
      height: '68px',
      pointerEvents: 'none',
      overflow: 'visible',
      opacity: 0.95,
      zIndex: 0,
    }}
    aria-hidden="true"
  >
    <path
      d="M32 48 C18 42 12 28 22 14 C30 2 46 8 42 24 C38 36 24 34 26 26"
      stroke="#D4A359"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M22 14 C12 10 8 20 16 26 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M42 24 C52 20 54 32 44 36 Z" fill="#B8332A" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M26 26 C20 30 22 40 30 36 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.8" />
    <GoldenBezant cx={20} cy={10} r={4.5} />
    <GoldenBezant cx={46} cy={20} r={4.5} />
  </svg>
);

/** SALA II: Arabesco de Iluminura no Canto Superior Direito com Bezants */
export const ArabesqueCornerTopRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-arabesque-tr ${className}`}
    style={{
      position: 'absolute',
      top: '-32px',
      right: '-32px',
      width: '105px',
      height: '105px',
      pointerEvents: 'none',
      opacity: 0.9,
    }}
    aria-hidden="true"
  >
    {/* Espiral gótica de acanto e voluta */}
    <path
      d="M110 10 C110 65 65 110 10 110"
      stroke="#D4A359"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M110 28 C85 36 45 68 28 110"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeDasharray="2 3"
      opacity="0.75"
    />
    <path
      d="M95 18 C78 18 64 36 72 56 C80 72 98 66 94 48 C90 38 80 38 80 46"
      stroke="#B8332A"
      strokeWidth="1.6"
      fill="none"
    />
    {/* Folhas de Acanto azul e verde */}
    <path d="M102 12 C114 12 116 26 102 26 C96 22 96 16 102 12 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M26 102 C26 114 12 116 12 102 C16 96 22 96 26 102 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.9" />

    {/* Botões de ouro com raios de pena */}
    <GoldenBezant cx={110} cy={10} r={5} />
    <GoldenBezant cx={10} cy={110} r={5} />
    <GoldenBezant cx={80} cy={46} r={4} />
  </svg>
);

/** SALA II: Floreio / Estrelas de Pena ao final do parágrafo */
export const PenFlourishEnd: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      marginLeft: '10px',
      color: '#D4A359',
      opacity: 0.9,
      fontSize: '0.9em',
      verticalAlign: 'baseline',
    }}
    aria-hidden="true"
  >
    <span style={{ color: '#B8332A', fontSize: '1.1em' }}>✦</span>
    <span style={{ color: '#D4A359' }}>❦</span>
    <span style={{ color: '#2B4C65', fontSize: '1.1em' }}>✦</span>
  </span>
);

/** SALA III: Ornamento caligráfico horizontal iluminado acima do trecho esquerdo */
export const CalligraphicHeaderHorizontal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 340 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-header ${className}`}
    style={{
      width: '100%',
      maxWidth: '380px',
      height: '32px',
      margin: '0 auto 16px 0',
      display: 'block',
      opacity: 0.92,
    }}
    aria-hidden="true"
  >
    {/* Linha central com nós góticos */}
    <path d="M15 19 H135 M205 19 H325" stroke="#D4A359" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M25 23 H125 M215 23 H315" stroke="#D4A359" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

    {/* Roseta central esculpida em ouro e carmim com botões */}
    <circle cx="170" cy="19" r="8" fill="#B8332A" stroke="#D4A359" strokeWidth="1.4" />
    <circle cx="170" cy="19" r="3.5" fill="#D4A359" />

    {/* Pétalas de acanto laterais */}
    <path d="M154 19 C142 10 140 28 154 19 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M186 19 C198 10 200 28 186 19 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M142 19 C130 12 130 26 142 19 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M198 19 C210 12 210 26 198 19 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.8" />

    {/* Bezants de ouro nos extremos */}
    <GoldenBezant cx={15} cy={19} r={4.5} />
    <GoldenBezant cx={325} cy={19} r={4.5} />
  </svg>
);

/** SALA III: Vinheta de folhas entrelaçadas no canto inferior direito com botões */
export const IntertwinedLeavesVignette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-vignette-br ${className}`}
    style={{
      position: 'absolute',
      bottom: '-24px',
      right: '-24px',
      width: '85px',
      height: '85px',
      pointerEvents: 'none',
      opacity: 0.9,
    }}
    aria-hidden="true"
  >
    <path
      d="M15 85 C45 82 68 68 82 35 C88 24 92 12 95 5"
      stroke="#D4A359"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M45 74 C54 60 68 56 64 76 C56 80 48 80 45 74 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="1"
    />
    <path
      d="M65 52 C78 44 88 52 80 66 C72 66 66 58 65 52 Z"
      fill="#2B4C65"
      stroke="#D4A359"
      strokeWidth="1"
    />
    <path
      d="M78 30 C88 20 96 28 88 40 C82 40 78 34 78 30 Z"
      fill="#B8332A"
      stroke="#D4A359"
      strokeWidth="1"
    />
    <GoldenBezant cx={95} cy={6} r={5} />
    <GoldenBezant cx={42} cy={82} r={4.5} />
  </svg>
);

/** SALA IV: Trepadeira medieval ilustrada abraçando a curva inferior esquerda */
export const IvyBranchBottomLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 90 280"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-ivy-bl ${className}`}
    style={{
      position: 'absolute',
      left: '-42px',
      bottom: '-16px',
      width: '78px',
      height: '240px',
      pointerEvents: 'none',
      opacity: 0.92,
    }}
    aria-hidden="true"
  >
    <path
      d="M75 270 C22 255 10 210 18 145 C24 98 12 50 20 6"
      stroke="#D4A359"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* Folhas de hera e acanto */}
    <path d="M22 200 C4 188 8 168 26 178 C30 192 26 198 22 200 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M18 115 C36 104 40 125 24 135 C16 132 16 120 18 115 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.9" />
    <path d="M20 50 C2 38 6 18 24 28 C28 42 24 48 20 50 Z" fill="#B8332A" stroke="#D4A359" strokeWidth="0.9" />

    <GoldenBezant cx={28} cy={178} r={5} />
    <GoldenBezant cx={18} cy={95} r={4.5} />
    <GoldenBezant cx={20} cy={8} r={5.5} />
  </svg>
);

/** SALA V: Iluminura Dourada e Carmim no Topo da Coluna Esquerda */
export const TreasuryCrestTopLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-crest-tl ${className}`}
    style={{
      position: 'absolute',
      top: '-34px',
      left: '-20px',
      width: '140px',
      height: '44px',
      pointerEvents: 'none',
      opacity: 0.92,
    }}
    aria-hidden="true"
  >
    <path d="M8 32 C35 32 50 16 80 16 C110 16 125 32 152 32" stroke="#D4A359" strokeWidth="2" strokeLinecap="round" />
    {/* Coroa central em carmim e ouro */}
    <circle cx="80" cy="16" r="7" fill="#B8332A" stroke="#D4A359" strokeWidth="1.4" />
    <circle cx="80" cy="16" r="3" fill="#D4A359" />

    {/* Acantos em azul e verde */}
    <path d="M68 16 C58 8 58 24 68 16 Z" fill="#2B4C65" stroke="#D4A359" strokeWidth="0.8" />
    <path d="M92 16 C102 8 102 24 92 16 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.8" />

    <GoldenBezant cx={80} cy={16} r={5} />
    <GoldenBezant cx={45} cy={24} r={4.5} />
    <GoldenBezant cx={115} cy={24} r={4.5} />
  </svg>
);

/** SALA V: Iluminura com Gemas e Ouro Velho na Base Interna da Coluna Direita */
export const TreasuryGemsBaseRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-gems-br ${className}`}
    style={{
      position: 'absolute',
      bottom: '-30px',
      left: '0px',
      width: '160px',
      height: '38px',
      pointerEvents: 'none',
      opacity: 0.92,
    }}
    aria-hidden="true"
  >
    <path d="M8 22 H172" stroke="#D4A359" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18 26 H162" stroke="#D4A359" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

    {/* Gemas em losango carmim e ultramarino */}
    <polygon points="90,10 98,22 90,34 82,22" fill="#B8332A" stroke="#D4A359" strokeWidth="1.2" />
    <polygon points="45,14 52,22 45,30 38,22" fill="#2B4C65" stroke="#D4A359" strokeWidth="1" />
    <polygon points="135,14 142,22 135,30 128,22" fill="#4A5D3F" stroke="#D4A359" strokeWidth="1" />

    <GoldenBezant cx={90} cy={22} r={4} />
    <GoldenBezant cx={8} cy={22} r={4.5} />
    <GoldenBezant cx={172} cy={22} r={4.5} />
  </svg>
);
