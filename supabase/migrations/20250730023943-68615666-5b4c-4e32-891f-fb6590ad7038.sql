-- Atualizar os file_paths para incluir o diretório correto
UPDATE video_lessons 
SET file_path = 'origens do bitcoin/' || file_path 
WHERE module_id = 'origens-bitcoin' 
AND file_path NOT LIKE 'origens do bitcoin/%';