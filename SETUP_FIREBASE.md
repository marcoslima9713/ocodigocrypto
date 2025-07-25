# 🔥 Configuração do Firebase - Área de Membros Premium

## 📋 Pré-requisitos

1. Conta no Google/Firebase
2. Projeto Firebase criado

## 🚀 Passo a Passo

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Escolha um nome para seu projeto
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2. Configurar Authentication

1. No menu lateral, clique em "Authentication"
2. Clique em "Começar"
3. Na aba "Sign-in method":
   - Clique em "Email/senha"
   - Ative "Email/senha"
   - Ative "Link de email (login sem senha)" se desejar
   - Clique em "Salvar"

### 3. Configurar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de teste"
4. Escolha a localização (recomendado: southamerica-east1)
5. Clique em "Concluído"

### 4. Obter Configurações do Projeto

1. Clique no ícone de engrenagem ⚙️ e vá em "Configurações do projeto"
2. Na seção "Seus aplicativos", clique no ícone `</>`
3. Registre seu app com um nome
4. **NÃO** marque "Configure também o Firebase Hosting"
5. Clique em "Registrar app"
6. Copie a configuração que aparece (algo como):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

### 5. Configurar no Projeto

1. Abra o arquivo `src/lib/firebase.ts`
2. Substitua as configurações de exemplo pelas suas:

```typescript
const firebaseConfig = {
  // COLE SUAS CONFIGURAÇÕES AQUI
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### 6. Configurar Regras do Firestore

No Firebase Console, vá em "Firestore Database" > "Regras" e substitua por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Clique em "Publicar" para ativar as regras.

## 🎨 Personalização

### Cores e Visual

Edite os arquivos para personalizar:

- `src/index.css` - Cores e gradientes
- `tailwind.config.ts` - Extensões do Tailwind
- `index.html` - Título e meta tags

### Textos e Conteúdo

Procure por comentários `// PERSONALIZE:` no código para encontrar textos que você pode alterar:

- Nome da plataforma
- Descrições dos módulos
- Mensagens de boas-vindas
- Informações de contato

### Módulos

Edite o array `modules` em `src/pages/Dashboard.tsx` para alterar:

- Títulos dos módulos
- Descrições
- Ícones
- Tempo estimado

## 🔒 Segurança

- As regras do Firestore garantem que usuários só acessem seus próprios dados
- Senhas são gerenciadas pelo Firebase Authentication
- Todas as operações são validadas no servidor

## 🐛 Problemas Comuns

### Erro "Firebase not configured"

- Verifique se as configurações estão corretas em `firebase.ts`
- Confirme que o projeto Firebase foi criado

### Erro de permissão no Firestore

- Verifique se as regras foram aplicadas corretamente
- Confirme que o usuário está autenticado

### Página em branco

- Abra o console do navegador (F12) para ver erros
- Verifique se todas as dependências foram instaladas

## 📞 Suporte

Se precisar de ajuda, verifique:

1. [Documentação do Firebase](https://firebase.google.com/docs)
2. Console do navegador para erros
3. Firebase Console para configurações

---

**🎉 Pronto! Sua área de membros premium está configurada!**