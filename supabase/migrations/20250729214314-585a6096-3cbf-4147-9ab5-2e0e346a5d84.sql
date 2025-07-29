-- Delete existing video lessons for origens-bitcoin module
DELETE FROM video_lessons WHERE module_id = 'origens-bitcoin';

-- Insert all 16 video lessons with correct data
INSERT INTO video_lessons (module_id, title, description, file_path, order_index, is_public, duration) VALUES
  ('origens-bitcoin', 'A Nossa História e a Criação do Bitcoin', 'Entenda como os eventos históricos e sociais da humanidade nos conduziram até a necessidade de uma moeda como o Bitcoin. Uma aula de contexto fundamental para entender o "porquê" dessa revolução.', '001.mp4', 0, true, null),
  ('origens-bitcoin', 'Paleolítico', 'Explore as origens das trocas e da economia no período paleolítico. Descubra como as primeiras formas de valor surgiram e pavimentaram o caminho para a criação do dinheiro.', '002.mp4', 1, true, null),
  ('origens-bitcoin', 'Egito Antigo', 'Veja como a civilização egípcia influenciou a organização econômica e o conceito de centralização do poder e da moeda.', '003.mp4', 2, true, null),
  ('origens-bitcoin', 'Grécia e Roma Antiga', 'Compreenda como os gregos e romanos desenvolveram sistemas financeiros mais complexos — incluindo cunhagem de moedas, bancos primitivos e contratos.', '004.mp4', 3, true, null),
  ('origens-bitcoin', 'Idade Média', 'Entenda como as estruturas feudais e as mudanças no poder político e religioso influenciaram a economia e a circulação de riqueza na Idade Média.', '005.mp4', 4, true, null),
  ('origens-bitcoin', 'A Igreja Católica na Idade Média', 'Analise o papel da Igreja como instituição econômica dominante: sua influência sobre o uso do dinheiro, a proibição da usura e a centralização da riqueza.', '006.mp4', 5, true, null),
  ('origens-bitcoin', 'Idade Moderna', 'Explore o surgimento do capitalismo, dos bancos modernos, das moedas fiduciárias e dos primeiros sinais da economia global.', '007.mp4', 6, true, null),
  ('origens-bitcoin', 'Idade Contemporânea – Parte 1', 'Aprofunde-se nas transformações da economia moderna: revoluções industriais, surgimento de bancos centrais e evolução das políticas monetárias.', '008.mp4', 7, true, null),
  ('origens-bitcoin', 'Idade Contemporânea – Parte 2', 'Continue a análise dos séculos recentes, agora com foco em guerras, globalização, inflação e o impacto do dinheiro estatal sobre a sociedade.', '009.mp4', 8, true, null),
  ('origens-bitcoin', 'Idade Contemporânea – Parte 3', 'Conclua essa jornada com os eventos mais recentes que pavimentaram o caminho para o surgimento das criptomoedas — incluindo a crise de 2008.', '010.mp4', 9, true, null),
  ('origens-bitcoin', 'Cypherpunks', 'Conheça o movimento Cypherpunk: ativistas digitais que defendiam a privacidade e a liberdade através da criptografia — e plantaram as sementes do Bitcoin.', '011.mp4', 10, true, null),
  ('origens-bitcoin', 'A Era Pré-Satoshi', 'Entenda as tentativas anteriores ao Bitcoin de criar moedas digitais e descentralizadas — e o que deu errado antes de Satoshi Nakamoto.', '012.mp4', 11, true, null),
  ('origens-bitcoin', 'O Bitcoin é uma Moeda?', 'Analise o Bitcoin sob a perspectiva econômica: ele cumpre as funções de uma moeda? Meio de troca, reserva de valor e unidade de conta?', '013.mp4', 12, true, null),
  ('origens-bitcoin', 'Afinal, o Que é o Bitcoin?', 'Desconstrua o conceito do Bitcoin de maneira clara e objetiva. Tecnologia? Moeda? Rede? Conheça sua essência multifacetada.', '014.mp4', 13, true, null),
  ('origens-bitcoin', 'A Melhor Definição de Bitcoin', 'Apresentamos a definição mais precisa, poderosa e acessível para você entender — de verdade — o que é o Bitcoin.', '015.mp4', 14, true, null),
  ('origens-bitcoin', 'Bitcoin: Um Sistema Moral', 'Explore o lado ético e filosófico do Bitcoin. Por que ele é considerado uma alternativa moral frente ao sistema financeiro tradicional?', '016.mp4', 15, true, null);