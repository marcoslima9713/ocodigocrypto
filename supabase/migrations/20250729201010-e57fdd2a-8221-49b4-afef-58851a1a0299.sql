-- Create storage bucket for video lessons
INSERT INTO storage.buckets (id, name, public) VALUES ('video-lessons', 'video-lessons', false);

-- Create policies for video lessons bucket
CREATE POLICY "Users can view video lessons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-lessons');

CREATE POLICY "Admins can upload video lessons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-lessons' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update video lessons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-lessons' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete video lessons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-lessons' AND auth.jwt() ->> 'role' = 'admin');

-- Create table for video lesson metadata
CREATE TABLE public.video_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- in seconds
  thumbnail_path TEXT,
  module_id TEXT, -- reference to module
  order_index INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on video_lessons table
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for video_lessons table
CREATE POLICY "Anyone can view public video lessons" 
ON public.video_lessons 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Admins can manage all video lessons" 
ON public.video_lessons 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_lessons_updated_at
BEFORE UPDATE ON public.video_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();