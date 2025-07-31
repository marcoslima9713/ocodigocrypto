import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to synchronize Firebase authentication with Supabase RLS policies
 * This ensures that Supabase Row Level Security policies work correctly with Firebase user IDs
 */
export const useSupabaseAuth = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    const setSupabaseContext = async () => {
      if (currentUser?.uid) {
        try {
          // Set the Firebase UID as a session variable for RLS policies
          // Use multiple attempts to ensure it's set correctly
          for (let attempt = 0; attempt < 3; attempt++) {
            const { error } = await supabase.rpc('set_config' as any, {
              setting_name: 'app.current_firebase_uid',
              setting_value: currentUser.uid,
              is_local: true
            });
            
            if (!error) {
              console.log(`Supabase context set for user: ${currentUser.uid} (attempt ${attempt + 1})`);
              break;
            } else if (attempt === 2) {
              console.error('Failed to set Supabase context after 3 attempts:', error);
            }
            
            // Small delay between attempts
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Error setting Supabase context:', error);
        }
      } else {
        try {
          // Clear the session variable when user logs out
          const { error } = await supabase.rpc('set_config' as any, {
            setting_name: 'app.current_firebase_uid',
            setting_value: '',
            is_local: true
          });
          
          if (error) {
            console.error('Error clearing Supabase context:', error);
          }
        } catch (error) {
          console.error('Error clearing Supabase context:', error);
        }
      }
    };

    setSupabaseContext();
  }, [currentUser?.uid]); // Depend only on the UID to avoid unnecessary calls

   return currentUser;
};