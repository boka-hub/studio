
import { useState, useEffect, useCallback } from 'react';
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
      tiles: [{ id: 0, name: 'Empty', src: '', solid: false }],
      lastModified: Date.now(),
    };
};

export const useProjects = () => {
  const [state, setState] = useState<ProjectsState>({ projects: [], currentProjectId: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentProject = state.projects.find(p => p.id === state.currentProjectId) || createNewProject("Loading...");

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

  const setCurrentProject = useCallback((project: Project) => {
    setState(currentState => ({
      ...currentState,
      projects: currentState.projects.map(p => p.id === project.id ? project : p),
    }));
  }, []);

  const loadProject = useCallback((id: string) => {
    setState(currentState => ({
      ...currentState,
      currentProjectId: id,
    }));
  }, []);

  const saveProject = useCallback((name: string) => {
    setState(currentState => {
      const current = currentState.projects.find(p => p.id === currentState.currentProjectId);
      if (!current) return currentState;
      const newProject: Project = {
        ...JSON.parse(JSON.stringify(current)),
        id: `proj_${new Date().getTime()}_${Math.random()}`,
        name,
        lastModified: Date.now(),
      };
      return { ...currentState, projects: [...currentState.projects, newProject] };
    });
    toast({ title: 'Project Saved!', description: `"${name}" has been saved.` });
  }, [toast]);

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
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    setCurrentProject,
  };
};
