-- Fix RLS policies for crypto_images table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read crypto images" ON public.crypto_images;
DROP POLICY IF EXISTS "Allow admin users to manage crypto images" ON public.crypto_images;

-- Create new policies that allow all authenticated users to read and write
CREATE POLICY "Allow all authenticated users to read crypto images" ON public.crypto_images
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert crypto images" ON public.crypto_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update crypto images" ON public.crypto_images
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete crypto images" ON public.crypto_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE public.crypto_images DISABLE ROW LEVEL SECURITY; 