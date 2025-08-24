
import { useState, useCallback, useRef, useEffect } from 'react';

const MAX_HISTORY_SIZE = 50;

type HistoryState<T> = {
  past: T[];
  present: T | null;
  future: T[];
};

export function useHistoryState<T>(initialPresent: T | undefined) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent || null,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  
  // A ref to hold the current state during batch operations.
  const batchRef = useRef<T | null>(null);

  const set = useCallback((newStateFn: (prevState: T) => T, batch = false) => {
      if (batch) {
          // If batching, update the ref but don't commit to history yet.
          // Update the immediate state for UI responsiveness.
          setState(s => {
              const current = batchRef.current ?? s.present;
              if (!current) return s;
              batchRef.current = newStateFn(current);
              return { ...s, present: batchRef.current };
          });
          return;
      }

      // Not batching, or committing a batch.
      setState(s => {
          const current = s.present;
          if (!current) return s;

          const newPresent = batchRef.current ?? newStateFn(current);
          batchRef.current = null; // Clear batch ref after commit.

          if (newPresent === current) {
              return s;
          }

          const newPast = [...s.past, current].slice(-MAX_HISTORY_SIZE);

          return {
              past: newPast,
              present: newPresent,
              future: [], // Clear future on a new action.
          };
      });
  }, []);


  const undo = useCallback(() => {
    setState(s => {
      if (s.past.length === 0 || !s.present) {
        return s;
      }
      const newFuture = [s.present, ...s.future];
      const newPresent = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, s.past.length - 1);
      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(s => {
      if (s.future.length === 0 || !s.present) {
        return s;
      }
      const newPast = [...s.past, s.present];
      const newPresent = s.future[0];
      const newFuture = s.future.slice(1);
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
