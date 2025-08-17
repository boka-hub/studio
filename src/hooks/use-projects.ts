import { useState, useEffect, useCallback } from 'react';
import type { Project, GridState, Tile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useHistoryState } from './use-history-state';
import { isTileTransparent } from '@/lib/utils';

const STORAGE_KEY = 'tileforge-projects';
const INITIAL_GRID_SIZE = 32;

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

const createNewProject = (name: string): Project => ({
  id: `proj_${new Date().getTime()}_${Math.random()}`,
  name,
  grid: createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE),
  tiles: [{ id: 0, name: 'Empty', src: '', solid: false }],
  lastModified: Date.now(),
});

interface ProjectsState {
    projects: Project[];
    currentProjectId: string | null;
}

export const useProjects = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const {
    state,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useHistoryState<ProjectsState>({ projects: [], currentProjectId: null });

  const { projects, currentProjectId } = state;

  useEffect(() => {
    setIsLoading(true);
    try {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const savedState = JSON.parse(savedData) as ProjectsState;
        if (Array.isArray(savedState.projects) && savedState.projects.length > 0) {
           const projectExists = savedState.projects.some(p => p.id === savedState.currentProjectId);
           const activeId = projectExists ? savedState.currentProjectId : savedState.projects[0].id;
           reset({
             projects: savedState.projects,
             currentProjectId: activeId,
           });
        } else {
           const defaultProject = createNewProject('New Project');
           reset({ projects: [defaultProject], currentProjectId: defaultProject.id });
        }
      } else {
        const defaultProject = createNewProject('New Project');
        reset({ projects: [defaultProject], currentProjectId: defaultProject.id });
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('New Project');
      reset({ projects: [defaultProject], currentProjectId: defaultProject.id });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  useEffect(() => {
    if (isLoading) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save your changes.' });
    }
  }, [state, isLoading, toast]);
  
  const modifyCurrentProject = useCallback((modifier: (project: Project) => Partial<Project>, batch = false) => {
    set(currentState => {
        if (!currentState.currentProjectId) return currentState;
        return {
            ...currentState,
            projects: currentState.projects.map(p => 
                p.id === currentState.currentProjectId 
                ? { ...p, ...modifier(p), lastModified: Date.now() } 
                : p
            ),
        }
    }, batch)
  }, [set]);

  const updateGrid = useCallback((grid: GridState, batch = false) => {
      modifyCurrentProject(() => ({ grid }), batch);
  }, [modifyCurrentProject]);

  const updateTiles = useCallback((tiles: Tile[], batch = false) => {
      modifyCurrentProject(() => ({ tiles }), batch);
  }, [modifyCurrentProject]);
  
  const addTiles = useCallback((files: File[]) => {
      if (files.length === 0) return;
      
      const readFiles = files.map(file => {
          return new Promise<{name: string, src: string} | null>((resolve) => {
             const reader = new FileReader();
             reader.onload = async (e) => {
                const src = e.target?.result as string;
                if (await isTileTransparent(src)) {
                   resolve(null);
                } else {
                   resolve({ name: file.name.replace(/\.[^/.]+$/, ""), src });
                }
             };
             reader.onerror = () => resolve(null);
             reader.readAsDataURL(file);
          });
      });

      Promise.all(readFiles).then(results => {
          const newTilesData = results.filter((r): r is {name: string, src: string} => r !== null);
          
          const skippedCount = files.length - newTilesData.length;
          if (skippedCount > 0) {
            toast({
                title: 'Transparent Tiles Skipped',
                description: `${skippedCount} tile(s) were fully transparent and have been ignored.`,
            });
          }

          if (newTilesData.length > 0) {
              set(currentState => {
                const currentProject = currentState.projects.find(p => p.id === currentState.currentProjectId);
                if (!currentProject) return currentState;

                let nextId = currentProject.tiles.length > 0 ? Math.max(...currentProject.tiles.map(t => t.id)) + 1 : 1;
                const tilesWithIds: Tile[] = newTilesData.map((tile) => ({
                    ...tile,
                    id: nextId++,
                    solid: false,
                }));
                const newTiles = [...currentProject.tiles, ...tilesWithIds];

                const updatedProjects = currentState.projects.map(p => p.id === currentState.currentProjectId ? {...p, tiles: newTiles, lastModified: Date.now()} : p);
                return { ...currentState, projects: updatedProjects };
              });
              
              toast({
                  title: 'Tiles Added',
                  description: `${newTilesData.length} new tile(s) have been added to the palette.`,
              });
          }
      });
  }, [set, toast]);

  const loadProject = useCallback((id: string) => {
    set(currentState => {
        if (currentState.projects.some(p => p.id === id)) {
             return { ...currentState, currentProjectId: id };
        }
        toast({ variant: 'destructive', title: 'Load Error', description: 'Could not find the selected project.' });
        return currentState;
    });
  }, [set, toast]);

  const saveProject = useCallback((name: string) => {
    set(currentState => {
        const current = currentState.projects.find(p => p.id === currentState.currentProjectId);
        if (!current) return currentState;

        const newProject: Project = {
          id: `proj_${new Date().getTime()}_${Math.random()}`,
          name,
          grid: current.grid,
          tiles: current.tiles,
          lastModified: Date.now(),
        };

        return {
            ...currentState,
            projects: [...currentState.projects, newProject],
            currentProjectId: newProject.id,
        }
    });
  }, [set]);

  const deleteProject = useCallback((id: string) => {
    set(currentState => {
        const remainingProjects = currentState.projects.filter(p => p.id !== id);
        
        if (remainingProjects.length === 0) {
            const newDefault = createNewProject('New Project');
            return { projects: [newDefault], currentProjectId: newDefault.id };
        }
        
        let newCurrentId = currentState.currentProjectId;
        if (currentState.currentProjectId === id) {
            newCurrentId = remainingProjects.sort((a,b) => b.lastModified - a.lastModified)[0].id;
        }

        return { projects: remainingProjects, currentProjectId: newCurrentId };
    });
    toast({ title: 'Project Deleted'});
  }, [set, toast]);

  const renameProject = useCallback((id: string, newName: string) => {
    modifyCurrentProject(() => ({ name: newName }));
  }, [modifyCurrentProject]);
  
  const currentProject = projects.find(p => p.id === currentProjectId);

  return {
    projects,
    currentProject: currentProject || createNewProject('Loading...'),
    isLoading,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    updateGrid,
    updateTiles,
    addTiles,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
