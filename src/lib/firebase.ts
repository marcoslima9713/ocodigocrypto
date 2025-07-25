// Configuração do Firebase
// PERSONALIZE: Substitua as configurações abaixo pelas suas credenciais do Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configurações do seu projeto Firebase
// Para obter essas configurações, acesse: https://console.firebase.google.com/
const firebaseConfig = {
  // SUBSTITUA pelas suas configurações do Firebase Console
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;