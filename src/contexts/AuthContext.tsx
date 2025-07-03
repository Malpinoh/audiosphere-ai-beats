
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  redirectBasedOnRole: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Using setTimeout to avoid deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Setup real-time updates for the user's profile
    let profileChannel: any = null;
    if (user?.id) {
      profileChannel = supabase
        .channel(`profile-updates-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            setProfile(payload.new);
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // If no profile exists, create one
      if (!data) {
        const { data: userData } = await supabase.auth.getUser();
        const newProfile = {
          id: userId,
          role: 'user' as const,
          full_name: userData.user?.user_metadata?.full_name || null,
          username: userData.user?.user_metadata?.username || null,
          avatar_url: userData.user?.user_metadata?.avatar_url || null
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();
          
        if (createError) {
          console.error('Error creating user profile:', createError);
          return;
        }
        
        setProfile(createdProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper function to redirect based on user role
  const redirectBasedOnRole = () => {
    if (!profile) return;
    
    const role = profile.role;
    const currentPath = window.location.pathname;
    
    // Don't redirect if user is already on the correct page
    if (
      (role === 'artist' && currentPath === '/artist-dashboard') ||
      (role === 'admin' && currentPath === '/admin') ||
      (role === 'user' && currentPath === '/')
    ) {
      return;
    }
    
    // Redirect based on role
    if (role === 'artist') {
      window.location.href = '/artist-dashboard';
    } else if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/';
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    redirectBasedOnRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
