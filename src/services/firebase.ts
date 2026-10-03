// Firebase Configuration & Service Integration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { ADMIN_EMAIL, DEFAULT_MASTER_PASSWORD, storageService } from './storage';
import { UserProfile } from '../types';

const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Verifica se chaves reais de produção foram providenciadas
export const isLiveFirebaseConfigured = Boolean(
  envApiKey && 
  envApiKey.length > 20 && 
  !envApiKey.includes('DemoKey')
);

const firebaseConfig = {
  apiKey: envApiKey || 'AIzaSyDemoKeyTavernaDigitalRPG12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'taberna-digital-rpg.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'taberna-digital-rpg',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'taberna-digital-rpg.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Inicialização segura
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Verificação estrita de privilégio administrativo
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Tradução temática de erros do Firebase para Português
export function parseFirebaseError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui cadastro na estalagem. Faça login com sua senha.';
    case 'auth/invalid-email':
      return 'O formato do endereço de e-mail informado não é válido.';
    case 'auth/weak-password':
      return 'A palavra secreta deve ter no mínimo 6 caracteres para segurança do seu aventureiro.';
    case 'auth/user-not-found':
      return 'Nenhum aventureiro encontrado com este e-mail. Crie seu cadastro primeiro.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Palavra secreta (senha) incorreta ou credenciais inválidas.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas malsucedidas. O taberneiro bloqueou temporariamente os acessos. Tente mais tarde.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a rede. Verifique sua conexão com a internet.';
    default:
      return error?.message || 'Ocorreu um erro ao processar a autenticação na taberna.';
  }
}

export const firebaseAuthService = {
  // 1. Cadastro com E-mail e Senha no Firebase
  async registerWithEmail(email: string, password: string, displayName: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || cleanEmail.split('@')[0];
    const isAdmin = isSuperAdmin(cleanEmail);

    if (isLiveFirebaseConfigured) {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCred.user;

      if (cleanName) {
        await updateProfile(user, { displayName: cleanName });
      }

      const newProfile: UserProfile = {
        uid: user.uid,
        email: cleanEmail,
        displayName: cleanName,
        role: isAdmin ? 'admin' : 'user',
        status: isAdmin ? 'APPROVED' : 'PENDING',
        createdAt: new Date().toISOString(),
        approvedAt: isAdmin ? new Date().toISOString() : undefined,
      };

      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (firestoreErr) {
        console.warn('Aviso ao sincronizar Firestore:', firestoreErr);
      }

      storageService.registerUser(cleanEmail, cleanName);
      return newProfile;
    } else {
      // Modo Local/Demonstração
      const res = storageService.registerUser(cleanEmail, cleanName);
      return res.user;
    }
  },

  // 2. Login com E-mail e Senha no Firebase
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    if (isLiveFirebaseConfigured) {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCred.user;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          storageService.setCurrentUser(profile);
          return profile;
        }
      } catch (docErr) {
        console.warn('Aviso ao carregar perfil do Firestore:', docErr);
      }

      // Se não encontrou no Firestore, recria a partir do Firebase User
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: cleanEmail,
        displayName: user.displayName || cleanEmail.split('@')[0],
        role: isSuperAdmin(cleanEmail) ? 'admin' : 'user',
        status: isSuperAdmin(cleanEmail) ? 'APPROVED' : 'PENDING',
        createdAt: new Date().toISOString(),
      };
      storageService.setCurrentUser(fallbackProfile);
      return fallbackProfile;
    } else {
      // Modo Local/Demonstração: validação com base nas palavras secretas cadastradas
      if (!storageService.verifyPassword(cleanEmail, password)) {
        throw new Error('A palavra secreta (senha) informada está incorreta.');
      }
      return storageService.loginUser(cleanEmail);
    }
  },

  // 3. Recuperação de Senha por E-mail
  async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (isLiveFirebaseConfigured) {
      await sendPasswordResetEmail(auth, cleanEmail);
    } else {
      // Simulação com delay
      await new Promise(res => setTimeout(res, 600));
    }
  },

  // 4. Troca de Senha Segura
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const currentUser = auth.currentUser;
    const localUser = storageService.getCurrentUser();
    const email = currentUser?.email || localUser?.email;

    if (!email) {
      return { success: false, error: 'Nenhum aventureiro identificado na estalagem.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra secreta deve ter no mínimo 6 caracteres.' };
    }

    // Se estiver conectado ao Firebase Authentication ativo
    if (isLiveFirebaseConfigured && currentUser && currentUser.email) {
      try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
      } catch (err: any) {
        return { success: false, error: parseFirebaseError(err) };
      }
    }

    // Atualiza também no repositório de senhas local
    return storageService.changePassword(email, currentPassword, newPassword);
  },

  // 5. Logout
  async logout(): Promise<void> {
    if (isLiveFirebaseConfigured) {
      await signOut(auth);
    }
    storageService.setCurrentUser(null);
  },

  // 6. Observer de Estado de Autenticação
  subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
    if (isLiveFirebaseConfigured) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {};
  }
};
