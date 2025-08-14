"use client";

import { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 51; // 50 undos + 1 current state

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

    const newHistory = history.slice(0, currentIndex + 1);
    
    // Prevent adding identical state to history
    if (JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(newState)) {
      return;
    }
    
    newHistory.push(newState);
    
    let finalHistory = newHistory;
    if (newHistory.length > MAX_HISTORY_SIZE) {
      finalHistory = newHistory.slice(newHistory.length - MAX_HISTORY_SIZE);
    }
    
    setHistory(finalHistory);
    setCurrentIndex(finalHistory.length - 1);
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

    