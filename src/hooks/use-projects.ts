
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, ProjectsState } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = 'tileforge-projects';
const INITIAL_GRID_SIZE = 32;

const createNewProject = (name: string): Project => {
    const defaultLayer = {
        id: `layer_${new Date().getTime()}_${Math.random()}`,
        name: "Background",
        grid: Array(INITIAL_GRID_SIZE).fill(null).map(() => Array(INITIAL_GRID_SIZE).fill(0)),
        isVisible: true,
    };
    return {
      id: `proj_${new Date().getTime()}_${Math.random()}`,
      name,
      layers: [defaultLayer],
      activeLayerId: defaultLayer.id,
      tiles: [{ id: 0, name: 'Empty', src: '', solid: false, metadata: {} }],
      lastModified: Date.now(),
    };
};

export const useProjects = () => {
  const [state, setState] = useState<ProjectsState>({ projects: [], currentProjectId: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    let loadedState: ProjectsState | null = null;
    try {
        const savedData = window.localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            loadedState = JSON.parse(savedData);
        }
    } catch (e) {
        console.error("Could not parse projects from localStorage", e);
        toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load saved projects due to corrupted data.' });
    }

    if (loadedState && Array.isArray(loadedState.projects) && loadedState.projects.length > 0) {
        const sortedProjects = [...loadedState.projects].sort((a, b) => b.lastModified - a.lastModified);
        const projectToLoadId = loadedState.currentProjectId && loadedState.projects.some(p => p.id === loadedState.currentProjectId)
            ? loadedState.currentProjectId
            : sortedProjects[0].id;
        
        setState({
          projects: loadedState.projects,
          currentProjectId: projectToLoadId,
        });
    } else {
        const defaultProject = createNewProject('New Project');
        setState({ projects: [defaultProject], currentProjectId: defaultProject.id });
    }
    setIsLoading(false);
  }, [toast]);

  const saveStateToLocalStorage = useCallback((newState: ProjectsState) => {
    // Prevent saving during initial load before state is stable
    if (isLoading) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, [isLoading]);

  const saveProject = useCallback((projectToSave: Project) => {
    if (!projectToSave) return;
    setState(currentState => {
      const existingProjectIndex = currentState.projects.findIndex(p => p.id === projectToSave.id);
      let newProjects;

      if (existingProjectIndex > -1) {
        newProjects = [...currentState.projects];
        newProjects[existingProjectIndex] = { ...projectToSave, lastModified: Date.now() };
      } else {
        newProjects = [...currentState.projects, { ...projectToSave, lastModified: Date.now() }];
      }
      
      const newState = { ...currentState, projects: newProjects };
      saveStateToLocalStorage(newState);
      return newState;
    });
  }, [saveStateToLocalStorage]);
  
  const setCurrentProjectById = useCallback((id: string) => {
    setState(currentState => {
        const projectExists = currentState.projects.some(p => p.id === id);
        if (projectExists) {
            const newState = { ...currentState, currentProjectId: id };
            saveStateToLocalStorage(newState);
            const projectName = currentState.projects.find(p => p.id === id)?.name;
            toast({ title: 'Project Loaded', description: `Successfully loaded "${projectName}".`});
            return newState;
        }
        toast({ variant: 'destructive', title: 'Load Failed', description: 'Could not find the selected project.' });
        return currentState;
    });
  }, [saveStateToLocalStorage, toast]);

  const deleteProject = useCallback((id: string) => {
    setState(currentState => {
      const projectToDelete = currentState.projects.find(p => p.id === id);
      if (!projectToDelete) return currentState;

      const remainingProjects = currentState.projects.filter(p => p.id !== id);
      
      let newState: ProjectsState;
      if (remainingProjects.length === 0) {
        const newDefault = createNewProject('New Project');
        newState = { projects: [newDefault], currentProjectId: newDefault.id };
      } else {
        let newCurrentId = currentState.currentProjectId;
        if (currentState.currentProjectId === id) {
            // Sort by most recently modified to find the best next project to load
            const sorted = [...remainingProjects].sort((a,b) => b.lastModified - a.lastModified);
            newCurrentId = sorted[0].id;
        }
        newState = { projects: remainingProjects, currentProjectId: newCurrentId };
      }
      
      saveStateToLocalStorage(newState);
      toast({ title: 'Project Deleted', description: `"${projectToDelete.name}" has been deleted.` });
      return newState;
    });
  }, [saveStateToLocalStorage, toast]);

  const renameProject = useCallback((id: string, newName: string) => {
    setState(currentState => {
      const newState = {
        ...currentState,
        projects: currentState.projects.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p),
      };
      saveStateToLocalStorage(newState);
      return newState;
    });
  }, [saveStateToLocalStorage]);

  return {
    projects: state.projects,
    currentProjectId: state.currentProjectId,
    isLoading,
    saveProject,
    deleteProject,
    renameProject,
    setCurrentProjectById,
  };
};
