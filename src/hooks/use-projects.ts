import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, GridState, Tile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = 'tileforge-projects';
const INITIAL_GRID_SIZE = 32;

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

const initialGrid = createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
const initialTiles: Tile[] = [{ id: 0, name: 'Empty', src: '', solid: false }];

const createNewProject = (name: string, grid?: GridState, tiles?: Tile[]): Project => ({
  id: `proj_${new Date().getTime()}_${Math.random()}`,
  name,
  grid: grid || initialGrid,
  tiles: tiles || initialTiles,
  lastModified: Date.now(),
});


export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isMounted = useRef(false);

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
        } else {
           // No projects, create a default one
          const defaultProject = createNewProject('TileForge');
          setProjects([defaultProject]);
          setCurrentProjectId(defaultProject.id);
        }
      } else {
        // No saved data at all, create a default project
        const defaultProject = createNewProject('TileForge');
        setProjects([defaultProject]);
        setCurrentProjectId(defaultProject.id);
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('TileForge');
      setProjects([defaultProject]);
      setCurrentProjectId(defaultProject.id);
    } finally {
      setIsLoading(false);
      isMounted.current = true;
    }
  }, [toast]);
  

  // Save projects to localStorage whenever they change
  useEffect(() => {
    // Prevent saving on the initial, empty render
    if (!isMounted.current || isLoading) return;

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
  
  const currentProject = projects.find(p => p.id === currentProjectId) || createNewProject("Untitled");

  const updateCurrentProject = useCallback((updates: Partial<Omit<Project, 'id'>>) => {
    if (!currentProjectId) return;
    setProjects(projs => projs.map(p => 
      p.id === currentProjectId ? { ...p, ...updates, lastModified: Date.now() } : p
    ));
  }, [currentProjectId]);

  const updateGrid = useCallback((grid: GridState) => {
      updateCurrentProject({ grid });
  }, [updateCurrentProject]);

  const updateTiles = useCallback((tiles: Tile[]) => {
      updateCurrentProject({ tiles });
  }, [updateCurrentProject]);


  const loadProject = useCallback((id: string) => {
    const projectToLoad = projects.find(p => p.id === id);
    if (projectToLoad) {
      setCurrentProjectId(id);
    } else {
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not find the selected project.' });
    }
  }, [projects, toast]);

  const saveProject = useCallback((name: string) => {
    const newProject = createNewProject(name, currentProject.grid, currentProject.tiles);
    setProjects(projs => [...projs, newProject]);
    setCurrentProjectId(newProject.id); // Switch to the new project
  }, [currentProject]);

  const deleteProject = useCallback((id: string) => {
    setProjects(projs => {
      const newProjects = projs.filter(p => p.id !== id);
      if (newProjects.length === 0) {
        const defaultProject = createNewProject('TileForge');
        setCurrentProjectId(defaultProject.id);
        return [defaultProject];
      }
      if (id === currentProjectId) {
        // If we deleted the current project, switch to the most recently modified one
        const nextProject = newProjects.sort((a,b) => b.lastModified - a.lastModified)[0];
        setCurrentProjectId(nextProject.id);
      }
      return newProjects;
    });
    toast({ title: 'Project Deleted'});
  }, [currentProjectId, toast]);

  const renameProject = useCallback((id: string, newName: string) => {
    setProjects(projs => projs.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p));
  }, []);

  return {
    projects,
    currentProject,
    isLoading,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    updateGrid,
    updateTiles,
  };
};
