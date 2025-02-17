import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, getSessionData, refreshSession } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        const session = await getSessionData();
        if (session) {
          setSession(session);
          setUser(session.user);
          // Don't show welcome back toast on initial page load
          if (!isInitialLoad) {
            toast.success('Welcome back!', {
              icon: '👋',
              duration: 3000
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    initializeAuth();

    // Set up session refresh interval
    const refreshInterval = setInterval(async () => {
      const session = await refreshSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }
    }, 3600000); // Refresh token every hour

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (session) {
        setUser(session.user);
        setSession(session);
        
        // Handle successful sign-in
        if (event === 'SIGNED_IN') {
          // Dismiss any existing Google sign-in toast
          toast.dismiss('googleSignIn');
          
          // Show success message only if it's not the initial load
          if (!isInitialLoad) {
            if (session.user?.app_metadata?.provider === 'google') {
              toast.success('Successfully signed in with Google!', {
                icon: '🔑',
                duration: 3000
              });
            } else {
              toast.success('Welcome back!', {
                icon: '👋',
                duration: 3000
              });
            }
          }

          // Handle redirect after successful sign-in
          const redirectUrl = sessionStorage.getItem('redirectUrl');
          if (redirectUrl && !isInitialLoad) {
            sessionStorage.removeItem('redirectUrl');
            window.location.href = redirectUrl;
          }
        }
      } else {
        setUser(null);
        setSession(null);
        
        if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!', {
            icon: '👋',
            duration: 3000
          });
          // Clear any stored redirect URLs on sign out
          sessionStorage.removeItem('redirectUrl');
        }
      }
      
      setLoading(false);
      setIsInitialLoad(false);
    });

    return () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, [isInitialLoad]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      sessionStorage.clear();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        loading,
        signOut: handleSignOut,
        isAuthenticated: !!user && !!session
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 