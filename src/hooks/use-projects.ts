
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
    try {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      let savedState: ProjectsState | null = null;
      if (savedData) {
        try {
          savedState = JSON.parse(savedData);
        } catch (e) {
          console.error("Could not parse projects from localStorage", e);
          toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load saved projects due to corrupted data.' });
        }
      }

      if (savedState && Array.isArray(savedState.projects) && savedState.projects.length > 0) {
        // Sort by most recently modified to find the default project to load
        const sortedProjects = [...savedState.projects].sort((a, b) => b.lastModified - a.lastModified);
        const projectToLoadId = savedState.currentProjectId && savedState.projects.some(p => p.id === savedState.currentProjectId)
            ? savedState.currentProjectId
            : sortedProjects[0].id;
        
        setState({
          projects: savedState.projects,
          currentProjectId: projectToLoadId,
        });

      } else {
        const defaultProject = createNewProject('New Project');
        setState({ projects: [defaultProject], currentProjectId: defaultProject.id });
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      const defaultProject = createNewProject('New Project');
      setState({ projects: [defaultProject], currentProjectId: defaultProject.id });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveStateToLocalStorage = useCallback((newState: ProjectsState) => {
    if (!isLoading) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    }
  }, [isLoading]);

  const saveProject = useCallback((projectToSave: Project) => {
    setState(currentState => {
      const existingProjectIndex = currentState.projects.findIndex(p => p.id === projectToSave.id);
      let newProjects;

      if (existingProjectIndex > -1) {
        newProjects = [...currentState.projects];
        newProjects[existingProjectIndex] = projectToSave;
      } else {
        newProjects = [...currentState.projects, projectToSave];
      }
      
      const newState = {
        ...currentState,
        projects: newProjects,
        currentProjectId: projectToSave.id,
      };
      saveStateToLocalStorage(newState);
      return newState;
    });
  }, [saveStateToLocalStorage]);
  
  const setCurrentProjectById = useCallback((id: string) => {
    const projectExists = state.projects.some(p => p.id === id);
    if(projectExists) {
        setState(currentState => {
            const newState = {
                ...currentState,
                currentProjectId: id,
            };
            saveStateToLocalStorage(newState);
            return newState;
        });
        const projectName = state.projects.find(p => p.id === id)?.name;
        toast({ title: 'Project Loaded', description: `Successfully loaded "${projectName}".`});
    } else {
        toast({ variant: 'destructive', title: 'Load Failed', description: 'Could not find the selected project.' });
    }
  }, [state.projects, saveStateToLocalStorage, toast]);

  const deleteProject = useCallback((id: string) => {
    setState(currentState => {
      const remainingProjects = currentState.projects.filter(p => p.id !== id);
      
      if (remainingProjects.length === 0) {
        const newDefault = createNewProject('New Project');
        const newState = { projects: [newDefault], currentProjectId: newDefault.id };
        saveStateToLocalStorage(newState);
        return newState;
      }
      
      const newCurrentId = currentState.currentProjectId === id
        ? [...remainingProjects].sort((a, b) => b.lastModified - a.lastModified)[0].id
        : currentState.currentProjectId;
      
      const newState = { projects: remainingProjects, currentProjectId: newCurrentId };
      saveStateToLocalStorage(newState);
      return newState;
    });
    toast({ title: 'Project Deleted' });
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
