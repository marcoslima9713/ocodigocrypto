-- Inserir os vídeos das aulas do módulo "Origens do Bitcoin"
INSERT INTO public.video_lessons (
  title,
  description,
  file_path,
  module_id,
  order_index,
  duration,
  is_public
) VALUES 
(
  'A Criação Misteriosa do Bitcoin',
  'A verdadeira história por trás de Satoshi Nakamoto e os primeiros dias do Bitcoin. Quem realmente estava envolvido?',
  'origens do bitcoin/aula1.mp4',
  'origens-bitcoin',
  0,
  720, -- 12 minutos em segundos
  true
),
(
  'Os Primeiros Adotantes',
  'Como desenvolvedores e cypherpunks moldaram o Bitcoin nos primeiros anos. As decisões que definiram o futuro.',
  'origens do bitcoin/aula2.mp4',
  'origens-bitcoin',
  1,
  540, -- 9 minutos em segundos
  true
),
(
  'O Primeiro Ciclo de Alta',
  'De centavos a dólares: como o primeiro bull run revelou o potencial disruptivo do Bitcoin.',
  'origens do bitcoin/aula3.mp4',
  'origens-bitcoin',
  2,
  660, -- 11 minutos em segundos
  true
),
(
  'Instituições Entram em Cena',
  'Como empresas e governos começaram a prestar atenção. O momento em que tudo mudou.',
  'origens do bitcoin/aula4.mp4',
  'origens-bitcoin',
  3,
  480, -- 8 minutos em segundos
  true
),
(
  'Lições para o Futuro',
  'O que os primeiros ciclos nos ensinam sobre os próximos movimentos do Bitcoin.',
  'origens do bitcoin/aula5.mp4',
  'origens-bitcoin',
  4,
  300, -- 5 minutos em segundos
  true
);