"use client";

import { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 50; 

export const useUndoRedo = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T, bypassHistory: boolean = false) => {
    if (bypassHistory) {
      const newHistory = [...history];
      newHistory[currentIndex] = newState;
      setHistory(newHistory);
      return;
    }

    const currentState = history[currentIndex];
    if (JSON.stringify(currentState) === JSON.stringify(newState)) {
      return; // Prevent adding identical state to history
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    
    if (newHistory.length > MAX_HISTORY_SIZE) {
      // Remove the oldest state to maintain history size
      newHistory.shift(); 
    }
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);
  
  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [canRedo]);
  
  const resetHistory = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    history,
    setCurrentIndex,
  };
};