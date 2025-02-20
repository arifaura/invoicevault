import { createClient } from "@supabase/supabase-js";

// Use environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,  // Use localStorage instead of sessionStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    sessionExpirySeconds: 3600 // Set session expiry to 1 hour (3600 seconds)
  }
});

// Helper function to get session data
export const getSessionData = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error.message);
    return null;
  }
  return session;
};

// Helper function to refresh token
export const refreshSession = async () => {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Error refreshing session:', error.message);
    return null;
  }
  return session;
};

export { supabase };
