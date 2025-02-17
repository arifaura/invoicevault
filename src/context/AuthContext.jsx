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
          
          // Check if welcome message has been shown in this session
          const hasShownWelcome = localStorage.getItem('hasShownWelcome');
          if (!hasShownWelcome && !isInitialLoad) {
            toast.success('Welcome back!', {
              icon: '👋',
              duration: 3000
            });
            localStorage.setItem('hasShownWelcome', 'true');
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
          
          const hasShownSignIn = localStorage.getItem('hasShownSignIn');
          // Show success message only for new sign-ins and if not shown already
          if (!isInitialLoad && !hasShownSignIn) {
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
            localStorage.setItem('hasShownWelcome', 'true');
            localStorage.setItem('hasShownSignIn', 'true');
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
        // Reset all message flags on sign out
        localStorage.removeItem('hasShownWelcome');
        localStorage.removeItem('hasShownSignIn');
        
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
      // Reset all message flags
      localStorage.removeItem('hasShownWelcome');
      localStorage.removeItem('hasShownSignIn');
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