import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  initialLoadComplete: false,
  loading: false,
  categories: [],
  articleCategoryId: "",
  cacheChat: null,
  selectedPackage: null,
  agentBookingPreferences: {
    meeting_duration_minutes: 0,
    lead_time_minutes: 0,
    buffer_time_minutes: 0,
    auto_confirm: 0,
    cancel_reschedule_buffer_minutes: 0,
    auto_cancel_after_minutes: 0,
    auto_cancel_message: "",
    daily_booking_limit: 0,
    availability_types: [],
    anti_spam_enabled: false,
    timezone: ""
  },
  isLocationBasedHomepageData: false,
  customPages: [],
};

const cacheSlice = createSlice({
  name: "cacheData",
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload.data;
    },
    setArticleCategoryId: (state, action) => {
      state.articleCategoryId = action.payload.data;
    },
    setCacheChat: (state, action) => {
      state.cacheChat = action.payload;
    },
    setSelectedPackage: (state, action) => {
      state.selectedPackage = action.payload;
    },
    setAgentBookingPreferences: (state, action) => {
      state.agentBookingPreferences = action.payload;
    },
    setInitialLoadComplete(state, action) {
      state.initialLoadComplete = action.payload;
    },
    setIsLocationBasedHomepageData(state, action) {
      state.isLocationBasedHomepageData = action.payload;
    },
    setCustomPages(state, action) {
      state.customPages = action.payload;
    }

  },
});

export const { setCategories, setArticleCategoryId, setCacheChat, setSelectedPackage, setAgentBookingPreferences, setInitialLoadComplete, setIsLocationBasedHomepageData, setCustomPages } =
  cacheSlice.actions;

export default cacheSlice.reducer;
