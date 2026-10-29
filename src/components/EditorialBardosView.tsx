import React, { useState } from 'react';
import { Campaign, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { BardosMessengerPartition } from './BardosMessengerPartition';
import { BardosContactsPartition } from './BardosContactsPartition';

export type BardosPartition = 'chat' | 'contacts';

interface EditorialBardosViewProps {
  onBack?: () => void;
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  onOpenProfile?: (user: UserProfile) => void;
  initialPartition?: BardosPartition;
}

export const EditorialBardosView: React.FC<EditorialBardosViewProps> = ({
  onBack,
  currentUser,
  campaigns,
  allUsers,
  onOpenProfile,
  initialPartition = 'chat',
}) => {
  const [partition, setPartition] = useState<BardosPartition>(initialPartition);
  // Canal a abrir ao iniciar uma conversa direta pela Partição 2
  const [pendingChannelId, setPendingChannelId] = useState<string | null>(null);

  const handleStartChat = (otherUid: string) => {
    if (!currentUser) return;
    setPendingChannelId(chatService.getDirectChannelId(currentUser.uid, otherUid));
    setPartition('chat');
  };

  return (
    <main className="editorial-room-container" style={partition === 'chat' ? { maxWidth: 1152 } : undefined}>
      <div className="editorial-header-bar">
        <button
          onClick={() => {
            if (onBack) onBack();
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0',
            cursor: 'pointer',
            color: 'inherit',
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '14px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'opacity 0.2s ease',
          }}
          className="hover:opacity-100"
        >
          ← Voltar à Galeria
        </button>

        <div className="editorial-segmented-control dark-theme">
          {([
            { id: 'chat', label: 'Mensagens & Confraria' },
            { id: 'contacts', label: 'Jogadores & Contatos' },
          ] as { id: BardosPartition; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== partition) setPendingChannelId(null);
                setPartition(tab.id);
              }}
              className={`editorial-segmented-item ${partition === tab.id ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {partition === 'chat' ? (
        <BardosMessengerPartition
          currentUser={currentUser}
          campaigns={campaigns}
          allUsers={allUsers}
          initialChannelId={pendingChannelId}
          onOpenProfile={onOpenProfile}
        />
      ) : (
        <BardosContactsPartition
          currentUser={currentUser}
          allUsers={allUsers}
          onStartChat={handleStartChat}
          onOpenProfile={onOpenProfile}
        />
      )}
    </main>
  );
};
