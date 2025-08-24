
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

  const currentProject = useMemo(() => {
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (project) {
        return project;
    }
    // Return a temporary, minimal project object during initial load to prevent errors
    if (isLoading) {
        return createNewProject("Loading...");
    }
    // If no project is found after loading, create a new one. This is a fallback.
    const newProject = createNewProject('New Project');
    // We shouldn't directly set state here as it's a side effect.
    // This will be handled by the main useEffect.
    return newProject;
  }, [state.projects, state.currentProjectId, isLoading]);


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

      if (savedState && Array.isArray(savedState.projects) && savedState.projects.length > 0 && savedState.currentProjectId) {
        const projectToLoad = savedState.projects.find(p => p.id === savedState.currentProjectId) || [...savedState.projects].sort((a, b) => b.lastModified - a.lastModified)[0];
        setState({
          projects: savedState.projects,
          currentProjectId: projectToLoad.id,
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

  useEffect(() => {
    if (!isLoading && state.projects.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoading]);

  const saveProject = useCallback((projectToSave: Project) => {
    setState(currentState => {
      const existingProjectIndex = currentState.projects.findIndex(p => p.id === projectToSave.id);
      let newProjects;

      if (existingProjectIndex > -1) {
        newProjects = [...currentState.projects];
        newProjects[existingProjectIndex] = { ...projectToSave, lastModified: Date.now() };
      } else {
        newProjects = [...currentState.projects, projectToSave];
      }

      return {
        ...currentState,
        projects: newProjects,
        currentProjectId: projectToSave.id,
      };
    });
  }, []);
  
  const setCurrentProjectById = useCallback((id: string) => {
    const project = state.projects.find(p => p.id === id);
    if(project) {
        setState(currentState => ({
            ...currentState,
            currentProjectId: id,
        }));
        toast({ title: 'Project Loaded', description: `Successfully loaded "${project.name}".`});
    } else {
        toast({ variant: 'destructive', title: 'Load Failed', description: 'Could not find the selected project.' });
    }
  }, [state.projects, toast]);

  const deleteProject = useCallback((id: string) => {
    setState(currentState => {
      const remainingProjects = currentState.projects.filter(p => p.id !== id);
      if (remainingProjects.length === 0) {
        const newDefault = createNewProject('New Project');
        return { projects: [newDefault], currentProjectId: newDefault.id };
      }
      const newCurrentId = currentState.currentProjectId === id
        ? [...remainingProjects].sort((a, b) => b.lastModified - a.lastModified)[0].id
        : currentState.currentProjectId;
      return { projects: remainingProjects, currentProjectId: newCurrentId };
    });
    toast({ title: 'Project Deleted' });
  }, [toast]);

  const renameProject = useCallback((id: string, newName: string) => {
    setState(currentState => ({
      ...currentState,
      projects: currentState.projects.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p),
    }));
  }, []);

  return {
    projects: state.projects,
    currentProjectId: state.currentProjectId,
    currentProject,
    isLoading,
    saveProject,
    deleteProject,
    renameProject,
    setCurrentProjectById,
  };
};
