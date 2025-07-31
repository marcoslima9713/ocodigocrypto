-- Script to create the first admin user
-- Run this in Supabase SQL Editor after your first user registers

-- Replace 'YOUR_FIREBASE_UID_HERE' with the actual Firebase UID of the user who should be admin
-- You can get this from the Firebase Auth console or from the user object in your app

INSERT INTO public.user_roles (firebase_uid, role) 
VALUES ('YOUR_FIREBASE_UID_HERE', 'admin')
ON CONFLICT (firebase_uid, role) DO NOTHING;

-- Example for creating multiple roles for the same user:
-- INSERT INTO public.user_roles (firebase_uid, role) 
-- VALUES 
--   ('YOUR_FIREBASE_UID_HERE', 'admin'),
--   ('YOUR_FIREBASE_UID_HERE', 'member')
-- ON CONFLICT (firebase_uid, role) DO NOTHING;

-- To find the Firebase UID of registered users, you can use:
-- SELECT email, uid FROM auth.users WHERE email = 'your-email@example.com';
-- (This query might not work in all Supabase setups due to auth schema restrictions)

-- Alternative: Check the browser console when logged in - the Firebase UID is logged there