# Instruções para Adicionar o Módulo Pool de Liquidez

## ✅ **Módulo Recriado no Padrão Netflix!**

O módulo "Pool de Liquidez" foi recriado seguindo **exatamente** o mesmo padrão visual dos módulos 1 e 2 (Origens do Bitcoin e Ciclo de Juros).

## 🎯 **Características do Padrão Netflix:**

- **Header Fixo**: Barra de navegação transparente com botão "Voltar ao Dashboard"
- **Hero Section**: Imagem de capa com overlay e informações do módulo
- **Lista de Aulas**: Cards interativos com ícones de play/conclusão
- **Progresso Visual**: Barra de progresso animada
- **Modal de Vídeo**: Player em modal quando clica em uma aula
- **Animações**: Transições suaves com Framer Motion
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 1. Adicionar a Imagem da Capa

### Opção A: Usar a imagem fornecida pelo usuário
1. Salve a imagem "POOL DE LIQUIDEZ" fornecida pelo usuário
2. Renomeie para: `pool-liquidez-cover.jpg`
3. Coloque na pasta: `public/`
4. A imagem deve ter as dimensões recomendadas: 1920x1080px

### Opção B: Criar uma imagem placeholder
Se não tiver a imagem original, crie uma imagem com:
- Texto: "POOL DE LIQUIDEZ"
- Fundo escuro com elementos dourados
- Dimensões: 1920x1080px
- Salve como: `public/pool-liquidez-cover.jpg`

## 2. Executar o Script SQL

Execute o script `add_pool_liquidez_module.sql` no Supabase SQL Editor para adicionar o módulo ao banco de dados.

## 3. Verificar a Funcionalidade

1. Acesse o Dashboard
2. O módulo "Pool de Liquidez" deve aparecer na lista
3. Clique no módulo para acessar: `/modulo/pool-de-liquidez`
4. A página deve carregar com o design Netflix idêntico aos outros módulos

## 4. Estrutura do Módulo (Padrão Netflix)

O módulo inclui:
- ✅ **Header Fixo**: Navegação transparente
- ✅ **Hero Section**: Imagem de capa com overlay
- ✅ **Lista de Aulas**: 8 aulas estruturadas
- ✅ **Progresso Visual**: Barra animada
- ✅ **Modal de Vídeo**: Player interativo
- ✅ **Animações**: Transições suaves
- ✅ **Responsivo**: Mobile-first design

## 5. Conteúdo do Módulo

O módulo aborda:
1. **Introdução às Pools de Liquidez** (8 min)
2. **Automated Market Makers (AMMs)** (10 min)
3. **Impermanent Loss** (12 min)
4. **Yield Farming** (15 min)
5. **Estratégias Avançadas** (18 min)
6. **Análise de Riscos** (10 min)
7. **Exercícios Práticos** (20 min)
8. **Avaliação Final** (15 min)

**Total: ~108 minutos de conteúdo**

## 6. Funcionalidades Netflix

- **Aulas Interativas**: Clique para assistir
- **Progresso em Tempo Real**: Visualização do progresso
- **Conclusão Automática**: Marca como concluída ao assistir
- **Animações Suaves**: Transições profissionais
- **Design Consistente**: Mesmo padrão dos módulos 1 e 2

## 7. Próximos Passos

Após adicionar a imagem e executar o SQL:
1. ✅ Teste o acesso ao módulo
2. ✅ Verifique se o design está igual aos outros módulos
3. ✅ Adicione vídeos específicos do módulo
4. ✅ Configure o progresso do usuário
5. ✅ Adicione recursos adicionais (calculadoras, dashboards, etc.)

## 🎉 **Resultado Final**

O módulo "Pool de Liquidez" agora tem **exatamente** o mesmo visual e comportamento dos módulos 1 e 2, seguindo o padrão Netflix da plataforma! 