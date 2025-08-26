
import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

type HistoryState<T> = {
  past: T[];
  present: T | null;
  future: T[];
};

export function useHistoryState<T>(initialPresent: T | undefined | null) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent || null,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newStateOrFn: T | ((prevState: T) => T), batch = false) => {
    setState(currentState => {
      const { past, present } = currentState;
      if (present === null) return currentState;

      const newPresent = typeof newStateOrFn === 'function'
        ? (newStateOrFn as (prevState: T) => T)(present)
        : newStateOrFn;

      if (newPresent === present) {
        return currentState;
      }

      if (batch) {
        // For batched updates, we just update the present state without affecting history.
        // The final commit will be a non-batched call.
        return { ...currentState, present: newPresent };
      }

      const newPast = [...past, present].slice(-MAX_HISTORY_SIZE);
      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future on new action
      };
    });
  }, [setState]);

  const undo = useCallback(() => {
    setState(s => {
      const { past, present, future } = s;
      if (past.length === 0 || present === null) {
        return s;
      }
      const newPresent = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      const newFuture = [present, ...future];
      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(s => {
      const { past, present, future } = s;
      if (future.length === 0 || present === null) {
        return s;
      }
      const newPresent = future[0];
      const newFuture = future.slice(1);
      const newPast = [...past, present];
      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
      setState({
          past: [],
          present: newPresent,
          future: [],
      });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
