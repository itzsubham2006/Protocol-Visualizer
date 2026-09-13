/**
 * SessionContext — the single source of truth for dual-panel sync
 *
 * Both ActivityPanel and ProtocolPanel read from this context.
 * Because React re-renders both consumers on the same state change,
 * synchronization falls out naturally — no events/websockets needed.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

const SessionContext = createContext(null);

const initialState = {
  activityType: null,       // 'browsing' | 'mail' | 'streaming' | null
  activityLog: [],          // [{ id, timestamp, message, type }]
  steps: [],                // Array<Step> — the full protocol sequence
  currentStepIndex: -1,     // -1 = nothing revealed yet
  isPlaying: false,
  playbackSpeed: 1,         // 0.5 | 1 | 2 | 4
  selectedStepId: null,     // ID of the step whose MessageCard is expanded
  isRealNetwork: false,     // whether backend is available
  isStreaming: false,       // whether events are currently being streamed via SSE
  realTimeEnabled: true,    // user toggle for Real-Time vs Simulation mode
};

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_REAL_TIME_MODE':
      return { ...state, realTimeEnabled: action.value };

    case 'SET_REAL_NETWORK':
      return { ...state, isRealNetwork: action.value };
      
    case 'APPEND_STEP': {
      const isFirst = state.currentStepIndex === -1;
      return {
        ...state,
        steps: [...state.steps, action.step],
        // If nothing revealed yet, reveal first step immediately
        currentStepIndex: isFirst ? 0 : state.currentStepIndex,
        // While streaming, always keep playback active so upcoming events are revealed
        isPlaying: state.isStreaming ? true : state.isPlaying,
      };
    }

    case 'START_STREAMING_ACTIVITY':
      return {
        ...state,
        activityType: action.activityType,
        steps: [],
        currentStepIndex: -1,
        isPlaying: true,
        isStreaming: true,
        selectedStepId: null,
      };

    case 'FINISH_STREAMING': {
      const isAtEnd = state.currentStepIndex >= state.steps.length - 1;
      return {
        ...state,
        isStreaming: false,
        // If playback hasn't revealed all steps yet, keep playing; only pause if already at end
        isPlaying: isAtEnd ? false : state.isPlaying,
      };
    }

    case 'SET_STEPS':
      return {
        ...state,
        activityType: action.activityType,
        steps: action.steps,
        currentStepIndex: -1,
        isPlaying: true,
        selectedStepId: null,
      };

    case 'SET_STEP_INDEX':
      return {
        ...state,
        currentStepIndex: action.index,
      };

    case 'STEP_FORWARD': {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.steps.length - 1);
      const isAtEnd = nextIndex >= state.steps.length - 1;
      // If we are actively streaming, keep isPlaying true even if caught up with received packets
      const keepPlaying = state.isStreaming ? true : (isAtEnd ? false : state.isPlaying);
      return {
        ...state,
        currentStepIndex: nextIndex,
        isPlaying: keepPlaying,
      };
    }

    case 'STEP_BACKWARD': {
      const prevIndex = Math.max(state.currentStepIndex - 1, -1);
      return {
        ...state,
        currentStepIndex: prevIndex,
        isPlaying: false,
      };
    }

    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.isPlaying,
      };

    case 'REPLAY':
      return {
        ...state,
        currentStepIndex: -1,
        isPlaying: true,
        selectedStepId: null,
      };

    case 'SET_SPEED':
      return {
        ...state,
        playbackSpeed: action.speed,
      };

    case 'SELECT_STEP':
      return {
        ...state,
        selectedStepId: state.selectedStepId === action.stepId ? null : action.stepId,
      };

    case 'ADD_LOG':
      return {
        ...state,
        activityLog: [
          ...state.activityLog,
          {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message: action.message,
            type: action.logType,
          },
        ],
      };

    case 'CLEAR_LOG':
      return {
        ...state,
        activityLog: [],
      };

    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const startActivity = useCallback((activityType, steps, logMessage) => {
    dispatch({ type: 'SET_STEPS', activityType, steps });
    dispatch({ type: 'ADD_LOG', message: logMessage, logType: activityType });
  }, []);

  const value = {
    ...state,
    dispatch,
    startActivity,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export default SessionContext;
