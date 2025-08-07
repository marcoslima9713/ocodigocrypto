-- Add auth_user_id column to members table
ALTER TABLE public.members 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Add index for better performance
CREATE INDEX idx_members_auth_user_id ON public.members(auth_user_id);

-- Add comment to document the purpose
COMMENT ON COLUMN public.members.auth_user_id IS 'Reference to Supabase auth.users table for authentication'; 