# Módulo DCA - Dollar Cost Averaging

## Visão Geral

O módulo **DCA (Dollar Cost Averaging)** foi criado seguindo o padrão Netflix, igual aos módulos "Origens do Bitcoin" e "Pool de Liquidez". Este módulo ensina sobre a estratégia de investimento mais eficaz para acumular Bitcoin ao longo do tempo.

## Estrutura do Módulo

### 📚 **8 Aulas Estruturadas**

1. **O que é Dollar Cost Averaging?** (15 min)
   - Fundamentos do DCA
   - Por que é eficaz para Bitcoin

2. **Vantagens e Benefícios do DCA** (18 min)
   - Redução da volatilidade
   - Eliminação do timing do mercado
   - Construção de riqueza a longo prazo

3. **Como Implementar DCA na Prática** (20 min)
   - Criação de plano personalizado
   - Definição de frequência e valores

4. **Melhores Plataformas para DCA** (22 min)
   - Principais exchanges
   - Ferramentas de automação

5. **Estratégias Avançadas de DCA** (25 min)
   - Value Averaging
   - DCA com stop-loss
   - Otimização de timing

6. **Analisando Performance do DCA** (18 min)
   - Acompanhamento de resultados
   - Análise de desempenho

7. **Psicologia e Disciplina no DCA** (16 min)
   - Mentalidade correta
   - Consistência e disciplina

8. **DCA vs Outras Estratégias** (20 min)
   - Comparação com lump sum
   - Timing do mercado vs DCA

**Total: 154 minutos (2h 34min)**

## Como Implementar

### 1. **Executar Script SQL**
```bash
# Execute o arquivo add_dca_module.sql no Supabase
# Este script irá:
# - Criar o módulo DCA na tabela modules
# - Inserir as 8 aulas na tabela video_lessons
```

### 2. **Verificar no Dashboard**
- O módulo DCA aparecerá automaticamente no dashboard
- Usará a imagem padrão até que uma capa personalizada seja definida

### 3. **Personalizar Capa (Opcional)**
- Acesse o painel administrativo
- Vá para "Gerenciar Vídeos"
- Role até "Capas dos Módulos"
- Clique no ícone de imagem do módulo DCA
- Cole o link da imagem desejada
- Salve a capa

### 4. **Acessar o Módulo**
- URL: `/modulo/dca`
- Design Netflix com hero section
- Lista de aulas interativa
- Modal de vídeo simulado
- Sistema de progresso

## Características Técnicas

### ✅ **Padrão Netflix Implementado**
- Hero section com imagem de fundo
- Gradiente sobreposto para legibilidade
- Animações com Framer Motion
- Layout responsivo
- Modal de vídeo

### ✅ **Integração Completa**
- Busca dados do Supabase
- Suporte a capas personalizadas
- Listener em tempo real
- Sistema de progresso
- Navegação integrada

### ✅ **Funcionalidades**
- 8 aulas estruturadas
- Diferentes níveis de dificuldade
- Duração estimada por aula
- Status de conclusão
- Preview de vídeo

## Estrutura de Dados

### Tabela `modules`
```sql
id: 'dca'
name: 'DCA - Dollar Cost Averaging'
description: 'Domine a estratégia de investimento mais eficaz...'
order_index: 8
is_active: true
```

### Tabela `video_lessons`
- 8 registros para o módulo DCA
- Status: 'publicado'
- is_public: true
- Diferentes níveis: iniciante, intermediario, avancado

## Navegação

### Dashboard → Módulo DCA
- O módulo aparece automaticamente no dashboard
- Clique para acessar `/modulo/dca`

### Módulo DCA → Dashboard
- Botão "Voltar ao Dashboard" no topo
- Navegação integrada

## Personalização

### Capa do Módulo
- Suporte a links blob do Imgur
- URLs de imagem normais
- Preview automático
- Fallback para imagem padrão

### Conteúdo das Aulas
- Gerenciável via painel administrativo
- Títulos e descrições editáveis
- Duração configurável
- Níveis de dificuldade

## Próximos Passos

1. **Executar o script SQL** para criar o módulo
2. **Verificar** se aparece no dashboard
3. **Personalizar** a capa se desejado
4. **Testar** a navegação e funcionalidades
5. **Adicionar** vídeos reais quando disponíveis

## Troubleshooting

### Módulo não aparece no dashboard
- Verificar se o script SQL foi executado
- Confirmar que `is_active = true`
- Recarregar a página

### Erro ao acessar o módulo
- Verificar se a rota `/modulo/dca` está configurada
- Confirmar que o componente `DCAModule` foi importado

### Capa não carrega
- Verificar se o link da imagem é válido
- Testar o link em nova aba
- Usar links blob do Imgur para melhor compatibilidade

## Notas Importantes

- **Compatibilidade**: Funciona com qualquer URL de imagem válida
- **Performance**: Imagens carregadas sob demanda
- **Responsividade**: Layout adaptável para mobile e desktop
- **Acessibilidade**: Navegação por teclado e leitores de tela
- **SEO**: URLs amigáveis e metadados estruturados 