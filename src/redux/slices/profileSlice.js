// src/redux/slices/profileSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  landlordProfiles: [],
  tenantProfiles: [],
  currentLandlordProfile: null,
  currentTenantProfile: null,
  userProfile: null, // Current user's profile (either landlord or tenant)
  favoriteProperties: [],
  isLoading: false,
  error: null,
  profileFormData: null, // Store form data when navigating between screens
  profileImageUploadStatus: null,
  coverImageUploadStatus: null,
  profileActionLoading: false,
  profileActionError: null,
};

const profileSlice = createSlice({
  name: "profiles",
  initialState,
  reducers: {
    // Set profile data
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
      // Clear any existing error when setting new profile
      if (action.payload) {
        state.error = null;
      }
    },

    // Set current profiles
    setCurrentLandlordProfile: (state, action) => {
      state.currentLandlordProfile = action.payload;
    },
    setCurrentTenantProfile: (state, action) => {
      state.currentTenantProfile = action.payload;
    },

    // Clear profiles
    clearCurrentLandlordProfile: (state) => {
      state.currentLandlordProfile = null;
    },
    clearCurrentTenantProfile: (state) => {
      state.currentTenantProfile = null;
    },
    clearUserProfile: (state) => {
      state.userProfile = null;
      state.profileFormData = null;
      state.profileImageUploadStatus = null;
      state.coverImageUploadStatus = null;
      state.error = null;
    },

    // Set loading state
    setProfileLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Update image upload status
    updateProfileImageStatus: (state, action) => {
      state.profileImageUploadStatus = action.payload;
    },
    updateCoverImageStatus: (state, action) => {
      state.coverImageUploadStatus = action.payload;
    },
    clearImageStatuses: (state) => {
      state.profileImageUploadStatus = null;
      state.coverImageUploadStatus = null;
    },

    // Form data management
    saveProfileFormData: (state, action) => {
      state.profileFormData = action.payload;
    },
    clearProfileFormData: (state) => {
      state.profileFormData = null;
    },

    // Error management
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Update user profile fields
    updateUserProfileField: (state, action) => {
      if (state.userProfile) {
        const { field, value } = action.payload;
        state.userProfile[field] = value;
      }
    },

    // Reset state
    resetProfileState: (state) => {
      return { ...initialState };
    },

    // Favorite properties management
    setFavoriteProperties: (state, action) => {
      state.favoriteProperties = action.payload;
    },
    addFavoriteProperty: (state, action) => {
      const exists = state.favoriteProperties.some(
        (property) => property.id === action.payload.id
      );
      if (!exists) {
        state.favoriteProperties.push(action.payload);
      }
    },
    removeFavoriteProperty: (state, action) => {
      state.favoriteProperties = state.favoriteProperties.filter(
        (property) => property.id !== action.payload
      );
    },
    clearProfileActionError: (state) => {
      state.profileActionError = null;
    },

  },
  extraReducers: (builder) => {
    // Handle fetching landlord profiles
    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfiles.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.landlordProfiles = payload.result;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfiles.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfiles.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Ev sahibi profilleri getirilemedi";
      }
    );

    // Handle fetching tenant profiles
    builder.addMatcher(
      apiSlice.endpoints.getTenantProfiles.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.tenantProfiles = payload.result;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantProfiles.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantProfiles.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Kiracı profilleri getirilemedi";
      }
    );

    // Handle fetching a single landlord profile
    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const profile = payload.result;
          state.currentLandlordProfile = profile;

          // If this is the current user's profile, update userProfile as well
          if (
            state.userProfile &&
            state.userProfile.userId === profile.userId
          ) {
            state.userProfile = { ...state.userProfile, ...profile };
          }
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfile.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        // Don't set error for 404s
        if (payload?.status !== 404) {
          state.error =
            payload?.data?.message ||
            payload?.message ||
            error?.message ||
            "Ev sahibi profili getirilemedi";
        }
      }
    );

    // Handle fetching a single tenant profile
    builder.addMatcher(
      apiSlice.endpoints.getTenantProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const profile = payload.result;
          state.currentTenantProfile = profile;

          // If this is the current user's profile, update userProfile as well
          if (
            state.userProfile &&
            state.userProfile.userId === profile.userId
          ) {
            state.userProfile = { ...state.userProfile, ...profile };
          }
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantProfile.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        // Don't set error for 404s
        if (payload?.status !== 404) {
          state.error =
            payload?.data?.message ||
            payload?.message ||
            error?.message ||
            "Kiracı profili getirilemedi";
        }
      }
    );

    // Handle creating a landlord profile
    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const newProfile = payload.result;

          // Add to landlordProfiles if not already present
          const exists = state.landlordProfiles.some(
            (profile) => profile.userId === newProfile.userId
          );

          if (!exists) {
            state.landlordProfiles.push(newProfile);
          }

          // Set as current user profile
          state.userProfile = newProfile;
          state.error = null;
          // Clear form data after successful creation
          state.profileFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Ev sahibi profili oluşturulamadı";
      }
    );

    // Handle creating a tenant profile
    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const newProfile = payload.result;

          // Add to tenantProfiles if not already present
          const exists = state.tenantProfiles.some(
            (profile) => profile.userId === newProfile.userId
          );

          if (!exists) {
            state.tenantProfiles.push(newProfile);
          }

          // Set as current user profile
          state.userProfile = newProfile;
          state.error = null;
          // Clear form data after successful creation
          state.profileFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Kiracı profili oluşturulamadı";
      }
    );

    // Handle updating a landlord profile
    builder.addMatcher(
      apiSlice.endpoints.updateLandlordProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const updatedProfile = payload.result;

          // Update in landlordProfiles array
          const profileIndex = state.landlordProfiles.findIndex(
            (profile) => profile.userId === updatedProfile.userId
          );

          if (profileIndex >= 0) {
            state.landlordProfiles[profileIndex] = updatedProfile;
          }

          // Update currentLandlordProfile if it matches
          if (
            state.currentLandlordProfile &&
            state.currentLandlordProfile.userId === updatedProfile.userId
          ) {
            state.currentLandlordProfile = updatedProfile;
          }

          // Update userProfile if it matches
          if (
            state.userProfile &&
            state.userProfile.userId === updatedProfile.userId
          ) {
            state.userProfile = updatedProfile;
          }

          state.error = null;
          // Clear form data after successful update
          state.profileFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateLandlordProfile.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateLandlordProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Ev sahibi profili güncellenemedi";
      }
    );

    // Handle updating a tenant profile
    builder.addMatcher(
      apiSlice.endpoints.updateTenantProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const updatedProfile = payload.result;

          // Update in tenantProfiles array
          const profileIndex = state.tenantProfiles.findIndex(
            (profile) => profile.userId === updatedProfile.userId
          );

          if (profileIndex >= 0) {
            state.tenantProfiles[profileIndex] = updatedProfile;
          }

          // Update currentTenantProfile if it matches
          if (
            state.currentTenantProfile &&
            state.currentTenantProfile.userId === updatedProfile.userId
          ) {
            state.currentTenantProfile = updatedProfile;
          }

          // Update userProfile if it matches
          if (
            state.userProfile &&
            state.userProfile.userId === updatedProfile.userId
          ) {
            state.userProfile = updatedProfile;
          }

          state.error = null;
          // Clear form data after successful update
          state.profileFormData = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateTenantProfile.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.updateTenantProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Kiracı profili güncellenemedi";
      }
    );

    // Handle deleting a profile
    builder.addMatcher(
      apiSlice.endpoints.deleteProfile.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          const deletedUserId = payload.result.userId;

          // Remove from landlordProfiles and tenantProfiles arrays
          state.landlordProfiles = state.landlordProfiles.filter(
            (profile) => profile.userId !== deletedUserId
          );

          state.tenantProfiles = state.tenantProfiles.filter(
            (profile) => profile.userId !== deletedUserId
          );

          // Clear currentLandlordProfile if it matches
          if (
            state.currentLandlordProfile &&
            state.currentLandlordProfile.userId === deletedUserId
          ) {
            state.currentLandlordProfile = null;
          }

          // Clear currentTenantProfile if it matches
          if (
            state.currentTenantProfile &&
            state.currentTenantProfile.userId === deletedUserId
          ) {
            state.currentTenantProfile = null;
          }

          // Clear userProfile if it matches
          if (state.userProfile && state.userProfile.userId === deletedUserId) {
            state.userProfile = null;
          }

          state.error = null;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.deleteProfile.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.deleteProfile.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Profil silinemedi";
      }
    );

    // Handle fetching favorite properties
    builder.addMatcher(
      apiSlice.endpoints.getTenantFavoriteProperties.matchFulfilled,
      (state, { payload }) => {
        state.isLoading = false;
        if (payload && payload.isSuccess && payload.result) {
          state.favoriteProperties = payload.result;
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantFavoriteProperties.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.getTenantFavoriteProperties.matchRejected,
      (state, { payload, error }) => {
        state.isLoading = false;
        state.error =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Favori özellikler getirilemedi";
      }
    );

    // Handle toggle favorite property (replaces add/remove favorite)
    builder.addMatcher(
      apiSlice.endpoints.toggleFavoriteProperty.matchFulfilled,
      (state, { payload, meta }) => {
        if (payload && payload.isSuccess && payload.result) {
          const result = payload.result;
          const originalArgs = meta.arg.originalArgs || meta.arg;

          if (originalArgs.actionType === 0) {
            // Adding to favorites
            const exists = state.favoriteProperties.some(
              (fav) => fav.id === result.id
            );
            if (!exists) {
              state.favoriteProperties.push(result);
            }
          } else if (originalArgs.actionType === 1) {
            // Removing from favorites
            state.favoriteProperties = state.favoriteProperties.filter(
              (fav) => fav.postId !== originalArgs.postId
            );
          }
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.toggleFavoriteProperty.matchPending,
      (state) => {
        // Optional: You can add loading state here if needed
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.toggleFavoriteProperty.matchRejected,
      (state, { payload, error }) => {
        // Error handling is done in the component, but you can add state updates here if needed
        console.error("Toggle favorite failed:", error);
      }
    );
    // Profile Action API handlers - basit versiyon
    builder.addMatcher(
      apiSlice.endpoints.profileAction.matchFulfilled,
      (state, { payload, meta }) => {
        state.profileActionLoading = false;
        state.profileActionError = null;

        if (payload && payload.isSuccess) {
          const actionData = meta.arg;

          console.log("Profile action başarılı:", {
            action: actionData.profileAction,
            senderUserId: actionData.SenderUserId,
            receiverUserId: actionData.ReceiverUserId,
            ratingValue: actionData.RatingValue,
            message: actionData.Message,
            result: payload.result
          });

          // Rating işlemi ise profil rating'ini güncelle (opsiyonel)
          if (actionData.profileAction === 2 && payload.result?.newRating) {
            // Current landlord profile güncelle
            if (state.currentLandlordProfile &&
              state.currentLandlordProfile.userId === actionData.ReceiverUserId) {
              state.currentLandlordProfile.profileRating = payload.result.newRating;
              if (payload.result.ratingCount) {
                state.currentLandlordProfile.ratingCount = payload.result.ratingCount;
              }
            }

            // Current tenant profile güncelle  
            if (state.currentTenantProfile &&
              state.currentTenantProfile.userId === actionData.ReceiverUserId) {
              state.currentTenantProfile.profileRating = payload.result.newRating;
              if (payload.result.ratingCount) {
                state.currentTenantProfile.ratingCount = payload.result.ratingCount;
              }
            }
          }
        }
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.profileAction.matchPending,
      (state) => {
        state.profileActionLoading = true;
        state.profileActionError = null;
      }
    );

    builder.addMatcher(
      apiSlice.endpoints.profileAction.matchRejected,
      (state, { payload, error }) => {
        state.profileActionLoading = false;
        state.profileActionError =
          payload?.data?.message ||
          payload?.message ||
          error?.message ||
          "Profil işlemi başarısız oldu";

        console.error("Profile action hatası:", state.profileActionError);
      }
    );

  },
});

export const {
  setUserProfile,
  setCurrentLandlordProfile,
  setCurrentTenantProfile,
  clearCurrentLandlordProfile,
  clearCurrentTenantProfile,
  clearUserProfile,
  setProfileLoading,
  updateProfileImageStatus,
  updateCoverImageStatus,
  clearImageStatuses,
  saveProfileFormData,
  clearProfileFormData,
  setError,
  clearError,
  updateUserProfileField,
  resetProfileState,
  setFavoriteProperties,
  addFavoriteProperty,
  removeFavoriteProperty,
  clearProfileActionError,
} = profileSlice.actions;

export default profileSlice.reducer;

// Selectors
export const selectAllLandlordProfiles = (state) =>
  state.profiles.landlordProfiles;
export const selectAllTenantProfiles = (state) => state.profiles.tenantProfiles;
export const selectCurrentLandlordProfile = (state) =>
  state.profiles.currentLandlordProfile;
export const selectCurrentTenantProfile = (state) =>
  state.profiles.currentTenantProfile;
export const selectUserProfile = (state) => state.profiles.userProfile;
export const selectFavoriteProperties = (state) =>
  state.profiles.favoriteProperties;
export const selectProfileFormData = (state) => state.profiles.profileFormData;
export const selectProfileImageStatus = (state) =>
  state.profiles.profileImageUploadStatus;
export const selectCoverImageStatus = (state) =>
  state.profiles.coverImageUploadStatus;
export const selectProfileError = (state) => state.profiles.error;
export const selectProfileLoading = (state) => state.profiles.isLoading;
export const selectProfileActionLoading = (state) => state.profiles.profileActionLoading;
export const selectProfileActionError = (state) => state.profiles.profileActionError;

// Enhanced selectors
export const selectProfileByUserId = (state, userId) => {
  // First check in landlord profiles
  const landlordProfile = state.profiles.landlordProfiles.find(
    (profile) => profile.userId === userId
  );

  if (landlordProfile) return landlordProfile;

  // Then check in tenant profiles
  return state.profiles.tenantProfiles.find(
    (profile) => profile.userId === userId
  );
};

export const selectCurrentUserProfile = (state, userRole) => {
  return userRole === "EVSAHIBI"
    ? state.profiles.currentLandlordProfile
    : state.profiles.currentTenantProfile;
};

export const selectHasUserProfile = (state) => {
  return (
    state.profiles.userProfile !== null &&
    state.profiles.userProfile !== undefined
  );
};

export const selectProfileImageUrl = (state) => {
  return state.profiles.userProfile?.profileImageUrl || null;
};

export const selectCoverImageUrl = (state) => {
  return state.profiles.userProfile?.coverProfileImageUrl || null;
};

export const selectIsFavoriteProperty = (state, propertyId) => {
  return state.profiles.favoriteProperties.some(
    (property) => property.id === propertyId
  );
};

export const selectProfilesByRole = (state, role) => {
  return role === "EVSAHIBI"
    ? state.profiles.landlordProfiles
    : state.profiles.tenantProfiles;
};
