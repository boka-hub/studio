
import { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 50;

export function useHistoryState<T>(initialState: T) {
  const [state, setState] = useState({
    past: [] as T[],
    present: initialState,
    future: [] as T[],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newState: T | ((prevState: T) => T), batch = false) => {
    setState(currentState => {
      const newPresent = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(currentState.present) 
        : newState;

      if (JSON.stringify(currentState.present) === JSON.stringify(newPresent)) {
          return currentState;
      }

      if (batch) {
        return {
          ...currentState,
          present: newPresent,
          future: [],
        };
      }
      
      const newPast = [...currentState.past, currentState.present];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, []);

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
