# Verificar Configurações de Autenticação no Supabase

## Passos para verificar:

1. **Acesse as configurações de autenticação:**
   https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf/auth/configuration

2. **Verifique se está habilitado:**
   - [ ] Email provider está habilitado
   - [ ] "Enable Email Signups" está marcado
   - [ ] "Enable Email Confirmations" está desmarcado (para testes)

3. **Verifique as configurações de API:**
   https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf/settings/api
   
   - Confirme que a URL é: `https://wvojbjkdlnvlqgjwtdaf.supabase.co`
   - Confirme que a anon key começa com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Verifique se o projeto está ativo:**
   - O projeto não deve estar pausado
   - Deve estar no plano Free ou superior

## Teste alternativo via cURL:

```bash
curl -X POST 'https://wvojbjkdlnvlqgjwtdaf.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2b2piamtkbG52bHFnanF3dGRhZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1NzI5NzE5LCJleHAiOjIwNTEzMDU3MTl9.juWlSIl6oLFH43Ii39TQ1p55scz04uhDj0TVjNduH0k' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "marcoslima9713@gmail.com",
    "password": "123456"
  }'
```

## Possíveis soluções:

1. **Regenerar as chaves API:**
   - Vá em Settings > API
   - Clique em "Generate new JWT secret"
   - Atualize o `.env.local` com as novas chaves

2. **Verificar se o JWT secret não foi alterado:**
   - Se foi alterado recentemente, as chaves antigas não funcionarão

3. **Criar um novo projeto Supabase:**
   - Como último recurso, crie um novo projeto
   - Use as novas chaves