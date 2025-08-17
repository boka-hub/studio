
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

const createInitialState = (): ProjectState => ({
  grid: createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE),
  tiles: [{ id: 0, name: 'Empty', src: '', solid: false }],
});

const createNewProject = (name: string): Project => ({
  id: `proj_${new Date().getTime()}_${Math.random()}`,
  name,
  ...createInitialState(),
  lastModified: Date.now(),
});


export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const {
    state: projectState,
    set: setProjectState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory
  } = useHistoryState<ProjectState>(createInitialState());


  // Load projects from localStorage on initial mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      let activeProjectId: string;
      let projectsToLoad: Project[];

      if (savedData) {
        const { projects: savedProjects, last_active_project_id: lastActiveId } = JSON.parse(savedData);
        if (Array.isArray(savedProjects) && savedProjects.length > 0) {
          projectsToLoad = savedProjects;
          const projectToLoad = savedProjects.find(p => p.id === lastActiveId) || savedProjects[0];
          activeProjectId = projectToLoad.id;
          resetHistory({ grid: projectToLoad.grid, tiles: projectToLoad.tiles });
        } else {
          const defaultProject = createNewProject('New Project');
          projectsToLoad = [defaultProject];
          activeProjectId = defaultProject.id;
          resetHistory({ grid: defaultProject.grid, tiles: defaultProject.tiles });
        }
      } else {
        const defaultProject = createNewProject('New Project');
        projectsToLoad = [defaultProject];
        activeProjectId = defaultProject.id;
        resetHistory(createInitialState());
      }
      
      setProjects(projectsToLoad);
      setCurrentProjectId(activeProjectId);

    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('New Project');
      setProjects([defaultProject]);
      setCurrentProjectId(defaultProject.id);
      resetHistory(createInitialState());
    } finally {
      setIsLoading(false);
    }
  }, [toast, resetHistory]);

  // Auto-save the current project state into the projects list
  useEffect(() => {
    if (isLoading || !currentProjectId) return;
    
    setProjects(projs => {
        const currentProjectExists = projs.some(p => p.id === currentProjectId);
        if (!currentProjectExists) return projs;
        
        return projs.map(p =>
            p.id === currentProjectId ? { ...p, ...projectState, lastModified: Date.now() } : p
        );
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState, currentProjectId]);

   // Persist the full project list to localStorage when it changes
  useEffect(() => {
    if (isLoading) return;
    try {
      const dataToSave = {
        projects,
        last_active_project_id: currentProjectId,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save your changes.' });
    }
  }, [projects, currentProjectId, isLoading, toast]);

  const updateGrid = useCallback((grid: GridState, batch = false) => {
      setProjectState(currentState => ({ ...currentState, grid }), batch);
  }, [setProjectState]);

  const updateTiles = useCallback((tiles: Tile[], batch = false) => {
      setProjectState(currentState => ({ ...currentState, tiles }), batch);
  }, [setProjectState]);
  
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
              setProjectState(currentState => {
                  let nextId = currentState.tiles.length > 0 ? Math.max(...currentState.tiles.map(t => t.id)) + 1 : 1;
                  
                  const tilesWithIds: Tile[] = newTilesData.map((tile) => ({
                      ...tile,
                      id: nextId++,
                      solid: false,
                  }));
                  
                  return {
                      ...currentState,
                      tiles: [...currentState.tiles, ...tilesWithIds],
                  };
              });
              toast({
                  title: 'Tiles Added',
                  description: `${newTilesData.length} new tile(s) have been added to the palette.`,
              });
          }
      });
  }, [setProjectState, toast]);

  const loadProject = useCallback((id: string) => {
      setProjects(projs => {
          const projectToLoad = projs.find(p => p.id === id);
          if (projectToLoad) {
              setCurrentProjectId(id);
              resetHistory({ grid: projectToLoad.grid, tiles: projectToLoad.tiles });
          } else {
              toast({ variant: 'destructive', title: 'Load Error', description: 'Could not find the selected project.' });
          }
          return projs;
      });
  }, [toast, resetHistory]);

  const saveProject = useCallback((name: string) => {
    const newProject: Project = {
        ...createNewProject(name),
        ...projectState,
    };
    setProjects(projs => [...projs, newProject]);
    setCurrentProjectId(newProject.id); // Switch to the new project
  }, [projectState]);

  const deleteProject = useCallback((id: string) => {
    const isDeletingCurrent = id === currentProjectId;
    
    setProjects(projs => {
      const remainingProjects = projs.filter(p => p.id !== id);
      
      if (remainingProjects.length === 0) {
        const defaultProject = createNewProject('New Project');
        if(isDeletingCurrent) {
            setCurrentProjectId(defaultProject.id);
            resetHistory({ grid: defaultProject.grid, tiles: defaultProject.tiles });
        }
        return [defaultProject];
      }
      
      if (isDeletingCurrent) {
        const nextProjectToLoad = remainingProjects.sort((a,b) => b.lastModified - a.lastModified)[0];
        setCurrentProjectId(nextProjectToLoad.id);
        resetHistory({ grid: nextProjectToLoad.grid, tiles: nextProjectToLoad.tiles });
      }
      
      return remainingProjects;
    });

    toast({ title: 'Project Deleted'});

  }, [currentProjectId, toast, resetHistory]);

  const renameProject = useCallback((id: string, newName: string) => {
    setProjects(projs => projs.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p));
  }, []);
  
  const currentProject = projects.find(p => p.id === currentProjectId);

  return {
    projects,
    currentProject: {
      id: currentProject?.id || '',
      name: currentProject?.name || 'Untitled',
      lastModified: currentProject?.lastModified || 0,
      grid: projectState.grid,
      tiles: projectState.tiles,
    },
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
