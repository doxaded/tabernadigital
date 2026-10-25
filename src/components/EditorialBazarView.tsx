import React, { useState } from 'react';
import { Sparkles, Coins, Gift, Check, Shield, Crown } from 'lucide-react';
import { UserProfile, ShopTitleItem, ShopFrameItem, ShopItemRarity } from '../types';
import {
  SHOP_TITLES,
  SHOP_FRAMES,
  getEffectiveGold,
  isItemUnlocked,
  isItemEquipped,
  isDailyRewardAvailable,
  DAILY_REWARD_GOLD,
  DEFAULT_TITLE_NAME,
  DEFAULT_FRAME_ID
} from '../services/tavernShopCatalog';
import { AvatarFrame } from './AvatarFrame';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialBazarViewProps {
  currentUser: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onOpenAuth?: () => void;
}

type TabFilter = 'all' | 'titles' | 'frames';

export const EditorialBazarView: React.FC<EditorialBazarViewProps> = ({
  currentUser,
  onSaveProfile,
  onOpenAuth,
}) => {
  const [filter, setFilter] = useState<TabFilter>('all');
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const currentGold = currentUser ? getEffectiveGold(currentUser) : 0;
  const equippedTitle = currentUser?.title || DEFAULT_TITLE_NAME;
  const equippedFrameId = currentUser?.frameId || DEFAULT_FRAME_ID;

  const notify = (text: string, ok = true) => {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleClaimDaily = async () => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (!isDailyRewardAvailable(currentUser) || isProcessing) return;

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const newGold = currentGold + DAILY_REWARD_GOLD;
      const nowIso = new Date().toISOString();
      await onSaveProfile({
        gold: newGold,
        lastDailyRewardDate: nowIso,
      });
      notify(`Baú da lareira aberto: +${DAILY_REWARD_GOLD} Peças de Ouro adicionadas ao seu bornal!`);
    } catch {
      notify('Falha ao recolher ouro da lareira.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyTitle = async (item: ShopTitleItem) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (isProcessing) return;
    if (currentGold < item.price) {
      notify(`Ouro insuficiente! Necessita de mais ${item.price - currentGold} PO.`, false);
      return;
    }

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const unlocked = [...(currentUser.unlockedTitles || ['Iniciante da Taberna'])];
      if (!unlocked.includes(item.name)) unlocked.push(item.name);

      await onSaveProfile({
        gold: currentGold - item.price,
        title: item.name,
        unlockedTitles: unlocked,
      });
      notify(`Título "${item.name}" adquirido e consagrado ao seu herói!`);
    } catch {
      notify('Falha ao adquirir título.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquipTitle = async (titleName: string) => {
    if (!currentUser || isProcessing) return;
    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      await onSaveProfile({ title: titleName });
      notify(`Título "${titleName}" empunhado com honra.`);
    } catch {
      notify('Falha ao trocar título.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyFrame = async (item: ShopFrameItem) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (isProcessing) return;
    if (currentGold < item.price) {
      notify(`Ouro insuficiente! Necessita de mais ${item.price - currentGold} PO.`, false);
      return;
    }

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const unlocked = [...(currentUser.unlockedFrames || ['default'])];
      if (!unlocked.includes(item.id)) unlocked.push(item.id);

      await onSaveProfile({
        gold: currentGold - item.price,
        frameId: item.id,
        unlockedFrames: unlocked,
      });
      notify(`Moldura "${item.name}" adquirida e engastada!`);
    } catch {
      notify('Falha ao adquirir moldura.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquipFrame = async (frameId: string) => {
    if (!currentUser || isProcessing) return;
    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      await onSaveProfile({ frameId });
      notify(`Moldura forjada ao redor de seu avatar.`);
    } catch {
      notify('Falha ao equipar moldura.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const canClaimDaily = currentUser ? isDailyRewardAvailable(currentUser) : false;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col items-center">
      {/* Saldo de Ouro & Recompensa Diária */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-current/20 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-current/30 flex items-center justify-center">
            <Coins size={22} className="opacity-90" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest opacity-60">Tesouro do Viajante</div>
            <div className="text-3xl font-bold tracking-wider">
              {currentGold.toLocaleString('pt-BR')} <span className="text-sm font-normal opacity-70">PEÇAS DE OURO</span>
            </div>
          </div>
        </div>

        {/* Baú Diário */}
        <button
          onClick={handleClaimDaily}
          disabled={!canClaimDaily || isProcessing}
          className={`flex items-center gap-3 px-5 py-2.5 border border-current/25 transition-all duration-300 text-xs uppercase tracking-widest cursor-pointer ${
            canClaimDaily
              ? 'hover:border-current hover:bg-current/10 opacity-100'
              : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ background: 'none' }}
        >
          <Gift size={16} />
          <span>
            {canClaimDaily
              ? `Reclamar Ouro da Lareira (+${DAILY_REWARD_GOLD} PO)`
              : 'Baú Diário já Coletado Hoje'}
          </span>
        </button>
      </div>

      {/* Notificação Sutil */}
      {feedback && (
        <div
          className={`w-full py-2.5 px-4 mb-6 text-center text-xs uppercase tracking-widest border transition-all ${
            feedback.ok ? 'border-current/40 bg-current/5' : 'border-red-500/40 text-red-400 bg-red-950/20'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Sub-navegação em Texto Puro (Awwwards style) */}
      <div className="flex items-center justify-center gap-10 mb-10 text-sm uppercase tracking-widest">
        {[
          { id: 'all', label: 'Todo o Bazar' },
          { id: 'titles', label: 'Títulos de Honra' },
          { id: 'frames', label: 'Molduras Místicas' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as TabFilter)}
            className={`transition-opacity duration-300 cursor-pointer pb-1 border-b ${
              filter === t.id ? 'opacity-100 font-semibold border-current' : 'opacity-40 hover:opacity-75 border-transparent'
            }`}
            style={{ background: 'none' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview de Avatar e Título Atual */}
      <div className="w-full max-w-md p-6 border border-current/20 flex items-center justify-center gap-6 mb-10">
        <AvatarFrame
          user={currentUser}
          frameId={previewFrameId || equippedFrameId}
          size="lg"
        />
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest opacity-60">Título Consagrado</span>
          <span className="text-xl font-bold tracking-wide italic">
            "{previewTitle || equippedTitle}"
          </span>
          <span className="text-xs opacity-50 tracking-wider">
            {currentUser?.displayName || currentUser?.email || 'Viajante Desconhecido'}
          </span>
        </div>
      </div>

      {/* SEÇÃO 1: TÍTULOS DE HONRA */}
      {(filter === 'all' || filter === 'titles') && (
        <div className="w-full mb-12">
          <div className="flex items-center justify-between pb-3 border-b border-current/20 mb-6">
            <h3 className="text-lg font-semibold uppercase tracking-widest flex items-center gap-2">
              <Crown size={16} /> Títulos de Nobreza & Glória
            </h3>
            <span className="text-xs opacity-50 tracking-wider">Reconhecimento entre os bardos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SHOP_TITLES.map((title) => {
              const isUnlocked = isItemUnlocked(currentUser, 'title', title.name);
              const isEquipped = isItemEquipped(currentUser, 'title', title.name);

              return (
                <div
                  key={title.id}
                  onMouseEnter={() => setPreviewTitle(title.name)}
                  onMouseLeave={() => setPreviewTitle(null)}
                  className="p-5 border border-current/15 hover:border-current/40 transition-all flex flex-col justify-between"
                  style={{ background: 'transparent' }}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs opacity-60 uppercase tracking-widest mb-1.5">
                      <span>{title.rarity}</span>
                      <span className="font-mono">{title.price} PO</span>
                    </div>
                    <div className="text-lg font-bold tracking-wide italic">
                      "{title.name}"
                    </div>
                    <p className="text-xs opacity-70 mt-1 line-clamp-2 leading-relaxed">
                      {title.description}
                    </p>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest opacity-90 font-semibold">
                        <Check size={13} /> Empunhado
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquipTitle(title.name)}
                        className="text-xs uppercase tracking-widest underline underline-offset-4 hover:opacity-70 cursor-pointer"
                        style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                      >
                        Equipar Título
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyTitle(title)}
                        className="text-xs uppercase tracking-widest font-semibold border border-current/30 px-3 py-1.5 hover:border-current hover:bg-current/10 transition-colors cursor-pointer"
                        style={{ background: 'none', color: 'inherit' }}
                      >
                        Comprar ({title.price} PO)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: MOLDURAS MÍSTICAS */}
      {(filter === 'all' || filter === 'frames') && (
        <div className="w-full mb-12">
          <div className="flex items-center justify-between pb-3 border-b border-current/20 mb-6">
            <h3 className="text-lg font-semibold uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} /> Molduras Místicas & Forjadas
            </h3>
            <span className="text-xs opacity-50 tracking-wider">Aros arcanos para seu retrato</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {SHOP_FRAMES.map((frame) => {
              const isUnlocked = isItemUnlocked(currentUser, 'frame', frame.id);
              const isEquipped = isItemEquipped(currentUser, 'frame', frame.id);

              return (
                <div
                  key={frame.id}
                  onMouseEnter={() => setPreviewFrameId(frame.id)}
                  onMouseLeave={() => setPreviewFrameId(null)}
                  className="p-5 border border-current/15 hover:border-current/40 transition-all flex flex-col items-center text-center justify-between"
                  style={{ background: 'transparent' }}
                >
                  <div className="my-3">
                    <AvatarFrame
                      user={currentUser}
                      frameId={frame.id}
                      size="lg"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="text-xs opacity-60 uppercase tracking-widest mb-1 font-mono">
                      {frame.price} PO • {frame.rarity}
                    </div>
                    <div className="text-base font-bold tracking-wide">
                      {frame.name}
                    </div>
                    <p className="text-xs opacity-70 mt-1 line-clamp-2 leading-relaxed">
                      {frame.description}
                    </p>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest opacity-90 font-semibold">
                        <Check size={13} /> Engastada
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquipFrame(frame.id)}
                        className="text-xs uppercase tracking-widest underline underline-offset-4 hover:opacity-70 cursor-pointer"
                        style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                      >
                        Engastar Moldura
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyFrame(frame)}
                        className="text-xs uppercase tracking-widest font-semibold border border-current/30 px-3 py-1.5 hover:border-current hover:bg-current/10 transition-colors cursor-pointer"
                        style={{ background: 'none', color: 'inherit' }}
                      >
                        Comprar ({frame.price} PO)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
