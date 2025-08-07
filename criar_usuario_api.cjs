// Script para criar usuário via API do Supabase
const https = require('https');

const SUPABASE_URL = 'https://wvojbjkdlnvlqgjwtdaf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2b2piamtkbG52bHFnanF3dGRhZiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzU3Mjk3MTksImV4cCI6MjA1MTMwNTcxOX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const userData = {
  email: 'tradermmtradingcenter@gmail.com',
  password: 'ZxIyaAE4AdXm',
  email_confirm: true,
  user_metadata: {
    full_name: 'marcos paulo',
    product_name: 'Product_ADGtUojEAsnGUmOruCy8'
  }
};

const postData = JSON.stringify(userData);

const options = {
  hostname: 'wvojbjkdlnvlqgjwtdaf.supabase.co',
  port: 443,
  path: '/auth/v1/admin/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const response = JSON.parse(data);
      if (response.user) {
        console.log('✅ Usuário criado com sucesso!');
        console.log('User ID:', response.user.id);
        console.log('Email:', response.user.email);
      } else {
        console.log('❌ Erro ao criar usuário:', response);
      }
    } catch (e) {
      console.log('❌ Erro ao processar resposta:', e);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e);
});

req.write(postData);
req.end();

console.log('🔄 Criando usuário...'); 