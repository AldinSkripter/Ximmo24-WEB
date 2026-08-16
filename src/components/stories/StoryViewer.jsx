"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import { FaArrowRight, FaHeart } from "react-icons/fa";
import { IoClose, IoVolumeHigh, IoVolumeMute, IoChevronBack, IoChevronForward, IoPlay, IoPause } from "react-icons/io5";
import { FiShare2, FiHeart } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { storyViewApi, addFavouritePropertyApi } from "@/api/apiRoutes";
import {
  setActiveAgentId,
  setActiveStoryIndex,
  markStoryViewedLocal,
} from "@/redux/slices/storiesSlice";
import ImageWithPlaceholder from "@/components/image-with-placeholder/ImageWithPlaceholder";
import { VerifiedAgentBadge, formatPriceAbbreviated, isRTL, getShortTimeAgo } from "@/utils/helperFunction";
import { premiumIcon } from "@/assets/svg";
import { useTranslation } from "../context/TranslationContext";
import ShareDialog from "@/components/reusable-components/ShareDialog";
import StoryProgressBar from "./StoryProgressBar";

// Shared "no premium access" CTA — used both for a single locked story
// (isPremiumLocked) and the end-of-agent locked-stories summary (isEndCard).
// These are mutually exclusive at runtime (isPremiumLocked reads currentStory,
// which is null whenever isEndCard is true) but render the same UI shape and
// copy, so both the markup and the default title/labels live in one place
// instead of being duplicated (and re-translated identically) per case.
const PremiumAccessOverlay = ({
  onBackgroundClick,
  backdropBlur = false,
  iconSize,
  iconBg = "premiumBgColor",
  title,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
  secondaryButtonClassName = "border-white/40 rounded-full",
  children,
}) => {
  const t = useTranslation();

  return (
    <div
      className={`absolute inset-0 bg-black/60 ${backdropBlur ? "backdrop-blur-md" : ""} z-40 flex flex-col items-center justify-between p-6 text-center text-white ${onBackgroundClick ? "cursor-pointer" : ""}`}
      onClick={onBackgroundClick}
    >
      <div />

      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mb-4 shadow-lg`}>
          {premiumIcon(iconSize)}
        </div>
        <h4 className="text-xl font-bold mb-2">{title ?? t("premiumStory")}</h4>
        {children}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrimaryClick();
          }}
          onTouchEnd={(e) => e.stopPropagation()}
          className="bg-white hover:bg-gray-100 text-black font-semibold px-8 py-2.5 rounded-full shadow-md transition-colors text-sm cursor-pointer"
        >
          {primaryLabel ?? t("viewPlans")}
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSecondaryClick();
        }}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`w-full border text-white font-medium py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors ${secondaryButtonClassName}`}
      >
        {secondaryLabel ?? t("skipToNext")}
      </button>
    </div>
  );
};

const StoryViewer = ({ onRequireLogin = () => { } }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const isUserLoggedIn = useAuthStatus();
  const lang = router?.query?.lang || "en";
  const t = useTranslation();
  const isRtl = isRTL();

  const {
    agentsStories,
    viewedOverrides,
    guestViewCount,
    userHasPremiumPropertiesAccess,
    userHasPremiumProjectsAccess,
    activeAgentId,
    activeStoryIndex,
  } = useSelector((state) => state.stories);

  // Active agent and stories
  const agentIndex = agentsStories?.findIndex((a) => a?.agent_id === activeAgentId) ?? -1;
  const activeAgent = agentsStories?.[agentIndex];

  const byCreatedAt = (a, b) => new Date(a?.created_at || 0) - new Date(b?.created_at || 0);

  // Merge non-premium and premium stories first, then sort chronologically
  const stories = activeAgent
    ? [
      ...(activeAgent?.non_premium_stories || []),
      ...(activeAgent?.premium_stories || []),
    ].sort(byCreatedAt)
    : [];

  // When the user lacks premium access, the API returns an empty premium_stories
  // array plus a premium_story_count instead of per-story locked entries. Represent
  // that as a single virtual "end card" slide appended after the real stories.
  const lockedPremiumCount = activeAgent?.premium_story_count || 0;
  const hasLockedPremiumEndCard =
    lockedPremiumCount > 0 && (activeAgent?.premium_stories?.length || 0) === 0;
  const isEndCard = hasLockedPremiumEndCard && activeStoryIndex === stories.length;
  const virtualSlideCount = stories.length + (hasLockedPremiumEndCard ? 1 : 0);
  // Progress bar renders one segment per slide, including the end card.
  const progressBarStories = hasLockedPremiumEndCard
    ? [...stories, { story_id: "premium-end-card" }]
    : stories;

  // Admin-uploaded stories carry agent_id: 0 and an admin_slug_id instead of a
  // regular agent slug — route to the admin's profile with ?is_admin=true, same
  // convention used by AgentDetails/AgentProfileCard for admin profile links.
  const agentProfileSlug = activeAgent?.is_admin
    ? activeAgent?.admin_slug_id
    : activeAgent?.slug_id || activeAgent?.agent_slug_id || activeAgent?.agent_id;
  const agentProfileHref = `/agent-details/${agentProfileSlug}?${activeAgent?.is_admin ? "is_admin=true&" : ""}lang=${lang}`;

  const currentStory = isEndCard ? null : stories[activeStoryIndex];
  const linkedEntity = currentStory?.linked_entity;
  const isLinkedProperty = linkedEntity?.type === "property";
  const linkedPropertyType = linkedEntity?.property_type?.toLowerCase();
  const linkedProjectType = linkedEntity?.project_type?.toLowerCase();
  const linkedBadgeClass = isLinkedProperty
    ? linkedPropertyType === "sell"
      ? "primarySellBg primarySellText"
      : "primaryRentBg primaryRentText"
    : "primaryBg primaryTextColor";
  const linkedBadgeLabel = isLinkedProperty
    ? t(linkedPropertyType)
    : t(linkedProjectType === "under_construction" ? "underConstruction" : "upcoming");

  // State
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [restartTick, setRestartTick] = useState(0);

  // Swipe down to close variables
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);

  const handleTouchStart = (e) => {
    const target = e.target;
    // Ignore swipe action if dragging on buttons/links/interactive inputs
    if (target.closest("button") || target.closest("a") || target.closest("input")) {
      return;
    }
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchCurrentY.current = touch.clientY;
    setIsDragging(true);
    hasDraggedRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    touchCurrentY.current = touch.clientY;
    const diffY = touchCurrentY.current - touchStartY.current;

    if (diffY > 10) {
      hasDraggedRef.current = true;
    }

    if (diffY > 0) {
      if (e.cancelable) e.preventDefault();
      setDragOffsetY(diffY);
      setIsPaused(true);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diffY = touchCurrentY.current - touchStartY.current;
    if (diffY > 120) {
      handleClose();
    } else {
      setDragOffsetY(0);
      setIsPaused(false);
    }
  };

  const webSettings = useSelector((state) => state?.WebSetting?.data);

  const handleShareClick = (e) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  // Favorite (like/dislike) state for the story's linked property. Projects have
  // no favourite endpoint in this app, so the heart button is property-only.
  const [isEntityLiked, setIsEntityLiked] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  useEffect(() => {
    setIsEntityLiked(Boolean(linkedEntity?.is_favourite));
  }, [linkedEntity]);

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (isFavLoading || !isLinkedProperty) return;

    if (!isUserLoggedIn) {
      handleClose();
      onRequireLogin();
      return;
    }

    const nextLiked = !isEntityLiked;
    try {
      setIsFavLoading(true);
      setIsEntityLiked(nextLiked);

      const res = await addFavouritePropertyApi({
        property_id: linkedEntity?.id,
        type: nextLiked ? "1" : "0",
      });

      if (res.error === false) {
        toast.success(t(res.message));
      } else {
        setIsEntityLiked(!nextLiked);
        toast.error(t(res.message));
      }
    } catch (error) {
      setIsEntityLiked(!nextLiked);
      console.error("Error toggling favorite:", error);
    } finally {
      setIsFavLoading(false);
    }
  };

  // Ref tracking the last newly-seen story pending an API view-record call on close
  const pendingViewRecordRef = useRef(null);
  const videoRef = useRef(null);

  const duration = currentStory
    ? currentStory?.media_type === "video" && videoDuration
      ? videoDuration * 1000
      : (currentStory?.duration_seconds || 6) * 1000
    : 6000;

  // Determine user role for package upgrades
  const userRole = useSelector((state) => state.User?.role ?? "user");

  // Determine premium access block
  const isPremiumLocked = currentStory?.is_premium && (
    linkedEntity?.type === "property"
      ? !userHasPremiumPropertiesAccess
      : linkedEntity?.type === "project"
        ? !userHasPremiumProjectsAccess
        : true
  );

  // Guest view limit
  const isGuestLimitReached = !isUserLoggedIn && guestViewCount >= 5;

  // Navigation handlers

  // Keep the latest values reachable from a stable callback (see flushPendingViewRecord
  // below) without making that callback's identity change on every render — an unstable
  // identity would retrigger the unmount-flush effect's cleanup on every render instead
  // of only on real unmount, causing the pending story to be flushed (and cleared) far
  // too early and never fire again when the viewer actually closes.
  const latestRef = useRef({});
  latestRef.current = { isUserLoggedIn, currentStory, isPremiumLocked, isGuestLimitReached, viewedOverrides, stories, activeStoryIndex };

  // Record the view for the single furthest story reached on the agent being left, if any.
  // pendingViewRecordRef is only ever set for stories that weren't already seen,
  // so this never re-fires for a story that's already been recorded. Called when
  // hitting a premium/guest wall, switching to a different agent, and when the whole
  // viewer closes — so exactly one call happens per agent visit, for the last-reached story.
  const flushPendingViewRecord = useCallback(() => {
    const { isUserLoggedIn, currentStory, isPremiumLocked, isGuestLimitReached, viewedOverrides } = latestRef.current;

    // Fall back to whatever story is currently on screen if the tracking effect
    // hasn't set the ref yet (e.g. closing in the same tick the viewer landed on
    // its final story). Without this fallback, closing right on the last agent's
    // last story could race the effect and silently skip the API call.
    let storyIdToRecord = pendingViewRecordRef.current;
    if (!storyIdToRecord && currentStory && !isPremiumLocked && !isGuestLimitReached) {
      const alreadySeen = currentStory.is_seen || viewedOverrides[currentStory.story_id];
      if (!alreadySeen) {
        storyIdToRecord = currentStory.story_id;
      }
    }

    if (isUserLoggedIn && storyIdToRecord) {
      storyViewApi({ story_id: storyIdToRecord }).catch((err) =>
        console.error("Error sending story view:", err)
      );
      pendingViewRecordRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    flushPendingViewRecord();
    dispatch(setActiveAgentId(null));
  }, [flushPendingViewRecord, dispatch]);

  const handleNext = useCallback(() => {
    if (activeStoryIndex < virtualSlideCount - 1) {
      // Advances through real stories, and onto the locked-premium end card
      // (if any) once the real stories run out.
      dispatch(setActiveStoryIndex(activeStoryIndex + 1));
      setVideoDuration(null);
    } else {
      // Transition to next agent
      const nextIndex = agentIndex + 1;
      if (nextIndex < (agentsStories?.length ?? 0)) {
        flushPendingViewRecord();
        dispatch(setActiveAgentId(agentsStories[nextIndex]?.agent_id));
        setVideoDuration(null);
      } else {
        // End of all agents, close
        handleClose();
      }
    }
  }, [activeStoryIndex, virtualSlideCount, agentIndex, agentsStories, dispatch, handleClose, flushPendingViewRecord]);

  const handlePrev = useCallback(() => {
    if (activeStoryIndex > 0) {
      dispatch(setActiveStoryIndex(activeStoryIndex - 1));
      setVideoDuration(null);
    } else {
      // Transition to previous agent
      const prevIndex = agentIndex - 1;
      if (prevIndex >= 0) {
        flushPendingViewRecord();
        dispatch(setActiveAgentId(agentsStories[prevIndex]?.agent_id));
        setVideoDuration(null);
      } else {
        // First agent, first story: force the progress bar to restart from 0
        setRestartTick((tick) => tick + 1);
      }
    }
  }, [activeStoryIndex, agentIndex, agentsStories, dispatch, flushPendingViewRecord]);

  // Tap overlays touch gesture variables to handle tap-to-navigate vs drag-to-close
  const overlayTouchStartX = useRef(0);
  const overlayTouchStartY = useRef(0);
  const overlayHasMoved = useRef(false);

  const handleOverlayTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    overlayTouchStartX.current = touch.clientX;
    overlayTouchStartY.current = touch.clientY;
    overlayHasMoved.current = false;
  }, []);

  const handleOverlayTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const diffY = Math.abs(touch.clientY - overlayTouchStartY.current);
    const diffX = Math.abs(touch.clientX - overlayTouchStartX.current);
    if (diffY > 10 || diffX > 10) {
      overlayHasMoved.current = true;
    }
  }, []);

  const handleOverlayTouchEnd = useCallback((e, action) => {
    if (overlayHasMoved.current) return;

    e.stopPropagation();
    e.preventDefault();
    setIsPaused(false);
    if (action === "prev") {
      handlePrev();
    } else {
      handleNext();
    }
  }, [handlePrev, handleNext, setIsPaused]);

  // 1. Initial Seen State Tracking when currentStory changes
  //
  // Only ONE story-view API call is made per agent visit: for whichever story the
  // user actually last reached before leaving (end of agent, premium/guest wall, or
  // close) — not one call per story. Intermediate stories just overwrite
  // pendingViewRecordRef as the user passes through them; nothing is sent for them.
  //
  // This effect re-runs on its own markStoryViewedLocal dispatch (viewedOverrides is
  // a dep), but that re-run is a no-op: alreadySeen becomes true on the second pass,
  // so it can never flush or requeue mid-story. Do NOT flush pendingViewRecordRef here
  // on every story change — that would call the API for every story instead of only
  // the one the user stops on.
  useEffect(() => {
    if (!currentStory) return;

    // Hit a premium/guest wall: flush whatever was the last reachable story before
    // it, since the user may skip past or never unlock this one.
    if ((isPremiumLocked || isGuestLimitReached) && pendingViewRecordRef.current) {
      flushPendingViewRecord();
    }

    const storyId = currentStory.story_id;
    const alreadySeen = currentStory.is_seen || viewedOverrides[storyId];

    if (alreadySeen || isPremiumLocked || isGuestLimitReached) return;

    // Update local seen state in Redux immediately (drives the "unseen" ring in StoriesRail)
    dispatch(
      markStoryViewedLocal({
        story_id: storyId,
        is_guest: !isUserLoggedIn,
      })
    );

    const { stories: latestStories, activeStoryIndex: latestActiveIndex } = latestRef.current;
    const isLastStoryOfAgent = latestActiveIndex >= latestStories.length - 1;

    if (isLastStoryOfAgent) {
      // Nothing further to reach in this agent (covers the single-story case too) —
      // record right away instead of waiting for a close/switch that may not come.
      if (isUserLoggedIn) {
        storyViewApi({ story_id: storyId }).catch((err) =>
          console.error("Error sending story view instantly:", err)
        );
      }
      pendingViewRecordRef.current = null;
    } else {
      // Remember this as the furthest point reached so far; only recorded if the
      // user actually stops here (agent switch, premium wall, or close).
      pendingViewRecordRef.current = storyId;
    }
  }, [currentStory, isPremiumLocked, isGuestLimitReached, isUserLoggedIn, dispatch, viewedOverrides, flushPendingViewRecord]);

  // 1b. Safety net: flush whatever is still pending whenever the viewer closes/unmounts.
  // Covers the terminal case (last story of the last agent, no next agent to advance to)
  // where handleClose's own flush call might otherwise be skipped or missed.
  useEffect(() => {
    return () => {
      flushPendingViewRecord();
    };
  }, [flushPendingViewRecord]);

  // 2. Sync HTML5 Video playback with pause state
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || isPremiumLocked || isGuestLimitReached || isEndCard) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => console.log("Video autoplay blocked:", err));
      }
    }
  }, [isPaused, currentStory, isPremiumLocked, isGuestLimitReached, isEndCard]);

  // 3. Desktop keyboard navigation: Left/Right arrows to go prev/next, Space to pause/play, M to mute/unmute
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        isRtl ? handleNext() : handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        isRtl ? handlePrev() : handleNext();
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, isRtl]);

  if (activeAgentId === null || (!currentStory && !isEndCard)) return null;

  // Video metadata loads
  const handleVideoMetadata = (e) => {
    setVideoDuration(e.target.duration);
  };

  // Pause / Resume
  // On desktop, a mousedown that's held past LONG_PRESS_MS is treated as a
  // "hold to pause" gesture rather than a click — holdTriggeredRef marks that
  // so the tap overlays' onClick (which fires on mouseup) can skip navigation
  // for it, while a quick click still passes through and navigates prev/next.
  const LONG_PRESS_MS = 200;
  const pressTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);

  const handlePressStart = () => {
    setIsPaused(true);
    holdTriggeredRef.current = false;
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
    }, LONG_PRESS_MS);
  };

  const handlePressEnd = () => {
    setIsPaused(false);
    clearTimeout(pressTimerRef.current);
  };

  // Upgrades routing
  const handleUnlockPackage = () => {
    handleClose();
    const dest = userRole === "agent" ? `/agent/packages` : `/subscription-plan`;
    router.push(`${dest}?lang=${lang}`);
  };

  const handleLoginRedirect = () => {
    handleClose();
    onRequireLogin();
  };


  return createPortal(
    <div className="fixed inset-0 bg-[#121212]/90 backdrop-blur-md z-[9999] flex items-center justify-center select-none font-sans">
      {/* Close button in top-right of the screen */}
      <button
        onClick={handleClose}
        className="!hidden md:!flex absolute top-6 ltr:right-6 rtl:left-6 w-10 h-10 rounded-full bg-white text-black items-center justify-center hover:bg-gray-100 transition-colors z-[10000] focus:outline-none cursor-pointer shadow-md"
        aria-label={t("closeStories")}
      >
        <IoClose className="h-6 w-6" />
      </button>

      {/* Desktop navigation side buttons */}
      <button
        onClick={handlePrev}
        className={`hidden md:flex items-center justify-center absolute ${isRtl ? "right-4" : "left-4"} w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white z-50 cursor-pointer`}
        aria-label="Previous Agent"
      >
        <IoChevronBack className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
      </button>

      <button
        onClick={handleNext}
        className={`hidden md:flex items-center justify-center absolute ${isRtl ? "left-4" : "right-4"} w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white z-50 cursor-pointer`}
        aria-label="Next Agent"
      >
        <IoChevronForward className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
      </button>

      {/* Main player box */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className="w-full h-full md:h-auto md:max-w-[450px] md:aspect-[9/16] bg-black relative flex flex-col justify-between md:rounded-2xl overflow-hidden shadow-2xl touch-none"
      >
        {/* Custom progress bars */}
        <StoryProgressBar
          stories={progressBarStories}
          activeStoryIndex={activeStoryIndex}
          currentStory={currentStory}
          isPaused={isPaused}
          isPremiumLocked={isPremiumLocked}
          isGuestLimitReached={isGuestLimitReached || isEndCard}
          duration={duration}
          restartTick={restartTick}
          onComplete={handleNext}
        />

        {/* Top Header details */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-[72px] md:h-[72px] rounded-xl overflow-hidden border border-white/20 bg-white p-[2px] shrink-0">
              <ImageWithPlaceholder
                src={activeAgent?.agent_profile_image}
                alt={activeAgent?.agent_name}
                width={72}
                height={72}
                className="w-full h-full rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="block text-white font-semibold text-sm">
                  {activeAgent?.agent_name}
                </span>
                {activeAgent?.is_agent_verified && (
                  <VerifiedAgentBadge color={webSettings?.system_color} width={16} height={16} />
                )}
                {currentStory?.created_at && (
                  <span className="text-white/70 text-xs font-normal">
                    {getShortTimeAgo(currentStory.created_at)}
                  </span>
                )}
              </div>
              <Link
                href={agentProfileHref}
                onClick={handleClose}
                className="text-white/80 hover:text-white text-[11px] flex items-center gap-1 mt-0.5 hover:underline"
              >
                {t("viewProfile")}
                <FaArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPremiumLocked && !isGuestLimitReached && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-white hover:text-gray-300 bg-black/40 rounded-full p-2 focus:outline-none cursor-pointer"
                aria-label={isPaused ? t("play") : t("pause")}
              >
                {isPaused ? <IoPlay className="h-5 w-5" /> : <IoPause className="h-5 w-5" />}
              </button>
            )}

            {currentStory?.media_type === "video" && !isPremiumLocked && !isGuestLimitReached && (
              <button
                onClick={() => setMuted(!muted)}
                className="text-white hover:text-gray-300 bg-black/40 rounded-full p-2 focus:outline-none cursor-pointer"
                aria-label={t("toggleSound")}
              >
                {muted ? <IoVolumeMute className="h-5 w-5" /> : <IoVolumeHigh className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Main Content Play Area */}
        <div
          className="relative w-full h-full flex-1 flex items-center justify-center bg-zinc-900"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Active story content. Kept mounted (blurred) behind the premium-lock
              overlay so the locked state previews the real story instead of a
              flat black screen. */}
          {!isGuestLimitReached && !isEndCard && (
            <>
              {currentStory?.media_type === "image" ? (
                <ImageWithPlaceholder
                  src={currentStory?.media_url}
                  alt="Story content"
                  width={500}
                  height={888}
                  className={`w-full h-full object-contain ${isPremiumLocked ? "blur-xl scale-110" : ""}`}
                  priority
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentStory?.media_url}
                  autoPlay
                  playsInline
                  muted={muted}
                  onLoadedMetadata={handleVideoMetadata}
                  className={`w-full h-full object-contain ${isPremiumLocked ? "blur-xl scale-110" : ""}`}
                />
              )}
            </>
          )}

          {/* Tap overlay controls (Left/Right) */}
          {!isPremiumLocked && !isGuestLimitReached && !isEndCard && (
            <>
              <div
                className={`absolute top-16 bottom-20 ${isRtl ? "right-0" : "left-0"} w-1/3 z-30 cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasDraggedRef.current || holdTriggeredRef.current) return;
                  handlePrev();
                }}
                onTouchStart={handleOverlayTouchStart}
                onTouchMove={handleOverlayTouchMove}
                onTouchEnd={(e) => handleOverlayTouchEnd(e, "prev")}
              />
              <div
                className={`absolute top-16 bottom-20 ${isRtl ? "left-0" : "right-0"} w-2/3 z-30 cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasDraggedRef.current || holdTriggeredRef.current) return;
                  handleNext();
                }}
                onTouchStart={handleOverlayTouchStart}
                onTouchMove={handleOverlayTouchMove}
                onTouchEnd={(e) => handleOverlayTouchEnd(e, "next")}
              />
            </>
          )}

          {/* Premium Lock Overlay */}
          {isPremiumLocked && (
            <PremiumAccessOverlay
              onBackgroundClick={(e) => {
                if (hasDraggedRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickRatio = (e.clientX - rect.left) / rect.width;
                const clickedPrevZone = isRtl ? clickRatio > 2 / 3 : clickRatio < 1 / 3;
                if (clickedPrevZone) handlePrev();
                else handleNext();
              }}
              onPrimaryClick={handleUnlockPackage}
              onSecondaryClick={handleNext}
            >
              <p className="text-sm text-gray-200 mb-6 max-w-[280px]">
                {t("premiumStoryDesc")}
              </p>
            </PremiumAccessOverlay>
          )}

          {/* Guest Limit Overlay */}
          {isGuestLimitReached && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center text-white">
              <h4 className="text-2xl font-bold mb-2">{t("enjoyingStories")}</h4>
              <p className="text-sm text-gray-300 mb-6">
                {t("enjoyingStoriesDesc")}
              </p>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={handleLoginRedirect}
                  className="primaryBg hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-opacity text-sm cursor-pointer"
                >
                  {t("signIn")}
                </button>
                <button
                  onClick={handleClose}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Premium Stories End Card: shown once after the non-premium stories when
              the user lacks access to this agent's premium stories (premium_stories
              comes back empty with a premium_story_count instead of per-story locks). */}
          {isEndCard && (
            <PremiumAccessOverlay
              backdropBlur
              iconSize={{ width: 72, height: 72 }}
              iconBg=""
              onPrimaryClick={handleUnlockPackage}
              onSecondaryClick={handleNext}
              secondaryButtonClassName="border-white rounded-lg"
            >
              <p className="text-sm text-gray-300 mb-2">
                {lockedPremiumCount} {t("premiumStoriesLockedSuffix")}
              </p>
              <p className="text-sm text-gray-300 mb-6 max-w-[280px]">
                {t("premiumStoriesLockedDesc")}
              </p>
            </PremiumAccessOverlay>
          )}
        </div>

        {/* Linked Entity Card bottom overlay */}
        {linkedEntity && !isGuestLimitReached && !isPremiumLocked && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
              const targetSlug = linkedEntity?.slug_id || linkedEntity?.slug;
              const prefix = linkedEntity?.type === "project" ? "project-details" : "property-details";
              router.push(`/${prefix}/${targetSlug}/?lang=${lang}`);
            }}
            className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 shadow-lg z-40 text-white cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10 relative">
              <ImageWithPlaceholder
                src={linkedEntity?.image}
                alt={linkedEntity?.translated_title || linkedEntity?.title}
                width={56}
                height={56}
                className="w-full h-full"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="block text-sm md:text-base font-semibold truncate">
                {linkedEntity?.translated_title || linkedEntity?.title}
              </span>
              {linkedEntity?.price ? (
                <span className="block text-xs md:text-sm font-medium text-white mt-0.5">
                  {formatPriceAbbreviated(linkedEntity.price)}
                </span>
              ) : isLinkedProperty ? (
                <span className={`inline-block mt-0.5 ${linkedBadgeClass} text-[11px] font-semibold px-2 py-0.5 rounded-md`}>
                  {linkedBadgeLabel}
                </span>
              ) : null}
            </div>

            <div className="flex items-center bg-[#FFFFFF1F] rounded-[48px] p-3 gap-3 shrink-0">
              <button
                onClick={handleShareClick}
                className="text-white hover:text-gray-300 focus:outline-none cursor-pointer"
                aria-label={t("share")}
              >
                <FiShare2 className="h-[18px] w-[18px]" />
              </button>
              {isLinkedProperty && (
                <div className="w-[1px] h-4 bg-white/30" />
              )}
              {isLinkedProperty && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={isFavLoading}
                  className={`text-white hover:text-gray-300 focus:outline-none cursor-pointer ${isFavLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={isEntityLiked ? t("removeFromFavorites") : t("addToFavorites")}
                >
                  {isEntityLiked ? (
                    <FaHeart className="h-[18px] w-[18px] text-white" />
                  ) : (
                    <FiHeart className="h-[18px] w-[18px]" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isShareModalOpen && (
        <ShareDialog
          title={t("shareAgentStories")}
          subtitle={t("shareAgentStoriesSubtitle")}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          pageUrl={`${process.env.NEXT_PUBLIC_WEB_URL}${agentProfileHref}`}
          slug={agentProfileSlug}
        />
      )}
    </div>,
    document.body
  );
};

export default StoryViewer;
