import React, { useState, useEffect } from 'react';
import {
  Shield,
  Palette,
  Beer,
  Scroll,
  ArrowRight,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Dices,
  Users,
  Compass
} from 'lucide-react';
import { Campaign, UserProfile } from '../types';
import { tavernAudio } from '../services/tavernAudio';

interface TavernHubViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  sketchesCount?: number;
  onNavigate: (tab: 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
}

interface TavernChamber {
  id: 'campaigns' | 'sketch' | 'urd' | 'chat';
  title: string;
  tagline: string;
  badge: string;
  description: string;
  actionText: string;
  icon: React.ReactNode;
  loreSnippet: string;
  accentColor: string;
  bgGradient: string;
  borderHighlight: string;
}

const TAVERN_CHAMBERS: TavernChamber[] = [
  {
    id: 'campaigns',
    title: 'Mesa dos Apostadores',
    tagline: 'MESA DE CARVALHO, DADOS & FICHAS',
    badge: 'MURAL DE CAMPANHAS',
    description: 'Junte-se a uma mesa compartilhada pela chave do mestre ou conduza sua própria saga. Gerencie fichas dinâmicas, lore secreta, mapas e documentos de regras.',
    actionText: 'Puxar uma Cadeira na Mesa',
    icon: <Dices size={28} strokeWidth={2.2} />,
    loreSnippet: 'O som dos dados rolando ecoa pelo salão enquanto os aventureiros apostam seus destinos.',
    accentColor: '#f59e0b',
    bgGradient: 'linear-gradient(145deg, rgba(38, 22, 12, 0.95) 0%, rgba(20, 11, 6, 0.98) 100%)',
    borderHighlight: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'sketch',
    title: 'Telas do Alaúde',
    tagline: 'ATELIÊ DO BARDO & CAVALETE DE PINTURA',
    badge: 'ARTE & ILUSTRAÇÃO',
    description: 'Dê vida visual às suas lendas: ilustre itens lendários, mapas arcanos, criaturas e heróis com o traço aveludado e a imaginação do bardo Orlan Pena-Fina.',
    actionText: 'Abrir o Cavalete de Pintura',
    icon: <Palette size={28} strokeWidth={2.2} />,
    loreSnippet: 'Pincéis de cerda de javali e tintas encantadas capturam a essência das maiores façanhas.',
    accentColor: '#38bdf8',
    bgGradient: 'linear-gradient(145deg, rgba(28, 24, 38, 0.95) 0%, rgba(14, 11, 22, 0.98) 100%)',
    borderHighlight: 'rgba(56, 189, 248, 0.4)'
  },
  {
    id: 'urd',
    title: 'Urd, o Taberneiro',
    tagline: 'BALCÃO DE PEDRA-FUNDA & LAREIRA',
    badge: 'ORÁCULO & BOATOS',
    description: 'Consulte a sabedoria ancestral de Urd, desvende profecias, tire dúvidas sobre regras de boardgame e RPG, ouça os boatos sussurrados na lareira e crie crônicas vivas.',
    actionText: 'Aproximar-se do Balcão',
    icon: <Beer size={28} strokeWidth={2.2} />,
    loreSnippet: 'Entre uma caneca e outra, o velho taberneiro guarda os segredos de mil campanhas.',
    accentColor: '#fbbf24',
    bgGradient: 'linear-gradient(145deg, rgba(42, 26, 10, 0.95) 0%, rgba(22, 13, 5, 0.98) 100%)',
    borderHighlight: 'rgba(251, 191, 36, 0.4)'
  },
  {
    id: 'chat',
    title: 'Recanto dos Bardos',
    tagline: 'SCRIPTORIUM & MISSIVAS AO VIVO',
    badge: 'MENSAGENS & GRUPOS',
    description: 'Comunique-se em tempo real com taverneiros e companheiros de aventura, adicione contatos pela tag única de 7 caracteres, forme grupos e troque missivas seladas.',
    actionText: 'Entrar no Recanto dos Bardos',
    icon: <Scroll size={28} strokeWidth={2.2} />,
    loreSnippet: 'Pergaminhos selados com cera vermelha viajam velozes entre os cantos escuros da taverna.',
    accentColor: '#22c55e',
    bgGradient: 'linear-gradient(145deg, rgba(20, 32, 22, 0.95) 0%, rgba(10, 18, 11, 0.98) 100%)',
    borderHighlight: 'rgba(34, 197, 94, 0.4)'
  },
];

export const TavernHubView: React.FC<TavernHubViewProps> = ({
  currentUser,
  campaigns,
  sketchesCount = 0,
  onNavigate,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return tavernAudio.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
  }, []);

  const handleToggleAudio = () => {
    tavernAudio.toggle();
  };

  return (
    <div
      className="tavern-hub-great-hall"
      role="main"
      aria-label="Salão Principal da Taberna Digital"
      style={{
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 4vw, 56px) 80px',
        position: 'relative'
      }}
    >
      {/* ========================================================================= */}
      {/* CABEÇALHO DO SALÃO: LAREIRA ACONCHEGANTE, BOAS-VINDAS & MÚSICA DA TAVERNA */}
      {/* ========================================================================= */}
      <header
        className="tavern-hearth-banner"
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto 36px',
          borderRadius: '16px',
          border: '1.5px solid rgba(245, 158, 11, 0.3)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(180, 83, 9, 0.35) 0%, rgba(20, 12, 7, 0.95) 75%)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(254, 243, 199, 0.2)',
          padding: 'clamp(28px, 4vw, 44px)',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow de Brasa da Lareira ao Fundo */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '450px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.1) 50%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)'
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          {/* Emblema Central de Fogo e Boas-Vindas */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '30px',
              border: '1px solid #f59e0b',
              background: 'rgba(217, 119, 6, 0.15)',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
              color: '#fef3c7',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-cinzel), Georgia, serif'
            }}
          >
            <Flame size={14} style={{ color: '#f59e0b' }} />
            <span>O Refúgio Medieval dos Mestres & Aventureiros</span>
            <Flame size={14} style={{ color: '#f59e0b' }} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: 900,
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              color: '#fef3c7',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              margin: 0,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.45)'
            }}
          >
            O GRANDE SALÃO DA TAVERNA
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: '#cfc6b8',
              fontFamily: 'var(--font-lore), Georgia, serif',
              maxWidth: '820px',
              margin: 0,
              lineHeight: 1.6
            }}
          >
            Aconchegue-se ao lado da lareira crepitante, peça uma caneca de hidromel artesanal
            e escolha o aposento certo para dar vida à sua próxima sessão de RPG de mesa.
          </p>

          {/* Faixa de Clima & Botão de Música da Taverna */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '12px'
            }}
          >
            <button
              type="button"
              onClick={handleToggleAudio}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '30px',
                border: isPlayingAudio ? '1.5px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.35)',
                background: isPlayingAudio
                  ? 'linear-gradient(135deg, #d97706 0%, #92400e 100%)'
                  : 'rgba(20, 12, 7, 0.85)',
                color: isPlayingAudio ? '#ffffff' : '#fef3c7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isPlayingAudio ? '0 0 20px rgba(245, 158, 11, 0.5)' : '0 4px 12px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-cinzel), Georgia, serif'
              }}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 size={16} />
                  <span>Tocando Alaúde & Lareira (Pausar)</span>
                </>
              ) : (
                <>
                  <VolumeX size={16} />
                  <span>Ouvir Música da Taverna (Lareira & Alaúde)</span>
                </>
              )}
            </button>

            {/* Badges de Clima */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <span
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  color: '#cfc6b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🍺</span>
                <span>Hidromel Servido</span>
              </span>
              <span
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  color: '#cfc6b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🎲</span>
                <span>{campaigns.length} Mesa{campaigns.length !== 1 ? 's' : ''} Aberta{campaigns.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* OS 4 APOSENTOS DA TAVERNA: CARVALHO, ILUSTRAÇÃO, BALCÃO & SCRIPTORIUM     */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}
      >
        {TAVERN_CHAMBERS.map((chamber) => {
          const isHovered = hoveredCard === chamber.id;

          return (
            <article
              key={chamber.id}
              onMouseEnter={() => setHoveredCard(chamber.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onNavigate(chamber.id)}
              style={{
                borderRadius: '16px',
                border: isHovered
                  ? `2px solid ${chamber.accentColor}`
                  : '1.5px solid rgba(245, 158, 11, 0.25)',
                background: chamber.bgGradient,
                boxShadow: isHovered
                  ? `0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px ${chamber.borderHighlight}`
                  : '0 10px 30px rgba(0, 0, 0, 0.65)',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
                transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
            >
              {/* Brilho no topo do card ao passar o mouse */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: isHovered
                    ? `linear-gradient(90deg, transparent, ${chamber.accentColor}, transparent)`
                    : 'transparent',
                  transition: 'background 0.3s ease'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Cabeçalho do Card: Ícone em Medalhão + Badge Temática */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${chamber.accentColor} 0%, rgba(15, 9, 5, 0.9) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: isHovered ? `0 0 18px ${chamber.accentColor}` : '0 4px 12px rgba(0,0,0,0.5)',
                      border: `1px solid ${chamber.accentColor}`,
                      transition: 'transform 0.2s ease',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {chamber.icon}
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: chamber.accentColor,
                      border: `1px solid ${chamber.borderHighlight}`,
                      background: 'rgba(0, 0, 0, 0.45)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontFamily: 'var(--font-cinzel), Georgia, serif'
                    }}
                  >
                    {chamber.badge}
                  </span>
                </div>

                {/* Título & Subtítulo */}
                <div>
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#fef3c7',
                      fontFamily: 'var(--font-cinzel), Georgia, serif',
                      margin: '0 0 4px',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                    }}
                  >
                    {chamber.title}
                  </h2>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: chamber.accentColor,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {chamber.tagline}
                  </span>
                </div>

                {/* Descrição Imersiva */}
                <p
                  style={{
                    fontSize: '14px',
                    color: '#cfc6b8',
                    fontFamily: 'var(--font-lore), Georgia, serif',
                    lineHeight: 1.6,
                    margin: 0
                  }}
                >
                  {chamber.description}
                </p>

                {/* Lore Fragmento */}
                <div
                  style={{
                    borderLeft: `2px solid ${chamber.accentColor}`,
                    paddingLeft: '10px',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: '#a89a85',
                    fontFamily: 'var(--font-lore), Georgia, serif'
                  }}
                >
                  "{chamber.loreSnippet}"
                </div>
              </div>

              {/* Botão de Ação Estilo Taverna */}
              <div style={{ marginTop: '8px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    border: isHovered
                      ? `1.5px solid ${chamber.accentColor}`
                      : '1px solid rgba(245, 158, 11, 0.3)',
                    background: isHovered
                      ? `linear-gradient(90deg, ${chamber.accentColor} 0%, rgba(20, 12, 7, 0.9) 100%)`
                      : 'rgba(0, 0, 0, 0.5)',
                    color: isHovered ? '#ffffff' : '#fef3c7',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: 'var(--font-cinzel), Georgia, serif',
                    letterSpacing: '0.04em',
                    boxShadow: isHovered ? `0 4px 15px ${chamber.borderHighlight}` : 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>{chamber.actionText}</span>
                  <ArrowRight
                    size={16}
                    style={{
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
