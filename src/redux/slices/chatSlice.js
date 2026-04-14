import { createSlice } from "@reduxjs/toolkit";

// Local Redux state for unread counts — updated directly from SignalR events.
// No HTTP polling needed; the backend pushes counts via UnreadCountUpdate / UnreadSummaryUpdate.
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    totalUnreadMessages: 0,
    totalUnreadChats: 0,
    lastUpdated: null,
  },
  reducers: {
    // Called when backend sends an UnreadCountUpdate or UnreadSummaryUpdate event
    setUnreadSummary: (state, action) => {
      const { totalUnreadMessages, totalUnreadChats } = action.payload;
      if (typeof totalUnreadMessages === "number") {
        state.totalUnreadMessages = totalUnreadMessages;
      }
      if (typeof totalUnreadChats === "number") {
        state.totalUnreadChats = totalUnreadChats;
      }
      state.lastUpdated = Date.now();
    },
    // Called when we receive a message and the backend hasn't sent an updated count yet
    incrementUnreadMessages: (state) => {
      state.totalUnreadMessages += 1;
      state.lastUpdated = Date.now();
    },
    // Called on logout / user switch
    resetChatState: (state) => {
      state.totalUnreadMessages = 0;
      state.totalUnreadChats = 0;
      state.lastUpdated = null;
    },
  },
});

export const { setUnreadSummary, incrementUnreadMessages, resetChatState } =
  chatSlice.actions;

export const selectTotalUnreadMessages = (state) => state.chat.totalUnreadMessages;
export const selectTotalUnreadChats = (state) => state.chat.totalUnreadChats;

export default chatSlice.reducer;
