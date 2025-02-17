import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile data whenever user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          // Store the profile data in localStorage
          localStorage.setItem('userProfile', JSON.stringify(data));
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    // Try to get profile from localStorage first
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile && user) {
      setProfile(JSON.parse(storedProfile));
    }

    fetchProfile();
  }, [user]);

  // Clear profile data on logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('userProfile');
      setProfile({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatar: null
      });
    }
  }, [user]);

  const updateProfile = async (newData) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(newData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Update localStorage and state
        localStorage.setItem('userProfile', JSON.stringify(data));
        setProfile(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const value = React.useMemo(() => ({
    profile,
    setProfile,
    loading,
    updateProfile
  }), [profile, loading]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === null) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext; 