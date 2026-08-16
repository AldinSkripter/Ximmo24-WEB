import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  agentsStories: [],
  loading: false,
  pagination: {
    limit: 10,
    offset: 0,
    total: 0,
    has_more: false,
  },
  viewedOverrides: {}, // mapping of story_id -> boolean
  guestViewCount: 0,
  userHasPremiumPropertiesAccess: false,
  userHasPremiumProjectsAccess: false,
  activeAgentId: null,
  activeStoryIndex: 0,
};

export const storiesSlice = createSlice({
  name: "stories",
  initialState,
  reducers: {
    setStoriesData: (state, action) => {
      const { agents, pagination, user_has_premium_properties_access, user_has_premium_projects_access } = action.payload;
      const newAgents = agents || [];

      // The server response is the source of truth for is_seen. Drop any local
      // viewedOverrides for stories included in this response so a stale local
      // override can never keep overriding the freshly-fetched server state;
      // is_seen from this payload alone now drives "unseen" (per-story and per-agent).
      newAgents.forEach((agent) => {
        [
          ...(agent?.non_premium_stories || []),
          ...(agent?.premium_stories || []),
        ].forEach((story) => {
          delete state.viewedOverrides[story?.story_id];
        });
      });

      state.agentsStories = newAgents;
      if (pagination) {
        state.pagination = {
          limit: pagination.limit || 10,
          offset: pagination.offset || 0,
          total: pagination.total || 0,
          has_more: pagination.has_more || false,
        };
      }
      state.userHasPremiumPropertiesAccess = !!user_has_premium_properties_access;
      state.userHasPremiumProjectsAccess = !!user_has_premium_projects_access;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    markStoryViewedLocal: (state, action) => {
      const { story_id, is_guest } = action.payload;
      state.viewedOverrides[story_id] = true;
      if (is_guest) {
        state.guestViewCount += 1;
      }
    },
    setActiveAgentId: (state, action) => {
      const agentId = action.payload;
      state.activeAgentId = agentId;

      const agent = state.agentsStories.find((a) => a.agent_id === agentId);
      if (!agent) {
        state.activeStoryIndex = 0;
        return;
      }

      const byCreatedAt = (a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0);

      // Merge non-premium and premium stories first, then sort chronologically
      const allStories = [
        ...(agent.non_premium_stories || []),
        ...(agent.premium_stories || []),
      ].sort(byCreatedAt);

      const firstUnseenIndex = allStories.findIndex(
        (s) => !(s.is_seen || state.viewedOverrides[s.story_id])
      );

      // Resume from the first unseen story; if all are seen, restart from the beginning
      state.activeStoryIndex = firstUnseenIndex === -1 ? 0 : firstUnseenIndex;
    },
    setActiveStoryIndex: (state, action) => {
      state.activeStoryIndex = action.payload;
    },
    resetGuestCount: (state) => {
      state.guestViewCount = 0;
    },
    clearViewedOverrides: (state) => {
      state.viewedOverrides = {};
    }
  },
});

export const {
  setStoriesData,
  setLoading,
  markStoryViewedLocal,
  setActiveAgentId,
  setActiveStoryIndex,
  resetGuestCount,
  clearViewedOverrides,
} = storiesSlice.actions;

export default storiesSlice.reducer;
