// src/redux/slices/postSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [], // Posts created by the current user
  isLoading: false,
  error: null,
  postImageUploadStatus: [], // Track status of image uploads
  currentFilters: {
    location: null,
    priceMin: null,
    priceMax: null,
    status: null,
  },
  postFormData: null, // Store form data when navigating between screens
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    updatePostImageStatus: (state, action) => {
      const { postId, imageId, status } = action.payload;

      const statusIndex = state.postImageUploadStatus.findIndex(
        (item) => item.postId === postId && item.imageId === imageId
      );

      if (statusIndex >= 0) {
        state.postImageUploadStatus[statusIndex].status = status;
      } else {
        state.postImageUploadStatus.push({ postId, imageId, status });
      }
    },
    clearPostImageStatus: (state, action) => {
      const postId = action.payload;
      state.postImageUploadStatus = state.postImageUploadStatus.filter(
        (item) => item.postId !== postId
      );
    },
    setPostFilters: (state, action) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    clearPostFilters: (state) => {
      state.currentFilters = {
        location: null,
        priceMin: null,
        priceMax: null,
        status: null,
      };
    },
    savePostFormData: (state, action) => {
      state.postFormData = action.payload;
    },
    clearPostFormData: (state) => {
      state.postFormData = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle successful post creation
    builder.addMatcher(
      apiSlice.endpoints.createPost.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          // Add the new post to the user's posts if it doesn't exist yet
          const exists = state.userPosts.some(
            (post) => post.postId === payload.result.postId
          );
          if (!exists) {
            state.userPosts.push(payload.result);
          }
        }
      }
    );

    // Handle post update
    builder.addMatcher(
      apiSlice.endpoints.updatePost.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          // Update the post in userPosts array
          const updatedPostIndex = state.userPosts.findIndex(
            (post) => post.postId === payload.result.postId
          );

          if (updatedPostIndex >= 0) {
            state.userPosts[updatedPostIndex] = payload.result;
          }

          // Also update currentPost if it matches
          if (
            state.currentPost &&
            state.currentPost.postId === payload.result.postId
          ) {
            state.currentPost = payload.result;
          }
        }
      }
    );

    // Handle post deletion
    builder.addMatcher(
      apiSlice.endpoints.deletePost.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          const deletedPostId = payload.result.postId;

          // Remove post from userPosts array
          state.userPosts = state.userPosts.filter(
            (post) => post.postId !== deletedPostId
          );

          // Clear currentPost if it matches
          if (state.currentPost && state.currentPost.postId === deletedPostId) {
            state.currentPost = null;
          }
        }
      }
    );

    // Handle getting landlord property listings
    builder.addMatcher(
      apiSlice.endpoints.getLandlordPropertyListings.matchFulfilled,
      (state, { payload }) => {
        if (payload && payload.isSuccess && payload.result) {
          state.userPosts = payload.result;
        }
      }
    );
  },
});

export const {
  setCurrentPost,
  clearCurrentPost,
  updatePostImageStatus,
  clearPostImageStatus,
  setPostFilters,
  clearPostFilters,
  savePostFormData,
  clearPostFormData,
  setError,
  clearError,
} = postSlice.actions;

export default postSlice.reducer;

// Selectors
export const selectAllUserPosts = (state) => state.posts.userPosts;
export const selectCurrentPost = (state) => state.posts.currentPost;
export const selectPostFilters = (state) => state.posts.currentFilters;
export const selectPostFormData = (state) => state.posts.postFormData;
export const selectPostImageUploadStatus = (state) =>
  state.posts.postImageUploadStatus;
export const selectPostError = (state) => state.posts.error;

// Filtered posts selector
export const selectFilteredPosts = (state) => {
  const { location, priceMin, priceMax, status } = state.posts.currentFilters;
  let filteredPosts = [...state.posts.userPosts];

  if (location) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.postDescription &&
        post.postDescription.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (priceMin !== null) {
    filteredPosts = filteredPosts.filter((post) => {
      const offerAmount = post.acceptedOffer?.offerAmount;
      return offerAmount ? offerAmount >= priceMin : true;
    });
  }

  if (priceMax !== null) {
    filteredPosts = filteredPosts.filter((post) => {
      const offerAmount = post.acceptedOffer?.offerAmount;
      return offerAmount ? offerAmount <= priceMax : true;
    });
  }

  if (status !== null) {
    filteredPosts = filteredPosts.filter((post) => post.status === status);
  }

  return filteredPosts;
};
