"use client";
import { useEffect, useRef, useState } from "react";

const StoryProgressBar = ({
  stories,
  activeStoryIndex,
  currentStory,
  isPaused,
  isPremiumLocked,
  isGuestLimitReached,
  duration,
  restartTick,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  // Elapsed playback time (ms) for the current story, preserved across pause/resume
  // so resuming continues the bar from where it was held, not from the start.
  const elapsedRef = useRef(0);

  // Reset progress only when the story itself changes (or an explicit restart is
  // requested) — NOT on every pause/resume toggle.
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [currentStory?.story_id, restartTick]);

  useEffect(() => {
    if (isPaused || isPremiumLocked || isGuestLimitReached || !currentStory) {
      return;
    }

    const startTime = Date.now() - elapsedRef.current;
    const tickInterval = 50; // update progress every 50ms

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      elapsedRef.current = elapsed;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setProgress(percent);
    }, tickInterval);

    const remaining = Math.max(duration - elapsedRef.current, 0);
    timerRef.current = setTimeout(() => {
      onComplete();
    }, remaining);

    return () => {
      clearInterval(progressIntervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, [currentStory, isPaused, duration, isPremiumLocked, isGuestLimitReached, onComplete, restartTick]);

  return (
    <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-40">
      {stories?.map((s, idx) => {
        let widthPercent = 0;
        if (idx < activeStoryIndex) {
          widthPercent = 100;
        } else if (idx === activeStoryIndex) {
          widthPercent = progress;
        }

        return (
          <div
            key={s?.story_id ?? idx}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white"
              style={{
                width: `${widthPercent}%`,
                transition: idx === activeStoryIndex ? "none" : "width 0.1s linear",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StoryProgressBar;
