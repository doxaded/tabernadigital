import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Volume2, VolumeX, Flame } from 'lucide-react';
import { Campaign, UserProfile } from '../types';
import { tavernAudio } from '../services/tavernAudio';

interface TavernHubViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  sketchesCount?: number;
  onNavigate: (tab: 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
}

interface HubModuleConfig {
  id: 'campaigns' | 'sketch' | 'urd' | 'chat';
  theme: 'dark' | 'light';
  lineA: string;
  lineB: string;
  badge: string;
  description: string;
  actionText: string;
}

const HUB_MODULES: HubModuleConfig[] = [
  {
    id: 'campaigns',
    theme: 'dark',
    lineA: 'Mesa dos',
    lineB: 'Apostadores',
    badge: 'MESA DE CARVALHO & FICHAS',
    description: 'Junte-se a uma mesa compartilhada pela chave do mestre ou crie e conduza sua própria saga com fichas, lore e regras.',
    actionText: 'Acessar Mesa dos Apostadores',
  },
  {
    id: 'sketch',
    theme: 'light',
    lineA: 'Telas',
    lineB: 'do Alaúde',
    badge: 'ATELIÊ DO BARDO & PINTURA',
    description: 'Ilustre itens lendários, mapas arcanos, criaturas e heróis com o traço aveludado e a imaginação do bardo Orlan Pena-Fina.',
    actionText: 'Abrir Telas do Alaúde',
  },
  {
    id: 'urd',
    theme: 'dark',
    lineA: 'Urd',
    lineB: 'o Taberneiro',
    badge: 'LAREIRA DE PEDRA & ORÁCULO',
    description: 'Consulte a sabedoria ancestral de Urd, desvende profecias, ouça os boatos sussurrados na lareira e crie crônicas vivas.',
    actionText: 'Consultar o Taberneiro',
  },
  {
    id: 'chat',
    theme: 'light',
    lineA: 'Recanto dos',
    lineB: 'Bardos',
    badge: 'SCRIPTORIUM & CHAT AO VIVO',
    description: 'Comunique-se em tempo real com taverneiros e companheiros de aventura, planeje suas sessões e troque mensagens diretas.',
    actionText: 'Entrar no Recanto dos Bardos',
  },
];

export const TavernHubView: React.FC<TavernHubViewProps> = ({
  onNavigate,
}) => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return tavernAudio.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
  }, []);

  return (
    <div className="hub-checkerboard" role="main" aria-label="Portal de Opções da Taberna Digital">
      {/* Barra Suspensa Superior de Clima da Taverna & Música */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: 'linear-gradient(180deg, rgba(22, 14, 8, 0.95) 0%, rgba(14, 9, 5, 0.85) 100%)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1.5px solid rgba(245, 158, 11, 0.25)',
          padding: '8px var(--edge)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={15} style={{ color: '#f59e0b' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fef3c7',
              fontFamily: 'var(--font-cinzel), Georgia, serif'
            }}
          >
            Salão Principal da Taverna
          </span>
        </div>

        {/* Botão de Música da Taverna */}
        <button
          type="button"
          onClick={() => tavernAudio.toggle()}
          title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            border: isPlayingAudio ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
            background: isPlayingAudio
              ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.35) 0%, rgba(120, 53, 15, 0.25) 100%)'
              : 'rgba(0, 0, 0, 0.4)',
            color: isPlayingAudio ? '#fef3c7' : '#cfc6b8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-cinzel), Georgia, serif',
            boxShadow: isPlayingAudio ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 size={14} style={{ color: '#f59e0b' }} />
              <span>Alaúde & Lareira Ativos</span>
            </>
          ) : (
            <>
              <VolumeX size={14} />
              <span>Ouvir Música da Taverna</span>
            </>
          )}
        </button>
      </div>

      {/* Os 4 Banners Gigantes de Salas da Taverna */}
      {HUB_MODULES.map((mod, index) => {
        const isHovered = hoveredModule === mod.id;
        const isFirst = index === 0;

        return (
          <section
            key={mod.id}
            id={`hub-section-${mod.id}`}
            className={`hub-banner hub-banner--${mod.theme}${isFirst ? ' hub-banner--first' : ''}${isHovered ? ' is-hovered' : ''}`}
            aria-label={`${mod.lineA} ${mod.lineB}`}
          >
            <div className="hub-banner__inner">
              {/* Botão Interativo com o Título Gigante */}
              <button
                type="button"
                className="hub-banner__title-btn"
                onClick={() => onNavigate(mod.id)}
                onMouseEnter={() => setHoveredModule(mod.id)}
                onMouseLeave={() => setHoveredModule(null)}
                aria-label={`${mod.actionText}: ${mod.lineA} ${mod.lineB}`}
                title={`Clique para acessar ${mod.lineA} ${mod.lineB}`}
              >
                <h2 className="hub-banner__title">
                  <span className="hub-banner__line hub-banner__line--a">
                    <span className="hub-banner__word">{mod.lineA}</span>
                  </span>
                  <span className="hub-banner__line hub-banner__line--b">
                    <span className="hub-banner__word">{mod.lineB}</span>
                    <span className="hub-banner__arrow-wrap">
                      <ArrowUpRight className="hub-banner__arrow" size={44} />
                    </span>
                  </span>
                </h2>

                {/* Pill interativo dinâmico que ganha destaque no hover */}
                <div className="hub-banner__pill-tray">
                  <span className="hub-banner__pill">
                    <span>{mod.actionText}</span>
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </button>

              {/* Legenda inferior explicativa do serviço posicionada de forma absoluta para não alterar a posição do título */}
              <div className="hub-banner__service-desc">
                <p>{mod.description}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
