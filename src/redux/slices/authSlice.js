import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  loading: false,
  jwtToken: "",
  role: "user"
};

const authSlice = createSlice({
  name: "Auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload.data;
    },
    setJWTToken: (state, action) => {
      state.jwtToken = action.payload.data;
    },
    updateUserProfile: (state, action) => {
      // Update only the user profile data, keeping other data intact
      if (state.data) {
        state.data = {
          ...state.data,
          ...action.payload.data
        };
      }
    },
    logout: (state) => {
      state.data = null;
      state.loading = false;
      state.jwtToken = "";
    },
    setRole: (state, action) => {
      state.role = action.payload.data;
    }
  },
});

export const { setAuth, setLoading, setJWTToken, updateUserProfile, logout, setRole } = authSlice.actions;

export default authSlice.reducer;
