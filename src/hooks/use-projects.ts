
import { useState, useEffect, useCallback } from 'react';
import type { Project, GridState, Tile, ProjectState } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useHistoryState } from './use-history-state';
import { isTileTransparent } from '@/lib/utils';

const STORAGE_KEY = 'tileforge-projects';
const INITIAL_GRID_SIZE = 32;

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

const createNewProject = (name: string, state?: ProjectState): Project => ({
  id: `proj_${new Date().getTime()}_${Math.random()}`,
  name,
  grid: state?.grid || createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE),
  tiles: state?.tiles || [{ id: 0, name: 'Empty', src: '', solid: false }],
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
      let projectsToLoad: Project[];
      let activeProjectId: string | null;

      if (savedData) {
        const savedState = JSON.parse(savedData);
        if (Array.isArray(savedState.projects) && savedState.projects.length > 0) {
            projectsToLoad = savedState.projects;
            const projectToLoad = projectsToLoad.find(p => p.id === savedState.currentProjectId) || projectsToLoad[0];
            activeProjectId = projectToLoad.id;
        } else {
          const defaultProject = createNewProject('New Project');
          projectsToLoad = [defaultProject];
          activeProjectId = defaultProject.id;
        }
      } else {
        const defaultProject = createNewProject('New Project');
        projectsToLoad = [defaultProject];
        activeProjectId = defaultProject.id;
      }
      
      reset({ projects: projectsToLoad, currentProjectId: activeProjectId });

    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('New Project');
      reset({ projects: [defaultProject], currentProjectId: defaultProject.id });
    } finally {
      setIsLoading(false);
    }
  }, [toast, reset]);

  useEffect(() => {
    if (isLoading || !currentProjectId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save your changes.' });
    }
  }, [state, isLoading, toast, currentProjectId]);
  
  const modifyCurrentProject = useCallback((modifier: (project: Project) => Project, batch = false) => {
    set(currentState => {
        if (!currentState.currentProjectId) return currentState;
        return {
            ...currentState,
            projects: currentState.projects.map(p => 
                p.id === currentState.currentProjectId 
                ? { ...modifier(p), lastModified: Date.now() } 
                : p
            ),
        }
    }, batch)
  }, [set]);

  const updateGrid = useCallback((grid: GridState, batch = false) => {
      modifyCurrentProject(proj => ({ ...proj, grid }), batch);
  }, [modifyCurrentProject]);

  const updateTiles = useCallback((tiles: Tile[], batch = false) => {
      modifyCurrentProject(proj => ({ ...proj, tiles }), batch);
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
              modifyCurrentProject(proj => {
                  let nextId = proj.tiles.length > 0 ? Math.max(...proj.tiles.map(t => t.id)) + 1 : 1;
                  const tilesWithIds: Tile[] = newTilesData.map((tile) => ({
                      ...tile,
                      id: nextId++,
                      solid: false,
                  }));
                  return { ...proj, tiles: [...proj.tiles, ...tilesWithIds] };
              });
              toast({
                  title: 'Tiles Added',
                  description: `${newTilesData.length} new tile(s) have been added to the palette.`,
              });
          }
      });
  }, [modifyCurrentProject, toast]);

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
        const newProject = createNewProject(name, current);
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
    set(currentState => ({
        ...currentState,
        projects: currentState.projects.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p)
    }));
  }, [set]);
  
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
