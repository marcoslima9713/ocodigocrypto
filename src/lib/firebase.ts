// Configuração do Firebase
// PERSONALIZE: Substitua as configurações abaixo pelas suas credenciais do Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';

// SUBSTITUA pelas suas configurações do Firebase Console
// Para obter essas configurações:
// 1. Acesse https://console.firebase.google.com/
// 2. Selecione seu projeto
// 3. Vá em Configurações do Projeto (ícone engrenagem)
// 4. Na seção "Seus aplicativos", clique no ícone </> 
// 5. Copie as configurações e cole aqui

const firebaseConfig = {
  apiKey: "AIzaSyDu3GPGVeSaH1h5i_vT-ZPUuX_Cfi826AA",
  authDomain: "golden-vault-69wl5.firebaseapp.com",
  projectId: "golden-vault-69wl5",
  storageBucket: "golden-vault-69wl5.firebasestorage.app",
  messagingSenderId: "744361826209",
  appId: "1:744361826209:web:b6633fb45ce183694fdde0"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurações do Firestore para melhor performance e offline support
// Note: Estas configurações podem ajudar com problemas de conectividade

// Estado de conectividade do Firestore
let isFirestoreConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Função para verificar conectividade do Firestore com retry
export const checkFirestoreConnection = async (): Promise<boolean> => {
  if (isFirestoreConnected) {
    return true;
  }

  try {
    await enableNetwork(db);
    isFirestoreConnected = true;
    connectionRetries = 0;
    console.log('Firestore conectado com sucesso');
    return true;
  } catch (error) {
    connectionRetries++;
    console.error(`Erro ao conectar com Firestore (tentativa ${connectionRetries}):`, error);
    
    if (connectionRetries < MAX_RETRIES) {
      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * connectionRetries));
      return checkFirestoreConnection();
    }
    
    isFirestoreConnected = false;
    return false;
  }
};

// Função para desconectar Firestore (útil para debugging)
export const disconnectFirestore = async () => {
  try {
    await disableNetwork(db);
    isFirestoreConnected = false;
    console.log('Firestore desconectado');
  } catch (error) {
    console.error('Erro ao desconectar Firestore:', error);
  }
};

// Função para executar operações do Firestore com fallback
export const executeFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    const isConnected = await checkFirestoreConnection();
    if (!isConnected) {
      console.warn('Firestore não está conectado, usando fallback');
      return fallback;
    }
    
    return await operation();
  } catch (error) {
    console.error('Erro na operação do Firestore:', error);
    return fallback;
  }
};

// Função para resetar o estado de conectividade
export const resetFirestoreConnection = () => {
  isFirestoreConnected = false;
  connectionRetries = 0;
};

export default app;