import React, { useState } from 'react';
import { Flame, Dices, Bell, Sparkles } from 'lucide-react';
import { tavernAudio } from '../services/tavernAudio';

interface TavernInteractiveDeskProps {
  compact?: boolean;
}

const D20_OMENS: Record<number, string> = {
  20: 'Crítico Supremo! Os bardos cantarão seus feitos pelos próximos séculos!',
  19: 'Glória quase lendária! A lâmina encontrou a fresta perfeita da armadura!',
  18: 'Sorte régia! Uma lufada de vento a favor sopra em suas velas!',
  17: 'Um golpe certeiro na penumbra da masmorra!',
  16: 'A intuição do ladino nunca erra.',
  15: 'O feitiço ressoa com clareza nos corredores.',
  14: 'Sua destreza impressiona até os guardas do castelo.',
  13: 'Um brinde ao destino: o caminho adiante está livre.',
  12: 'Nem sorte, nem azar — apenas disciplina de veterano.',
  11: 'A taverna murmura... notícias boas chegam dos ermos.',
  10: 'Equilíbrio na balança do destino.',
  9: 'Uma poeira nos olhos, mas o escudo ainda resiste.',
  8: 'O piso range sob suas botas de ferro.',
  7: 'Cuidado com as sombras na curva do corredor.',
  6: 'A tocha pisca; algo se move na escuridão.',
  5: 'Uma corda de alaúde se rompe na hora errada.',
  4: 'O mestre da mesa sorri enigmático atrás do escudo...',
  3: 'A armadura pesou, o reflexo foi tardio.',
  2: 'Quase um desastre — por um triz o elmo salvou.',
  1: 'Falha Crítica! Uma caneca de cerveja entorna no seu mapa antigo!'
};

export const TavernInteractiveDesk: React.FC<TavernInteractiveDeskProps> = ({ compact = false }) => {
  // Estado da Tocha: 2 = crepitante forte, 1 = chama suave, 0 = apagada
  const [torchLevel, setTorchLevel] = useState<number>(2);
  
  // Estado do Dado d20
  const [d20Val, setD20Val] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [d20Omen, setD20Omen] = useState<string | null>(null);

  // Estado do Brinde
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastActive, setIsToastActive] = useState(false);

  // Estado do Sino
  const [isRinging, setIsRinging] = useState(false);
  const [bellMessage, setBellMessage] = useState<string | null>(null);

  // Handler da Tocha
  const handleToggleTorch = () => {
    tavernAudio.playFlameWhoosh();
    setTorchLevel(prev => (prev === 2 ? 1 : prev === 1 ? 0 : 2));
  };

  // Handler do Dado d20
  const handleRollD20 = () => {
    if (isRolling) return;
    setIsRolling(true);
    tavernAudio.playDiceRoll();

    let spins = 0;
    const interval = setInterval(() => {
      setD20Val(Math.floor(Math.random() * 20) + 1);
      spins++;
      if (spins > 7) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setD20Val(finalRoll);
        setD20Omen(D20_OMENS[finalRoll] || 'Os dados foram lançados na mesa.');
        setIsRolling(false);
      }
    }, 45);
  };

  // Handler do Brinde
  const handleToast = () => {
    tavernAudio.playToastSound();
    setIsToastActive(true);
    const toasts = [
      '"Tim-tim! Vida longa aos bravos da taverna!"',
      '"Pela glória da guilda e pelos tesouros da masmorra!"',
      '"Aos companheiros caídos e às vitórias que virão!"',
      '"Que o hidromel nunca acabe e as tochas nunca apaguem!"'
    ];
    setToastMessage(toasts[Math.floor(Math.random() * toasts.length)]);
    setTimeout(() => {
      setIsToastActive(false);
      setTimeout(() => setToastMessage(null), 1000);
    }, 2800);
  };

  // Handler do Sino
  const handleRingBell = () => {
    tavernAudio.playBellChime();
    setIsRinging(true);
    const bells = [
      '"O taberneiro ergue o olhar: Pois não, aventureiro?"',
      '"O sino de latão ecoa suave pelo salão de carvalho."',
      '"Rodada de hidromel na conta da casa!"'
    ];
    setBellMessage(bells[Math.floor(Math.random() * bells.length)]);
    setTimeout(() => {
      setIsRinging(false);
      setTimeout(() => setBellMessage(null), 1200);
    }, 2500);
  };

  return (
    <div
      className="tavern-desk-dock"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '8px' : '12px',
        padding: compact ? '4px 8px' : '6px 12px',
        backgroundColor: 'rgba(24, 16, 8, 0.85)',
        border: '1px solid rgba(245, 158, 11, 0.22)',
        borderRadius: '9999px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {/* 1. Tocha Mística Interativa */}
      <button
        type="button"
        onClick={handleToggleTorch}
        title={
          torchLevel === 2
            ? 'Tocha: Labareda Crepitante (Clique para diminuir)'
            : torchLevel === 1
            ? 'Tocha: Chama Suave (Clique para apagar)'
            : 'Tocha: Apagada (Clique para acender)'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 9px',
          borderRadius: '9999px',
          border: torchLevel > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor:
            torchLevel === 2
              ? 'rgba(217, 119, 6, 0.28)'
              : torchLevel === 1
              ? 'rgba(217, 119, 6, 0.14)'
              : 'rgba(0, 0, 0, 0.4)',
          color: torchLevel === 2 ? '#fbbf24' : torchLevel === 1 ? '#f59e0b' : '#78716c',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: 700
        }}
      >
        <Flame
          size={14}
          style={{
            filter: torchLevel === 2 ? 'drop-shadow(0 0 6px #f59e0b)' : 'none',
            transform: torchLevel === 2 ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
        />
        <span style={{ fontFamily: 'var(--font-body)' }}>
          {torchLevel === 2 ? 'Fogo Alto' : torchLevel === 1 ? 'Chama Suave' : 'Apagada'}
        </span>
      </button>

      {/* 2. Dado d20 da Sorte Interativo */}
      <button
        type="button"
        onClick={handleRollD20}
        disabled={isRolling}
        title="Lançar d20 da Sorte na Mesa da Taverna"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          backgroundColor: isRolling ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.18)',
          color: d20Val === 20 ? '#22c55e' : d20Val === 1 ? '#ef4444' : '#fef3c7',
          cursor: isRolling ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: 800
        }}
      >
        <Dices
          size={14}
          style={{
            color: '#f59e0b',
            transform: isRolling ? 'rotate(360deg)' : 'none',
            transition: isRolling ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {d20Val !== null ? `d20: ${d20Val}` : 'Rolar d20'}
        </span>
      </button>

      {/* 3. Brinde de Hidromel (Caneca) */}
      <button
        type="button"
        onClick={handleToast}
        title="Erguer Caneca e Fazer um Brinde"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 9px',
          borderRadius: '9999px',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          backgroundColor: isToastActive ? 'rgba(217, 119, 6, 0.35)' : 'rgba(255, 255, 255, 0.05)',
          color: '#fef3c7',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: 700
        }}
      >
        <Sparkles
          size={13}
          style={{
            color: '#f59e0b',
            transform: isToastActive ? 'scale(1.25)' : 'none',
            transition: 'transform 0.2s ease'
          }}
        />
        <span style={{ fontFamily: 'var(--font-body)' }}>Brindar</span>
      </button>

      {/* 4. Sino de Balcão (Latão) */}
      <button
        type="button"
        onClick={handleRingBell}
        title="Tocar o Sino de Latão do Balcão"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 9px',
          borderRadius: '9999px',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          backgroundColor: isRinging ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.05)',
          color: '#fbbf24',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '11px',
          fontWeight: 700
        }}
      >
        <Bell
          size={13}
          style={{
            transform: isRinging ? 'rotate(20deg) scale(1.15)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />
        <span style={{ fontFamily: 'var(--font-body)' }}>Sino</span>
      </button>

      {/* Tooltip / Notificação Flutuante de Interação (Presságio do d20, Brinde ou Sino) */}
      {(d20Omen || toastMessage || bellMessage) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 90,
            minWidth: '260px',
            maxWidth: '380px',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: '#1b120a',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
            color: '#fef3c7',
            fontSize: '11.5px',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'none'
          }}
        >
          <Sparkles size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>{toastMessage || bellMessage || (d20Omen ? d20Omen : '')}</span>
        </div>
      )}
    </div>
  );
};
