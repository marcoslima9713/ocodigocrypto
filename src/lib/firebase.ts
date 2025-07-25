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
  apiKey: "AIzaSy...", // COLE SUA API KEY AQUI
  authDomain: "seu-projeto.firebaseapp.com", // COLE SEU AUTH DOMAIN
  projectId: "seu-projeto-id", // COLE SEU PROJECT ID
  storageBucket: "seu-projeto.appspot.com", // COLE SEU STORAGE BUCKET
  messagingSenderId: "123456789", // COLE SEU MESSAGING SENDER ID
  appId: "1:123456789:web:abc123" // COLE SEU APP ID
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;