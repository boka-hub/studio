import { useState, useEffect, useCallback } from 'react';
import type { Project, GridState, Tile, ProjectState } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useHistoryState } from './use-history-state';

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
    try {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { projects: savedProjects, last_active_project_id: lastActiveId } = JSON.parse(savedData);
        if (Array.isArray(savedProjects) && savedProjects.length > 0) {
          setProjects(savedProjects);
          const projectToLoad = savedProjects.find(p => p.id === lastActiveId) || savedProjects[0];
          setCurrentProjectId(projectToLoad.id);
          resetHistory({ grid: projectToLoad.grid, tiles: projectToLoad.tiles });
        } else {
           // No projects, create a default one
          const defaultProject = createNewProject('TileForge');
          setProjects([defaultProject]);
          setCurrentProjectId(defaultProject.id);
          resetHistory({ grid: defaultProject.grid, tiles: defaultProject.tiles });
        }
      } else {
        // No saved data at all, create a default project
        const defaultProject = createNewProject('TileForge');
        setProjects([defaultProject]);
        setCurrentProjectId(defaultProject.id);
        resetHistory({ grid: defaultProject.grid, tiles: defaultProject.tiles });
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('TileForge');
      setProjects([defaultProject]);
      setCurrentProjectId(defaultProject.id);
      resetHistory({ grid: defaultProject.grid, tiles: defaultProject.tiles });
    } finally {
      setIsLoading(false);
    }
  }, [toast, resetHistory]);
  
  const currentProject = projects.find(p => p.id === currentProjectId);

  // Save projects to localStorage whenever the project state changes
  useEffect(() => {
    if (isLoading || !currentProjectId) return;
    
    setProjects(projs => projs.map(p => 
      p.id === currentProjectId ? { ...p, ...projectState, lastModified: Date.now() } : p
    ));

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
      setProjectState({ ...projectState, grid }, batch);
  }, [projectState, setProjectState]);

  const updateTiles = useCallback((tiles: Tile[], batch = false) => {
      setProjectState({ ...projectState, tiles }, batch);
  }, [projectState, setProjectState]);


  const loadProject = useCallback((id: string) => {
    const projectToLoad = projects.find(p => p.id === id);
    if (projectToLoad) {
      setCurrentProjectId(id);
      resetHistory({ grid: projectToLoad.grid, tiles: projectToLoad.tiles });
    } else {
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not find the selected project.' });
    }
  }, [projects, toast, resetHistory]);

  const saveProject = useCallback((name: string) => {
    const newProject: Project = {
        ...createNewProject(name),
        ...projectState,
    };
    setProjects(projs => [...projs, newProject]);
    setCurrentProjectId(newProject.id); // Switch to the new project
  }, [projectState]);

  const deleteProject = useCallback((id: string) => {
    setProjects(projs => {
      const newProjects = projs.filter(p => p.id !== id);
      if (newProjects.length === 0) {
        const defaultProject = createNewProject('TileForge');
        setCurrentProjectId(defaultProject.id);
        resetHistory(createInitialState());
        return [defaultProject];
      }
      if (id === currentProjectId) {
        // If we deleted the current project, switch to the most recently modified one
        const nextProject = newProjects.sort((a,b) => b.lastModified - a.lastModified)[0];
        loadProject(nextProject.id);
      }
      return newProjects;
    });
    toast({ title: 'Project Deleted'});
  }, [currentProjectId, toast, loadProject, resetHistory]);

  const renameProject = useCallback((id: string, newName: string) => {
    setProjects(projs => projs.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p));
  }, []);

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
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

    