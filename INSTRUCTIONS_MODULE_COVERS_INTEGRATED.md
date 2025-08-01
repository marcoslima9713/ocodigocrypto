# Gerenciamento de Capas dos Módulos - Sistema Integrado

## Visão Geral

O gerenciamento de capas dos módulos agora está **integrado** dentro da seção "Gerenciar Vídeos" do painel administrativo. Isso permite uma gestão mais centralizada e intuitiva das capas dos módulos junto com o conteúdo dos vídeos.

## Como Acessar

1. **Faça login administrativo** com `marcoslima9713@gmail.com` e `Bitcoin2026!`
2. **Acesse o painel administrativo** em `/admin`
3. **Clique na aba "Gerenciar Vídeos"**
4. **Role para baixo** até encontrar a seção "Capas dos Módulos"

## Funcionalidades Disponíveis

### 1. Visualizar Capas Atuais
- Cada módulo é exibido em um card
- Se o módulo tem uma capa personalizada, ela é mostrada
- Se não tem capa, é exibido um placeholder "Sem capa"

### 2. Adicionar/Editar Capas
- **Clique no ícone de imagem** (📷) em qualquer módulo
- **Cole o link da imagem** no campo de texto
- **Suporta links blob** como `blob:https://imgur.com/d459a383-d896-467c-8946-f3d715c018b9`
- **Suporta URLs normais** de imagens
- **Preview automático** da imagem é exibido
- **Clique em "Salvar Capa"** para confirmar

### 3. Remover Capas
- **Clique no ícone de lixeira** (🗑️) em módulos que já têm capa
- **Confirme a remoção** no diálogo
- O módulo voltará a usar a capa padrão

## Tipos de Links Suportados

### Links Blob (Recomendado)
```
blob:https://imgur.com/d459a383-d896-467c-8946-f3d715c018b9
```
- **Vantagem**: Links temporários do Imgur
- **Uso**: Cole diretamente o link copiado do Imgur

### URLs de Imagem
```
https://example.com/imagem.jpg
https://cdn.example.com/cover.png
```
- **Vantagem**: Links permanentes
- **Uso**: Qualquer URL de imagem válida

## Estrutura do Banco de Dados

### Tabela: `module_covers`
```sql
CREATE TABLE IF NOT EXISTS public.module_covers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  cover_image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id)
);
```

### Relacionamentos
- **`module_id`**: Referência para `public.modules(id)`
- **`cover_image`**: URL da imagem da capa
- **`UNIQUE(module_id)`**: Cada módulo pode ter apenas uma capa

## Integração com o Sistema

### Dashboard
- As capas personalizadas são automaticamente exibidas no dashboard
- Se não há capa personalizada, usa a imagem padrão do módulo

### Páginas dos Módulos
- Cada página de módulo busca sua capa personalizada
- Fallback para imagem padrão se não encontrar capa

### Atualizações em Tempo Real
- Mudanças nas capas são refletidas imediatamente
- Não é necessário recarregar a página

## Vantagens do Sistema Integrado

1. **Interface Unificada**: Tudo em um só lugar
2. **Gestão Centralizada**: Vídeos e capas juntos
3. **Fluxo de Trabalho Otimizado**: Menos cliques para gerenciar
4. **Consistência Visual**: Mesmo design e padrões
5. **Manutenção Simplificada**: Menos componentes para manter

## Troubleshooting

### Imagem não carrega
- Verifique se o link está correto
- Teste o link em uma nova aba
- Use links blob do Imgur para melhor compatibilidade

### Erro ao salvar
- Verifique se o módulo existe
- Confirme que o link é válido
- Tente novamente em alguns segundos

### Capa não aparece no dashboard
- Aguarde alguns segundos para sincronização
- Recarregue a página se necessário
- Verifique se a capa foi salva corretamente

## Exemplo de Uso

1. **Acesse** o painel administrativo
2. **Vá para** "Gerenciar Vídeos"
3. **Encontre** o módulo "Pool de Liquidez"
4. **Clique** no ícone de imagem
5. **Cole** o link: `blob:https://imgur.com/d459a383-d896-467c-8946-f3d715c018b9`
6. **Confirme** o preview da imagem
7. **Clique** em "Salvar Capa"
8. **Verifique** no dashboard se a capa foi aplicada

## Notas Importantes

- **Backup**: As capas são salvas no banco de dados
- **Performance**: Imagens são carregadas sob demanda
- **Segurança**: Apenas admins podem modificar capas
- **Compatibilidade**: Funciona com qualquer URL de imagem válida 