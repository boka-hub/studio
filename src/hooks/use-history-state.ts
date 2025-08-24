
import { useState, useCallback } from 'react';
import type { Project } from '@/lib/types';

const MAX_HISTORY_SIZE = 50;

// A simple deep-enough equality check for our project state
const areStatesEqual = (a: Project, b: Project): boolean => {
    if (!a || !b) return a === b;
    if (a.id !== b.id || a.activeLayerId !== b.activeLayerId) return false;
    if (a.tiles.length !== b.tiles.length || a.layers.length !== b.layers.length) return false;

    // Quick check on tiles and layers based on their JSON representation
    // This is not perfectly performant, but more reliable than shallow checks.
    try {
        const aTiles = JSON.stringify(a.tiles);
        const bTiles = JSON.stringify(b.tiles);
        if (aTiles !== bTiles) return false;

        const aLayers = JSON.stringify(a.layers);
        const bLayers = JSON.stringify(b.layers);
        if (aLayers !== bLayers) return false;

    } catch (e) {
        // If stringify fails, assume they are not equal
        return false;
    }

    return true;
};


export function useHistoryState<T extends Project>(initialState: T) {
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

      if (areStatesEqual(currentState.present, newPresent)) {
          return currentState;
      }
      
      const newPast = [...currentState.past, currentState.present];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }
      
      // When batching, we just update the present state without adding to history yet.
      // The calling component is responsible for a final `set(..., false)` to commit.
      if (batch) {
          return {
              ...currentState,
              present: newPresent,
          };
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
