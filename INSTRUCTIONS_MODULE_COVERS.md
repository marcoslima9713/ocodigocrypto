# Gerenciamento de Capas dos Módulos

## ✅ **Nova Funcionalidade Implementada!**

Adicionei uma nova aba no painel administrativo para gerenciar as capas dos módulos que aparecem no Dashboard.

## 🎯 **Como Acessar:**

1. **Acesse o Painel Administrativo**:
   - Login: `marcoslima9713@gmail.com`
   - Senha: `Bitcoin2026!`
   - Ou clique em "Admin" no Dashboard

2. **Navegue para a Nova Aba**:
   - Clique na aba **"Capas dos Módulos"**
   - Esta aba está localizada entre "Gerenciar Vídeos" e "Firebase"

## 🖼️ **Funcionalidades Disponíveis:**

### **Visualizar Módulos**
- Lista todos os módulos ativos
- Mostra se cada módulo tem uma capa personalizada
- Exibe preview da capa atual (se existir)

### **Adicionar Capa**
1. Clique em **"Adicionar"** ao lado do módulo
2. Selecione uma imagem (JPG, PNG, WebP)
3. Visualize o preview
4. Clique em **"Salvar Capa"**

### **Editar Capa Existente**
1. Clique em **"Editar"** ao lado do módulo
2. Veja a capa atual
3. Selecione uma nova imagem
4. Clique em **"Salvar Capa"**

### **Remover Capa**
1. Clique no ícone **🗑️** (lixeira) ao lado do módulo
2. Confirme a remoção

## 📋 **Requisitos das Imagens:**

### **Formatos Aceitos:**
- JPG/JPEG
- PNG
- WebP

### **Tamanho Recomendado:**
- **1920x1080px** (16:9)
- Mínimo: 1280x720px
- Máximo: 4MB

### **Dicas para Boas Capas:**
- ✅ Use imagens de alta qualidade
- ✅ Mantenha o texto legível sobre a imagem
- ✅ Use cores que contrastem bem com texto branco
- ✅ Evite imagens muito claras ou muito escuras
- ✅ Teste como fica no Dashboard

## 🗄️ **Estrutura do Banco de Dados:**

### **Tabela: `module_covers`**
```sql
- id (UUID, Primary Key)
- module_id (TEXT, Foreign Key para modules.id)
- cover_image (TEXT, URL da imagem)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Script SQL:**
Execute o arquivo `create_module_covers_table.sql` no Supabase SQL Editor para criar a tabela.

## 🔄 **Como Funciona:**

### **No Dashboard:**
- Os módulos mostram a capa personalizada (se configurada)
- Se não houver capa personalizada, usa a imagem padrão
- As capas são carregadas automaticamente

### **Nos Módulos:**
- Cada página de módulo usa a capa personalizada no header
- Fallback para imagem padrão se não houver capa personalizada

### **No Painel Admin:**
- Interface intuitiva para gerenciar todas as capas
- Preview em tempo real
- Upload direto para o Supabase Storage

## 🚀 **Próximos Passos:**

1. **Execute o Script SQL**:
   - Abra o Supabase SQL Editor
   - Execute `create_module_covers_table.sql`

2. **Teste a Funcionalidade**:
   - Acesse o painel administrativo
   - Vá para "Capas dos Módulos"
   - Adicione uma capa para um módulo

3. **Verifique no Dashboard**:
   - A capa deve aparecer automaticamente
   - Teste em diferentes dispositivos

## 🎨 **Exemplos de Uso:**

### **Para o Módulo "Pool de Liquidez":**
- Use a imagem fornecida pelo usuário
- Salve como capa personalizada
- Teste como aparece no Dashboard

### **Para Outros Módulos:**
- Crie capas personalizadas
- Mantenha consistência visual
- Teste a legibilidade do texto

## 🔧 **Solução de Problemas:**

### **Imagem não aparece:**
- Verifique se o formato é suportado
- Confirme se o tamanho está correto
- Teste o upload novamente

### **Erro no upload:**
- Verifique a conexão com o Supabase
- Confirme as permissões da tabela
- Tente uma imagem menor

### **Capa não atualiza:**
- Recarregue a página
- Verifique se salvou corretamente
- Confirme se a tabela foi criada

## 📱 **Responsividade:**

- As capas funcionam em desktop e mobile
- Mantêm proporção 16:9
- Se adaptam automaticamente ao tamanho da tela

---

**A funcionalidade está pronta para uso!** 🎉 