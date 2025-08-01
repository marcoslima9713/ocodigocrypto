import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  firebase_uid: string;
  role: 'admin' | 'member' | 'user';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const { currentUser } = useFirebaseAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Set Firebase UID in Supabase session for RLS policies
        const { error: setConfigError } = await supabase.rpc('set_config' as any, {
          setting_name: 'app.current_firebase_uid',
          setting_value: currentUser.uid,
          is_local: true
        });

        if (setConfigError) {
          console.error('Error setting config:', setConfigError);
        }

        // Fetch user role
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('firebase_uid', currentUser.uid)
          .order('role', { ascending: true }) // admin first, then member, then user
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          console.error('Error fetching user role:', error);
        }
        setUserRole(data || null);
      } catch (error) {
        console.error('Error setting up user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  const isAdmin = userRole?.role === 'admin';
  const isMember = userRole?.role === 'member' || isAdmin;

  return {
    currentUser,
    userRole,
    isAdmin,
    isMember,
    isLoading
  };
};