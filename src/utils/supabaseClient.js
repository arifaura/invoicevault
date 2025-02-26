import { createClient } from "@supabase/supabase-js";

// Use environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // console.error('Missing Supabase environment variables. Please check your .env file.');
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
    // console.error('Error fetching session:', error.message);
    return null;
  }
  return session;
};

// Helper function to refresh token
export const refreshSession = async () => {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    // console.error('Error refreshing session:', error.message);
    return null;
  }
  return session;
};

// Feedback related functions
export const getFeedbackCounts = async () => {
  try {
    const { data, error } = await supabase
      .from('website_feedback')
      .select('vote_type')
      .in('vote_type', ['like', 'dislike']);

    if (error) throw error;

    // Count votes by type
    const likes = data.filter(vote => vote.vote_type === 'like').length;
    const dislikes = data.filter(vote => vote.vote_type === 'dislike').length;

    return { likes, dislikes };
  } catch (error) {
    // console.error('Error getting feedback counts:', error.message);
    return { likes: 0, dislikes: 0 };
  }
};

export const getUserVote = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('website_feedback')
      .select('vote_type')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.vote_type || null;
  } catch (error) {
    // console.error('Error getting user vote:', error.message);
    return null;
  }
};

export const submitFeedback = async (voteType, userId) => {
  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('website_feedback')
      .select('id, vote_type')
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking the same type
        const { error: deleteError } = await supabase
          .from('website_feedback')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) throw deleteError;
        return { action: 'removed', previousVote: voteType };
      } else {
        // Update to new vote type
        const { error: updateError } = await supabase
          .from('website_feedback')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (updateError) throw updateError;
        return { action: 'changed', previousVote: existingVote.vote_type };
      }
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('website_feedback')
        .insert([{ vote_type: voteType, user_id: userId }]);

      if (insertError) throw insertError;
      return { action: 'added' };
    }
  } catch (error) {
    // console.error('Error submitting feedback:', error.message);
    throw error;
  }
};

export { supabase };
