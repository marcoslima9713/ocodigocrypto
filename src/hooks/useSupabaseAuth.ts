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
      if (currentUser) {
        try {
          // Set the Firebase UID as a session variable for RLS policies
          const { error } = await supabase.rpc('set_config' as any, {
            setting_name: 'app.current_firebase_uid',
            setting_value: currentUser.uid,
            is_local: true
          });
          
          if (error) {
            console.error('Error setting Supabase context:', error);
          } else {
            console.log('Supabase context set for user:', currentUser.uid);
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
  }, [currentUser]);

  return currentUser;
};