// utils/authCleanup.js - Comprehensive authentication and user data cleanup
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Comprehensive cleanup utility for authentication and user data
 * Handles logout, user switching, and emergency cleanup scenarios
 */
export const authCleanupHelper = {
  /**
   * Clear all user-related data from AsyncStorage
   * Use during logout and user switching
   */
  clearUserStorage: async () => {
    console.log("🧹 Clearing user storage data...");
    
    try {
      const keysToRemove = [
        // Authentication related
        'auth_token',
        'user_data',
        'user_session',
        'refresh_token',
        
        // SignalR related
        'signalr_token',
        'signalr_connection_id',
        'signalr_state',
        
        // Chat related
        'chat_cache',
        'chat_partners',
        'unread_messages',
        'typing_users',
        
        // User preferences that should reset
        'user_preferences',
        'notification_settings',
        
        // Temporary data
        'temp_user_data',
        'session_data'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log("✅ User storage cleared successfully");
      
    } catch (error) {
      console.error("❌ Error clearing user storage:", error);
      // Try to clear individual keys if multiRemove fails
      await this.clearUserStorageFallback();
    }
  },

  /**
   * Fallback method for clearing storage when multiRemove fails
   */
  clearUserStorageFallback: async () => {
    console.log("🔄 Using fallback storage cleanup method...");
    
    try {
      // Get all keys and filter user-related ones
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => 
        key.includes('auth_') ||
        key.includes('user_') ||
        key.includes('signalr_') ||
        key.includes('chat_') ||
        key.includes('session_') ||
        key.includes('temp_')
      );
      
      // Remove user-related keys
      for (const key of userKeys) {
        await AsyncStorage.removeItem(key);
        console.log(`🗑️ Removed key: ${key}`);
      }
      
      console.log("✅ Fallback storage cleanup completed");
      
    } catch (error) {
      console.error("❌ Fallback storage cleanup failed:", error);
    }
  },

  /**
   * Emergency cleanup - clears all AsyncStorage data
   * Use only when other methods fail
   */
  emergencyCleanup: async () => {
    console.log("🚨 EMERGENCY CLEANUP - Clearing all AsyncStorage data");
    
    try {
      await AsyncStorage.clear();
      console.log("✅ Emergency cleanup completed - all data cleared");
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
    }
  },

  /**
   * Prepare for user switch - selective cleanup that preserves app settings
   */
  prepareForUserSwitch: async (currentUserId, newUserId) => {
    console.log("🔄 Preparing for user switch:", {
      from: currentUserId,
      to: newUserId
    });
    
    try {
      // Clear user-specific data but keep app settings
      const userSpecificKeys = [
        'auth_token',
        'user_data',
        'user_session',
        'signalr_token',
        'signalr_connection_id',
        'chat_cache',
        'chat_partners',
        'unread_messages',
        'user_preferences',
        'temp_user_data'
      ];
      
      await AsyncStorage.multiRemove(userSpecificKeys);
      
      // Store metadata about the user switch
      await AsyncStorage.setItem('last_user_switch', JSON.stringify({
        previousUserId: currentUserId,
        newUserId: newUserId,
        timestamp: new Date().toISOString()
      }));
      
      console.log("✅ User switch preparation completed");
      
    } catch (error) {
      console.error("❌ Error preparing for user switch:", error);
      // Fallback to full cleanup
      await this.clearUserStorage();
    }
  },

  /**
   * Validate storage state - check for inconsistencies
   */
  validateStorageState: async () => {
    console.log("🔍 Validating storage state...");
    
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const suspiciousKeys = [];
      
      // Look for potential issues
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        
        // Check for malformed or stale data
        if (value) {
          try {
            const parsed = JSON.parse(value);
            
            // Check for very old timestamps
            if (parsed.timestamp) {
              const age = Date.now() - new Date(parsed.timestamp).getTime();
              if (age > 24 * 60 * 60 * 1000) { // Older than 24 hours
                suspiciousKeys.push({ key, reason: 'stale_data', age });
              }
            }
            
            // Check for multiple user sessions
            if (parsed.userId && key.includes('user_')) {
              // This could indicate user switching issues
            }
            
          } catch (parseError) {
            suspiciousKeys.push({ key, reason: 'malformed_json' });
          }
        }
      }
      
      if (suspiciousKeys.length > 0) {
        console.warn("⚠️ Found suspicious storage keys:", suspiciousKeys);
        return { isValid: false, issues: suspiciousKeys };
      }
      
      console.log("✅ Storage state validation passed");
      return { isValid: true, issues: [] };
      
    } catch (error) {
      console.error("❌ Storage validation error:", error);
      return { isValid: false, error: error.message };
    }
  },

  /**
   * Debug storage contents - helpful for troubleshooting
   */
  debugStorageContents: async () => {
    console.log("🐛 DEBUG: Storage contents");
    
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("📋 All storage keys:", allKeys);
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        const preview = value ? 
          (value.length > 100 ? value.substring(0, 100) + '...' : value) : 
          'null';
        console.log(`🔑 ${key}: ${preview}`);
      }
      
    } catch (error) {
      console.error("❌ Debug storage error:", error);
    }
  }
};

export default authCleanupHelper;