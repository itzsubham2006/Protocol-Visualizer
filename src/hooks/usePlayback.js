/**
 * usePlayback — drives the step-by-step protocol reveal via setInterval.
 *
 * Reads isPlaying, playbackSpeed, currentStepIndex, and steps.length from context.
 * Dispatches STEP_FORWARD on each tick, auto-pauses at the end.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from '../context/SessionContext';

// Base interval in ms per step at 1x speed
const BASE_INTERVAL = 800;

export function usePlayback() {
  const {
    isPlaying,
    playbackSpeed,
    currentStepIndex,
    steps,
    dispatch,
    isStreaming,
  } = useSession();

  const intervalRef = useRef(null);

  // Clear any existing interval
  const clearPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Run playback
  useEffect(() => {
    clearPlayback();

    if (isPlaying && steps.length > 0) {
      const intervalMs = BASE_INTERVAL / playbackSpeed;

      intervalRef.current = setInterval(() => {
        dispatch({ type: 'STEP_FORWARD' });
      }, intervalMs);
    }

    return clearPlayback;
  }, [isPlaying, playbackSpeed, steps.length, clearPlayback, dispatch]);

  // Auto-pause when we reach the end and streaming is complete
  useEffect(() => {
    if (currentStepIndex >= steps.length - 1 && isPlaying && steps.length > 0 && !isStreaming) {
      dispatch({ type: 'SET_PLAYING', isPlaying: false });
    }
  }, [currentStepIndex, steps.length, isPlaying, isStreaming, dispatch]);

  // Public control functions
  const play = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      dispatch({ type: 'REPLAY' });
    } else {
      dispatch({ type: 'SET_PLAYING', isPlaying: true });
    }
  }, [currentStepIndex, steps.length, dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
  }, [dispatch]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
    dispatch({ type: 'STEP_FORWARD' });
  }, [dispatch]);

  const stepBackward = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
    dispatch({ type: 'STEP_BACKWARD' });
  }, [dispatch]);

  const replay = useCallback(() => {
    dispatch({ type: 'REPLAY' });
  }, [dispatch]);

  const setSpeed = useCallback((speed) => {
    dispatch({ type: 'SET_SPEED', speed });
  }, [dispatch]);

  return {
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    replay,
    setSpeed,
    isPlaying,
    playbackSpeed,
    currentStepIndex,
    totalSteps: steps.length,
    isAtEnd: currentStepIndex >= steps.length - 1,
    isAtStart: currentStepIndex <= -1,
    hasSteps: steps.length > 0,
  };
}
