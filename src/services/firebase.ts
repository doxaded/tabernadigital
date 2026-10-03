// Firebase Configuration & Service Integration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { ADMIN_EMAIL } from './storage';

// Configuração opcional via variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyTavernaDigitalRPG12345',
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
