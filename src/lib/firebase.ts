// Configuração do Firebase
// PERSONALIZE: Substitua as configurações abaixo pelas suas credenciais do Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export default app;