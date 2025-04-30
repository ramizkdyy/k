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
};

const profileSlice = createSlice({
  name: "profiles",
  initialState,
  reducers: {
    setCurrentLandlordProfile: (state, action) => {
      state.currentLandlordProfile = action.payload;
    },
    clearCurrentLandlordProfile: (state) => {
      state.currentLandlordProfile = null;
    },
    setCurrentTenantProfile: (state, action) => {
      state.currentTenantProfile = action.payload;
    },
    clearCurrentTenantProfile: (state) => {
      state.currentTenantProfile = null;
    },
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
    },
    clearUserProfile: (state) => {
      state.userProfile = null;
    },
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
    saveProfileFormData: (state, action) => {
      state.profileFormData = action.payload;
    },
    clearProfileFormData: (state) => {
      state.profileFormData = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle fetching landlord profiles
    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfiles.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.landlordProfiles = payload.result;
        }
      }
    );

    // Handle fetching tenant profiles
    builder.addMatcher(
      apiSlice.endpoints.getTenantProfiles.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.tenantProfiles = payload.result;
        }
      }
    );

    // Handle fetching a single landlord profile
    builder.addMatcher(
      apiSlice.endpoints.getLandlordProfile.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const profile = payload.result;
          state.currentLandlordProfile = profile;

          // If this is the current user's profile, update userProfile as well
          if (
            state.userProfile &&
            state.userProfile.userId === profile.userId
          ) {
            state.userProfile = profile;
          }
        }
      }
    );

    // Handle fetching a single tenant profile
    builder.addMatcher(
      apiSlice.endpoints.getTenantProfile.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const profile = payload.result;
          state.currentTenantProfile = profile;

          // If this is the current user's profile, update userProfile as well
          if (
            state.userProfile &&
            state.userProfile.userId === profile.userId
          ) {
            state.userProfile = profile;
          }
        }
      }
    );

    // Handle creating a landlord profile
    builder.addMatcher(
      apiSlice.endpoints.createLandlordProfile.matchFulfilled,
      (state, { payload }) => {
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
        }
      }
    );

    // Handle creating a tenant profile
    builder.addMatcher(
      apiSlice.endpoints.createTenantProfile.matchFulfilled,
      (state, { payload }) => {
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
        }
      }
    );

    // Handle updating a landlord profile
    builder.addMatcher(
      apiSlice.endpoints.updateLandlordProfile.matchFulfilled,
      (state, { payload }) => {
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
        }
      }
    );

    // Handle updating a tenant profile
    builder.addMatcher(
      apiSlice.endpoints.updateTenantProfile.matchFulfilled,
      (state, { payload }) => {
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
        }
      }
    );

    // Handle deleting a profile
    builder.addMatcher(
      apiSlice.endpoints.deleteProfile.matchFulfilled,
      (state, { payload }) => {
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
        }
      }
    );

    // Handle fetching favorite properties
    builder.addMatcher(
      apiSlice.endpoints.getTenantFavoriteProperties.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.favoriteProperties = payload.result;
        }
      }
    );

    // Handle adding a favorite property
    builder.addMatcher(
      apiSlice.endpoints.addFavoriteProperty.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const newFavorite = payload.result;

          // Add to favoriteProperties if not already present
          const exists = state.favoriteProperties.some(
            (fav) => fav.id === newFavorite.id
          );

          if (!exists) {
            state.favoriteProperties.push(newFavorite);
          }
        }
      }
    );

    // Handle removing a favorite property
    builder.addMatcher(
      apiSlice.endpoints.removeFavoriteProperty.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const removedId = payload.result.id;

          // Remove from favoriteProperties array
          state.favoriteProperties = state.favoriteProperties.filter(
            (fav) => fav.id !== removedId
          );
        }
      }
    );
  },
});

export const {
  setCurrentLandlordProfile,
  clearCurrentLandlordProfile,
  setCurrentTenantProfile,
  clearCurrentTenantProfile,
  setUserProfile,
  clearUserProfile,
  updateProfileImageStatus,
  updateCoverImageStatus,
  clearImageStatuses,
  saveProfileFormData,
  clearProfileFormData,
  setError,
  clearError,
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

// Filtered profiles selectors
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
