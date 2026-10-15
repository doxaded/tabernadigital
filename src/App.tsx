import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CampaignsView } from './components/CampaignsView';
import { SketchStudioView } from './components/SketchStudioView';
import { UrdChatView } from './components/UrdChatView';
import { ChatPortalView } from './components/ChatPortalView';
import { UserProfileModal } from './components/UserProfileModal';
import { MasterScreenView } from './components/MasterScreenView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './components/LandingPage';
import { storageService, ADMIN_EMAIL } from './services/storage';
import { firebaseAuthService, db, auth, isLiveFirebaseConfigured } from './services/firebase';
import { cloudCampaigns } from './services/cloudCampaigns';
import { Campaign, CharacterSheet, LoreEntry, RuleDocument, SketchAsset, UserProfile } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storageService.getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [sketches, setSketches] = useState<SketchAsset[]>(() => storageService.getSketches());
  const [urdMessages, setUrdMessages] = useState(() => storageService.getUrdMessages());

  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'sketch' | 'urd' | 'chat'>('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => campaigns[0]?.id || null);
  const [masterScreenCampaignId, setMasterScreenCampaignId] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<UserProfile | null>(null);

  // Sincroniza dados com o storage
  const reloadData = async () => {
    const allUsers = await firebaseAuthService.getAllUsers();
    setUsers(allUsers);
    setCampaigns(storageService.getCampaigns());
    setSketches(storageService.getSketches());
    setUrdMessages(storageService.getUrdMessages());
    const refreshedCurrent = storageService.getCurrentUser();
    setCurrentUser(refreshedCurrent);
  };

  useEffect(() => {
    // Sincronização inicial
    reloadData();

    // Auto-migração/Auto-login silencioso do Firebase Auth caso o usuário tenha um cookie local antigo
    const localUser = storageService.getCurrentUser();
    if (localUser) {
      const unsubscribe = firebaseAuthService.subscribeAuthState(async (fbUser) => {
        if (!fbUser) {
          const passwords = storageService.getPasswords();
          const localPass = passwords[localUser.email.toLowerCase()];
          if (localPass) {
            console.log('Auto-recuperando sessão do Firebase Auth a partir do cache local...');
            try {
              await firebaseAuthService.loginWithEmail(localUser.email, localPass);
              reloadData(); // Recarrega os dados agora que temos o Token do Firebase
            } catch (err) {
              console.warn('Falha na auto-recuperação da sessão:', err);
            }
          }
        }
        unsubscribe(); // Só queremos rodar essa checagem 1 vez no boot
      });
    }
  }, []);

  // Sincroniza as salas com a nuvem (Firestore): baixa ao entrar, ao voltar para a aba e a cada 30s,
  // para o mestre ver jogadores novos e o jogador ver as salas em que entrou.
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'APPROVED') {
      cloudCampaigns.setUser(null);
      return;
    }
    cloudCampaigns.setUser(currentUser);
    let cancelled = false;
    const run = async () => {
      const updated = await cloudCampaigns.pull(currentUser);
      if (updated && !cancelled) setCampaigns(storageService.getCampaigns());
    };
    run();
    const interval = setInterval(run, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.status]);

  // Cada usuário só enxerga as salas que mestra ou em que entrou com a chave (admin enxerga todas)
  const visibleCampaigns = currentUser
    ? campaigns.filter(c =>
        currentUser.role === 'admin' ||
        c.masterId === currentUser.uid ||
        !!c.players?.some(p => p.uid === currentUser.uid)
      )
    : [];

  // Handlers de Autenticação
  const handleLogin = (email: string, displayName?: string) => {
    const res = storageService.loginUser(email);
    setCurrentUser(res);
    reloadData();
  };

  const handleLogout = async () => {
    await firebaseAuthService.logout();
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsAuthModalOpen(false);
    setHasEntered(false);
  };

  // Handlers Administrativos (Exclusivos para henrique.v.berbert@gmail.com)
  const handleApproveUser = async (uid: string) => {
    if (!currentUser) return;
    const ok = await firebaseAuthService.approveUser(uid, currentUser.email);
    if (ok) {
      reloadData();
    }
  };

  const handleRejectUser = async (uid: string) => {
    if (!currentUser) return;
    const ok = await firebaseAuthService.rejectUser(uid, currentUser.email);
    if (ok) {
      reloadData();
    }
  };

  // Handlers de Campanhas
  const handleCreateCampaign = (name: string, description: string, system: string, coverUrl?: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const res = storageService.createCampaign(currentUser, name, description, system, coverUrl);
    if (res.success) {
      reloadData();
      if (res.campaign) {
        setSelectedCampaignId(res.campaign.id);
      }
    }
    return res;
  };

  const handleUpdateCampaign = (id: string, data: Partial<Pick<Campaign, 'name' | 'coverUrl' | 'description' | 'system'>>) => {
    if (!currentUser) return;
    storageService.updateCampaign(id, currentUser, data);
    reloadData();
  };

  const handleDeleteCampaign = (id: string) => {
    if (!currentUser) return;
    storageService.deleteCampaign(id, currentUser);
    reloadData();
    const remaining = storageService.getCampaigns().filter(c =>
      currentUser.role === 'admin' ||
      c.masterId === currentUser.uid ||
      !!c.players?.some(p => p.uid === currentUser.uid)
    );
    setSelectedCampaignId(remaining[0]?.id || null);
  };

  // Chave de sala: entrar, trocar a chave e remover/sair de jogadores
  const handleJoinByKey = async (rawKey: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const res = await cloudCampaigns.joinByKey(currentUser, rawKey);
    if (res.success) {
      setCampaigns(storageService.getCampaigns());
      if (res.campaignId) setSelectedCampaignId(res.campaignId);
    }
    return res;
  };

  const handleRegenerateKey = async (campaignId: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const campaign = storageService.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    const res = await cloudCampaigns.regenerateKey(campaign, currentUser);
    setCampaigns(storageService.getCampaigns());
    return res;
  };

  const handleRemovePlayer = async (campaignId: string, playerUid: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const campaign = storageService.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    const res = await cloudCampaigns.removePlayer(campaign, playerUid, currentUser);
    setCampaigns(storageService.getCampaigns());
    if (res.success && playerUid === currentUser.uid) {
      const remaining = storageService.getCampaigns().filter(c =>
        currentUser.role === 'admin' ||
        c.masterId === currentUser.uid ||
        !!c.players?.some(p => p.uid === currentUser.uid)
      );
      setSelectedCampaignId(remaining[0]?.id || null);
    }
    return res;
  };

  // Handlers de Divisórias (Fichas, Lore, Regras)
  const handleAddSheet = (campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>) => {
    storageService.addSheet(campaignId, sheet);
    reloadData();
  };

  const handleUpdateSheet = (campaignId: string, sheetId: string, data: Partial<CharacterSheet>) => {
    storageService.updateSheet(campaignId, sheetId, data);
    reloadData();
  };

  const handleDeleteSheet = (campaignId: string, sheetId: string) => {
    storageService.deleteSheet(campaignId, sheetId);
    reloadData();
  };

  const handleAddLore = (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => {
    storageService.addLore(campaignId, lore);
    reloadData();
  };

  const handleDeleteLore = (campaignId: string, loreId: string) => {
    storageService.deleteLore(campaignId, loreId);
    reloadData();
  };

  const handleUpdateLore = (campaignId: string, loreId: string, data: Partial<LoreEntry>) => {
    storageService.updateLore(campaignId, loreId, data);
    reloadData();
  };

  const handleUpdateRule = (campaignId: string, ruleId: string, data: Partial<RuleDocument>) => {
    storageService.updateRule(campaignId, ruleId, data);
    reloadData();
  };

  const handleAddRule = (campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>) => {
    storageService.addRule(campaignId, rule);
    reloadData();
  };

  const handleDeleteRule = (campaignId: string, ruleId: string) => {
    storageService.deleteRule(campaignId, ruleId);
    reloadData();
  };

  // Handlers do Sketch Studio
  const handleSaveSketch = (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => {
    const item = storageService.saveSketch(sketch);
    reloadData();
    return item;
  };

  const handleDeleteSketch = (id: string) => {
    storageService.deleteSketch(id);
    reloadData();
  };

  // Handlers do Urd
  const handleSendUrdMessage = (sender: 'user' | 'urd', text: string) => {
    storageService.addUrdMessage(sender, text);
    reloadData();
  };

  const handleClearUrdChat = () => {
    storageService.clearUrdChat();
    reloadData();
  };

  // Handlers de Personalização de Perfil de Aventureiro
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = storageService.updateUserProfile(currentUser.uid, updates);
    if (updated) {
      setCurrentUser(updated);
      setProfileModalUser(updated);
    }
    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          ...updates,
        });
      } catch (err) {
        console.warn('Falha ao sincronizar perfil com o Firestore:', err);
      }
    }
    reloadData();
  };

  const handleStartDirectChat = (_targetUser: UserProfile) => {
    setIsProfileModalOpen(false);
    setActiveTab('chat');
  };

  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hasEntered ? (
        <LandingPage onEnter={() => {
          if (currentUser) {
            setHasEntered(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }} />
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setMasterScreenCampaignId(null);
              setActiveTab(tab);
            }}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            onOpenMyProfile={() => {
              if (currentUser) {
                setProfileModalUser(currentUser);
                setIsProfileModalOpen(true);
              }
            }}
            onLogout={handleLogout}
            pendingCount={pendingCount}
            bannerMode={
              (activeTab === 'campaigns' || activeTab === 'sketch' || activeTab === 'urd' || activeTab === 'chat') &&
              !masterScreenCampaignId &&
              currentUser?.status === 'APPROVED'
            }
          />

          {/* Main Content Area */}
          <main className="content-with-bottom-nav" style={{ flex: 1, paddingBottom: '40px' }}>
            {currentUser ? (
              <>
                {/* Caso 2: Usuário com status PENDENTE (Requisito Mandatório: Aprovação por Área Administrativa) */}
                {currentUser.status === 'PENDING' && (
                  <PendingApprovalScreen
                    user={currentUser}
                    onRefresh={reloadData}
                    onLogout={handleLogout}
                  />
                )}

                {/* Caso 3: Usuário APROVADO (Acesso completo aos módulos) */}
                {currentUser.status === 'APPROVED' && (
                  <>
                    {masterScreenCampaignId ? (
                      (() => {
                        const targetCampaign = visibleCampaigns.find(c => c.id === masterScreenCampaignId) || visibleCampaigns[0];
                        const isMasterOfCampaign = targetCampaign && (targetCampaign.masterId === currentUser.uid || currentUser.role === 'admin');
                        if (!isMasterOfCampaign) {
                          return (
                            <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
                              <div className="surface-card" style={{ padding: '36px 20px', border: '2px solid var(--amber-torch)' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
                                  Acesso Restrito ao Mestre da Sala
                                </h3>
                                <p className="font-lore" style={{ fontSize: '15px', color: 'var(--text-strong)', marginBottom: '16px' }}>
                                  Apenas o criador da sala possui acesso aos pergaminhos secretos desta mesa.
                                </p>
                                <button onClick={() => setMasterScreenCampaignId(null)} className="btn-tavern btn-primary">
                                  Voltar às Campanhas
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <MasterScreenView
                            campaign={targetCampaign}
                            currentUser={currentUser}
                            onBackToCampaign={() => setMasterScreenCampaignId(null)}
                            onAddLore={handleAddLore}
                          />
                        );
                      })()
                    ) : (
                      <>
                        {activeTab === 'campaigns' && (
                          <CampaignsView
                            campaigns={visibleCampaigns}
                            currentUser={currentUser}
                            selectedCampaignId={selectedCampaignId}
                            onSelectCampaign={setSelectedCampaignId}
                            onJoinByKey={handleJoinByKey}
                            onRegenerateKey={handleRegenerateKey}
                            onRemovePlayer={handleRemovePlayer}
                            onCreateCampaign={handleCreateCampaign}
                            onUpdateCampaign={handleUpdateCampaign}
                            onDeleteCampaign={handleDeleteCampaign}
                            onAddSheet={handleAddSheet}
                            onUpdateSheet={handleUpdateSheet}
                            onDeleteSheet={handleDeleteSheet}
                            onAddLore={handleAddLore}
                            onDeleteLore={handleDeleteLore}
                            onUpdateLore={handleUpdateLore}
                            onAddRule={handleAddRule}
                            onDeleteRule={handleDeleteRule}
                            onUpdateRule={handleUpdateRule}
                            onOpenMasterScreen={(campId) => setMasterScreenCampaignId(campId)}
                          />
                        )}

                        {activeTab === 'sketch' && (
                          <SketchStudioView
                            sketches={sketches}
                            campaigns={visibleCampaigns}
                            activeCampaignId={selectedCampaignId}
                            onSaveSketch={handleSaveSketch}
                            onDeleteSketch={handleDeleteSketch}
                          />
                        )}

                        {activeTab === 'urd' && (
                          <UrdChatView
                            messages={urdMessages}
                            campaigns={visibleCampaigns}
                            activeCampaignId={selectedCampaignId}
                            onSendMessage={handleSendUrdMessage}
                            onAddToLore={(campaignId, title, content) => {
                              handleAddLore(campaignId, {
                                title,
                                content,
                                category: 'rumores',
                                author: 'Urd, o Taberneiro',
                                tags: ['Oráculo Urd', 'Boato de Taberna']
                              });
                            }}
                            onClearChat={handleClearUrdChat}
                          />
                        )}

                        {activeTab === 'chat' && (
                          <ChatPortalView
                            currentUser={currentUser}
                            campaigns={visibleCampaigns}
                            allUsers={users}
                            onOpenProfile={(user) => {
                              setProfileModalUser(user);
                              setIsProfileModalOpen(true);
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : null}
          </main>
        </>
      )}

      {/* Mobile Bottom Navigation (Cinto do Aventureiro) */}
      {currentUser && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setMasterScreenCampaignId(null);
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          pendingCount={pendingCount}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setHasEntered(true);
          reloadData();
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Exclusive Admin Modal (Acesso restrito a henrique.v.berbert@gmail.com) */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        users={users}
        campaigns={campaigns}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />

      {/* User Profile Modal (Personalização e Inspeção de Ficha/Lore) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        targetUser={profileModalUser}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onStartDirectChat={handleStartDirectChat}
      />
    </div>
  );
}

export default App;
