import React, { useState, useEffect } from 'react';
import { Shield, Palette, Beer, Scroll, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { tavernAudio } from '../services/tavernAudio';

export type TavernRoomTab = 'campaigns' | 'sketch' | 'urd' | 'chat';

interface TavernRoomTabBarProps {
  activeTab: TavernRoomTab;
  onSelectTab: (tab: TavernRoomTab) => void;
  onBackToHub: () => void;
}

const ROOM_TABS: Array<{
  id: TavernRoomTab;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
}> = [
  {
    id: 'campaigns',
    title: 'Mesa dos Apostadores',
    subtitle: 'MESA DE CARVALHO & MURAL',
    icon: <Shield size={18} strokeWidth={2.2} />,
    badge: 'MESAS'
  },
  {
    id: 'sketch',
    title: 'Telas do Alaúde',
    subtitle: 'ATELIÊ DO BARDO & CAVALETE',
    icon: <Palette size={18} strokeWidth={2.2} />,
    badge: 'ARTE'
  },
  {
    id: 'urd',
    title: 'Urd, o Taberneiro',
    subtitle: 'BALCÃO DE PEDRA & LAREIRA',
    icon: <Beer size={18} strokeWidth={2.2} />,
    badge: 'ORÁCULO'
  },
  {
    id: 'chat',
    title: 'Recanto dos Bardos',
    subtitle: 'SCRIPTORIUM & MISSIVAS',
    icon: <Scroll size={18} strokeWidth={2.2} />,
    badge: 'AO VIVO'
  }
];

export const TavernRoomTabBar: React.FC<TavernRoomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onBackToHub
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return tavernAudio.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
  }, []);

  return (
    <nav className="tavern-room-bar tavern-wood-beam" aria-label="Navegação entre Salas da Taverna">
      <div className="tavern-room-bar__inner">
        {/* Linha 1: Botão de retorno ao Salão Principal + Áudio da Taverna */}
        <div className="tavern-room-bar__top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button
            type="button"
            onClick={onBackToHub}
            className="tavern-room-bar__back-btn"
            title="Retornar ao Grande Salão da Taverna"
          >
            <ArrowLeft size={14} />
            <span>Salão Principal</span>
          </button>

          <button
            type="button"
            onClick={() => tavernAudio.toggle()}
            title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: isPlayingAudio ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
              background: isPlayingAudio ? 'rgba(217, 119, 6, 0.25)' : 'rgba(0, 0, 0, 0.4)',
              color: isPlayingAudio ? '#fef3c7' : '#a89a85',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              boxShadow: isPlayingAudio ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlayingAudio ? <Volume2 size={13} style={{ color: '#f59e0b' }} /> : <VolumeX size={13} />}
            <span>{isPlayingAudio ? 'Alaúde & Lareira' : 'Tocar Música'}</span>
          </button>
        </div>

        {/* Linha 2: As 4 Abas Únicas de Salas em Grid de 4 Colunas Proporcionais */}
        <div className="tavern-room-bar__tabs-grid" role="tablist">
          {ROOM_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`tavern-room-tab-card tavern-room-tab-card--${tab.id} ${isActive ? 'is-active' : ''}`}
                title={`Entrar na sala: ${tab.title}`}
              >
                <span className="tavern-room-tab-card__icon" aria-hidden="true">
                  {tab.icon}
                </span>
                <div className="tavern-room-tab-card__content">
                  <span className="tavern-room-tab-card__title">{tab.title}</span>
                  <span className="tavern-room-tab-card__subtitle">{tab.subtitle}</span>
                </div>
                {tab.badge && (
                  <span className="tavern-room-tab-card__badge">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
