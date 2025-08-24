
import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function useHistoryState<T>(initialState: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  // Use a ref to track batched state to prevent re-renders on each tiny change
  const batchedStateRef = useRef<T | null>(null);

  const set = useCallback((newState: T | ((prevState: T) => T), batch = false) => {
    if (batch) {
      // If batching, just update the ref. The final commit will be done by calling set(..., false)
      const newPresent = typeof newState === 'function'
        ? (newState as (prevState: T) => T)(batchedStateRef.current ?? state.present)
        : newState;
      batchedStateRef.current = newPresent;
      // We also update the *visual* state so the user sees feedback (e.g., during drawing)
      setState(s => ({ ...s, present: newPresent }));
      return;
    }

    // This is the commit action (not batching)
    setState(currentState => {
      // If there was a batched state, use it as the starting point. Otherwise, use the current state.
      const currentPresent = batchedStateRef.current ?? currentState.present;
      batchedStateRef.current = null; // Clear the ref after commit

      const newPresent = typeof newState === 'function'
        ? (newState as (prevState: T) => T)(currentPresent)
        : newState;
      
      // Don't add to history if state is identical
      if (newPresent === currentPresent) {
          return currentState;
      }
      
      const newPast = [...currentState.past, currentPresent];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift(); // Keep history size in check
      }

      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future on new action
      };
    });
  }, [state.present]);

  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.past.length === 0) {
        return currentState;
      }
      
      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.future.length === 0) {
        return currentState;
      }
      
      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState({
        past: [],
        present: newState,
        future: [],
    })
  }, []);


  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
}
