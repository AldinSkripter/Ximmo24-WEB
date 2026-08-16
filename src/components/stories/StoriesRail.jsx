"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getStoriesApi } from "@/api/apiRoutes";
import {
  setStoriesData,
  setLoading,
  setActiveAgentId,
} from "@/redux/slices/storiesSlice";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { MdArrowForward } from "react-icons/md";
import Image from "next/image";
import StoryViewer from "./StoryViewer";
import LoginModal from "../modal/LoginModal";
import ImageWithPlaceholder from "@/components/image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { VerifiedAgentBadge } from "@/utils/helperFunction";

const StoriesRail = ({ category_id } = {}) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const isUserLoggedIn = useAuthStatus();
  const webSettings = useSelector((state) => state?.WebSetting?.data);
  const { agentsStories, loading, viewedOverrides, activeAgentId } = useSelector(
    (state) => state.stories
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchStories = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await getStoriesApi({ limit: 20, category_id: category_id || "" });
      if (response && !response.error) {
        dispatch(setStoriesData(response.data));
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, category_id]);

  // Fetch stories on component mount
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Re-fetch stories when a logged-in user logs out — the feed is user-specific
  // (per-story is_seen, premium access) so it must reset to the guest view
  // instead of continuing to show stale data from the logged-in session.
  const wasLoggedInRef = useRef(isUserLoggedIn);
  useEffect(() => {
    if (wasLoggedInRef.current && !isUserLoggedIn) {
      fetchStories();
    }
    wasLoggedInRef.current = isUserLoggedIn;
  }, [isUserLoggedIn, fetchStories]);

  // Check if agent has any unseen stories
  const hasUnseenStories = (agent) => {
    const allStories = [
      ...(agent.non_premium_stories || []),
      ...(agent.premium_stories || []),
    ];

    if (allStories.length === 0) return false;

    return allStories.some(
      (story) => !story.is_seen && !viewedOverrides[story.story_id]
    );
  };

  // Get active cover image for agent story group
  const getAgentCoverImage = (agent) => {
    const byCreatedAt = (a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0);

    // Merge non-premium and premium stories first, then sort chronologically
    const allStories = [
      ...(agent.non_premium_stories || []),
      ...(agent.premium_stories || []),
    ].sort(byCreatedAt);
    if (allStories.length === 0) return "";
    return allStories[0].thumbnail_url || allStories[0].media_url;
  };

  const handleAgentClick = (agentId) => {
    dispatch(setActiveAgentId(agentId));
  };

  const handleExploreAll = () => {
    if (agentsStories && agentsStories.length > 0) {
      dispatch(setActiveAgentId(agentsStories[0].agent_id));
    }
  };

  // Render skeletons while loading
  if (loading && (!agentsStories || agentsStories.length === 0)) {
    return (
      <div className="w-full bg-[#f4faf9] rounded-2xl p-6 mb-8 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex flex-col items-center shrink-0">
              <div className="relative w-full h-full aspect-[9/16] mb-8">
                <div className="w-full h-full bg-gray-200 rounded-[24px]"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 rounded-full bg-gray-300 border-[3px] border-white"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Do not render anything if there are no stories
  if (!agentsStories || agentsStories.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#f0f7f7] rounded-2xl p-6 md:p-8 mb-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">
          {t("exploreStories")}
        </h3>
        <button
          onClick={handleExploreAll}
          className="flex items-center gap-2 rounded-lg primaryBg px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 text-sm"
        >
          {t("exploreAll")}
          <MdArrowForward className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <Carousel
        opts={{
          dragFree: true,
          slidesToScroll: "auto",
          direction: "ltr",
        }}
        className="w-full"
      >
        <CarouselContent className="flex gap-4 !-ml-0">
          {agentsStories.map((agent) => {
            const hasUnseen = hasUnseenStories(agent);
            const coverImage = getAgentCoverImage(agent);

            return (
              <CarouselItem
                key={agent.agent_id}
                className="!pl-2 basis-40 shrink-0"
              >
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => handleAgentClick(agent.agent_id)}
                    className="relative w-full h-full aspect-[9/16] cursor-pointer group"
                  >
                    <div className="w-full h-full rounded-xl overflow-hidden relative shadow-md">
                      <ImageWithPlaceholder
                        src={coverImage}
                        alt={agent.agent_name}
                        className="w-full h-full"
                        loading="lazy"
                      />
                      {/* Shadow overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    </div>

                    {/* Rounded Full Avatar */}
                    <div
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 rounded-full bg-white p-[3px] border-[3px] shadow-sm transition-colors duration-300 z-10 ${hasUnseen
                        ? "primaryBorderColor"
                        : "border-gray-200"
                        }`}
                    >
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
                        <ImageWithPlaceholder
                          src={agent.agent_profile_image}
                          alt={agent.agent_name}
                          width={76}
                          height={76}
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agent Name */}
                  <span className="flex items-center justify-center gap-1 text-center text-sm md:text-base font-medium mt-9 brandColor max-w-[130px] w-full">
                    <span className="line-clamp-2">{agent.agent_name}</span>
                    {(agent?.is_admin || agent.is_agent_verified) && (
                      <VerifiedAgentBadge color={webSettings?.system_color} className="flex-shrink-0" width={14} height={14} />
                    )}
                  </span>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <div className="flex justify-center mt-6">
          <CarouselDots
            className="mt-2 !overflow-x-visible [&>button]:!w-2 [&>button]:!h-2 z-30"
            inactiveDotClassName="brandBg opacity-50"
          />
        </div>
      </Carousel>

      {activeAgentId !== null && (
        <StoryViewer onRequireLogin={() => setShowLoginModal(true)} />
      )}

      {showLoginModal && (
        <LoginModal showLogin={showLoginModal} setShowLogin={setShowLoginModal} />
      )}
    </div>
  );
};

export default StoriesRail;
