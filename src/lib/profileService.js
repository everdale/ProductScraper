/**
 * Profile Service
 * 
 * This file provides functions to interact with the profiles table in Supabase.
 * It handles CRUD operations for user profiles.
 */

import { supabase, handleSupabaseError } from './supabase';

// Define the profiles table name
const PROFILES_TABLE = 'profiles';

/**
 * Profile Service for interacting with the profiles table
 */
const profileService = {
  /**
   * Get the current user's profile
   * @returns {Promise<{data: Object, error: string|null}>} Profile data or error
   */
  getCurrentProfile: async () => {
    try {
      // First, get the current user's ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) return handleSupabaseError(sessionError);
      if (!sessionData?.session?.user?.id) {
        return { error: 'No authenticated user found' };
      }
      
      const userId = sessionData.session.user.id;
      
      // Then get the profile
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Update the current user's profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<{data: Object, error: string|null}>} Updated profile or error
   */
  updateProfile: async (updates) => {
    try {
      // First, get the current user's ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) return handleSupabaseError(sessionError);
      if (!sessionData?.session?.user?.id) {
        return { error: 'No authenticated user found' };
      }
      
      const userId = sessionData.session.user.id;
      
      // Then update the profile
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Update or create the profile for a given user ID
   * Useful for admin operations or when the user ID is known
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<{data: Object, error: string|null}>} Profile data or error
   */
  upsertProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .upsert({ id: userId, ...profileData })
        .select()
        .single();
      
      if (error) return handleSupabaseError(error);
      return { data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  },

  /**
   * Set specific profile data within the JSON profile_data field
   * @param {Object} dataUpdates - Profile data updates
   * @returns {Promise<{data: Object, error: string|null}>} Updated profile or error
   */
  updateProfileData: async (dataUpdates) => {
    try {
      // First, get the current profile to access existing profile_data
      const { data: currentProfile, error: profileError } = await profileService.getCurrentProfile();
      
      if (profileError) return { error: profileError };
      
      // Merge the existing profile_data with updates
      const updatedProfileData = {
        ...currentProfile.profile_data,
        ...dataUpdates
      };
      
      // Update the profile with the merged data
      return await profileService.updateProfile({
        profile_data: updatedProfileData
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
};

export default profileService; 