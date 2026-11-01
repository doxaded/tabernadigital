import React, { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { tavernAudio } from '../services/tavernAudio';

interface DiceTray3DProps {
  /** Disparado quando todos os dados pousam (ou no fallback matemático) */
  onResult: (die: string, value: number) => void;
}

const DICE = [4, 6, 8, 10, 12, 20, 100];

/*
 * O motor (public/assets/dice_engine.js) prende um renderer WebGL a um canvas e registra um
 * listener global de resize. Para não vazar contextos, mantemos UM canvas/engine persistente
 * e apenas o movemos para dentro do componente quando ele monta.
 */
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedEngine: any = null;

const getCanvas = () => {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.id = 'tableDiceCanvas';
    sharedCanvas.style.width = '100%';
    sharedCanvas.style.height = '100%';
    sharedCanvas.style.display = 'block';
  }
  return sharedCanvas;
};

export const DiceTray3D: React.FC<DiceTray3DProps> = ({ onResult }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [rolling, setRolling] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [banner, setBanner] = useState<'nat20' | 'nat1' | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = getCanvas();
    host.appendChild(canvas);

    const w = window as any;
    const timer = window.setTimeout(() => {
      try {
        if (!sharedEngine && w.DicePhysicsEngine) {
          sharedEngine = new w.DicePhysicsEngine(canvas);
        } else if (sharedEngine) {
          sharedEngine.handleResize();
        }
        setEngineReady(!!sharedEngine);
      } catch (e) {
        console.warn('Erro ao inicializar o tabuleiro 3D:', e);
      }
    }, 60);

    return () => {
      window.clearTimeout(timer);
      if (canvas.parentElement === host) host.removeChild(canvas);
    };
  }, []);

  const roll = (sides: number) => {
    if (rolling) return;
    const name = `d${sides}`;
    setRolling(name);
    setBanner(null);
    tavernAudio.playDiceRoll();

    if (!sharedEngine) {
      window.setTimeout(() => {
        onResult(name, Math.floor(Math.random() * sides) + 1);
        setRolling(null);
      }, 280);
      return;
    }

    const plan = [{ sides, value: Math.floor(Math.random() * sides) + 1 }];
    try {
      sharedEngine.roll(plan, (settled: any[]) => {
        const v = settled[0]?.targetVal ?? plan[0].value;
        if (sides === 20) setBanner(v === 20 ? 'nat20' : v === 1 ? 'nat1' : null);
        onResult(name, v);
        setRolling(null);
      });
    } catch (e) {
      console.warn('Falha na rolagem 3D, usando fallback:', e);
      onResult(name, plan[0].value);
      setRolling(null);
    }
  };

  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(260px, 38vh, 380px)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(212,163,89,0.3)',
          background: '#0c0a14',
        }}
      >
        <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
        {!engineReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EAE0D5', fontStyle: 'italic', fontSize: '14px', opacity: 0.7, pointerEvents: 'none' }}>
            Preparando o tabuleiro...
          </div>
        )}
        {banner && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 20px',
              borderRadius: '999px',
              background: banner === 'nat20' ? 'rgba(212,163,89,0.95)' : 'rgba(150,40,30,0.95)',
              color: '#100905',
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: '13px',
            }}
          >
            {banner === 'nat20' ? 'Sucesso Crítico!' : 'Falha Crítica!'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
        {DICE.map(sides => (
          <button
            key={sides}
            onClick={() => roll(sides)}
            disabled={rolling !== null}
            className="editorial-btn-secondary"
            style={{
              padding: '10px 18px',
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: '18px',
              fontWeight: 600,
              opacity: rolling === `d${sides}` ? 0.4 : 1,
            }}
          >
            <Dices size={16} />
            d{sides}
          </button>
        ))}
      </div>
    </div>
  );
};
