
import { useState, useEffect, useCallback } from 'react';
import type { Project, GridState, Tile, ProjectsState, TileImportData, Layer } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useHistoryState } from './use-history-state';
import { isTileTransparent } from '@/lib/utils';

const STORAGE_KEY = 'tileforge-projects';
const INITIAL_GRID_SIZE = 32;

const createNewLayer = (name: string, grid: GridState): Layer => ({
    id: `layer_${new Date().getTime()}_${Math.random()}`,
    name,
    grid,
    isVisible: true,
});

const createEmptyGrid = (width: number, height: number): GridState =>
  Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

const createNewProject = (name: string): Project => {
    const defaultLayer = createNewLayer("Background", createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE));
    return {
      id: `proj_${new Date().getTime()}_${Math.random()}`,
      name,
      layers: [defaultLayer],
      activeLayerId: defaultLayer.id,
      tiles: [{ id: 0, name: 'Empty', src: '', solid: false }],
      lastModified: Date.now(),
    };
};

// This function migrates an old project structure to the new layered structure
const migrateProject = (project: Project): Project => {
    if (project.layers && project.layers.length > 0 && project.activeLayerId) {
        return project; // Already has layers, no migration needed
    }
    // This part of migration logic is now obsolete as we remove the grid property
    // but we keep it just in case an old project format is still in localStorage
    // from before this cleanup.
    // @ts-ignore
    const gridToMigrate = project.grid || createEmptyGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
    const firstLayer = createNewLayer("Background", gridToMigrate);
    const { grid, ...retypedProject } = project;
    return {
        ...retypedProject,
        layers: [firstLayer],
        activeLayerId: firstLayer.id,
    };
};


export const useProjects = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const {
    state,
    set: setProjectState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistoryState<ProjectsState>({ projects: [], currentProjectId: null });

  const { projects, currentProjectId } = state;

  const currentProject = projects.find(p => p.id === currentProjectId) || createNewProject("Loading...");

  useEffect(() => {
    setIsLoading(true);
    let savedState: ProjectsState | null = null;
    try {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
            savedState = JSON.parse(savedData) as ProjectsState;
        } catch (e) {
            console.error("Could not parse projects from localStorage", e);
            toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load saved projects due to corrupted data. Starting fresh.'});
        }
      }

      if (savedState && Array.isArray(savedState.projects) && savedState.projects.length > 0 && savedState.currentProjectId) {
         
         const migratedProjects = savedState.projects.map(migrateProject);

         let projectToLoad = migratedProjects.find(p => p.id === savedState.currentProjectId);
         
         if (!projectToLoad) {
            projectToLoad = [...migratedProjects].sort((a,b) => b.lastModified - a.lastModified)[0];
         }
         
         resetHistory({
           projects: migratedProjects,
           currentProjectId: projectToLoad.id,
         });
      } else {
         const defaultProject = createNewProject('New Project');
         resetHistory({ projects: [defaultProject], currentProjectId: defaultProject.id });
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      toast({ variant: 'destructive', title: 'Load Error', description: 'Could not load your saved projects.' });
      const defaultProject = createNewProject('New Project');
      resetHistory({ projects: [defaultProject], currentProjectId: defaultProject.id });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && state.projects.length > 0) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save projects to localStorage", error);
        }
    }
  }, [state, isLoading]);

  const modifyCurrentProject = useCallback((modifier: (project: Project) => Partial<Project>, batch = false) => {
    setProjectState(currentState => {
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
  }, [setProjectState]);
  
  const updateGridInLayer = useCallback((layerId: string, grid: GridState, batch = false) => {
      modifyCurrentProject(project => {
        const newLayers = project.layers.map(l => l.id === layerId ? {...l, grid} : l);
        return { layers: newLayers };
      }, batch);
  }, [modifyCurrentProject]);


  const remapGrid = useCallback((remap: { [oldId: number]: number }) => {
    modifyCurrentProject(project => {
        const newLayers = project.layers.map(layer => ({
            ...layer,
            grid: layer.grid.map(row => 
                row.map(cell => remap[cell] ?? cell)
            )
        }));
        return { layers: newLayers };
    });
  }, [modifyCurrentProject]);

  const updateTiles = useCallback((tiles: Tile[], batch = false) => {
      modifyCurrentProject(() => ({ tiles }), batch);
  }, [modifyCurrentProject]);
  
  const addTiles = useCallback(async (tileData: TileImportData[]) => {
    if (tileData.length === 0) return;

    const readFiles = tileData.map(data => {
        return new Promise<{name: string, src: string, solid: boolean} | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
            const src = e.target?.result as string;
            if (await isTileTransparent(src)) {
                resolve(null);
            } else {
                const name = data.file.name.replace(/\.[^/.]+$/, "");
                resolve({ name, src, solid: data.isSolid });
            }
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(data.file);
        });
    });

    const results = await Promise.all(readFiles);
    const newTilesData = results.filter((r): r is {name: string, src: string, solid: boolean} => r !== null);
    
    const skippedCount = tileData.length - newTilesData.length;
    if (skippedCount > 0) {
    toast({
        title: 'Transparent Tiles Skipped',
        description: `${skippedCount} tile(s) were fully transparent and have been ignored.`,
    });
    }

    if (newTilesData.length > 0) {
        setProjectState(currentState => {
        const currentProject = currentState.projects.find(p => p.id === currentState.currentProjectId);
        if (!currentProject) return currentState;

        let nextId = currentProject.tiles.length > 0 ? Math.max(...currentProject.tiles.map(t => t.id)) + 1 : 1;
        const tilesWithIds: Tile[] = newTilesData.map((tile) => ({
            id: nextId++,
            name: tile.name,
            src: tile.src,
            solid: tile.solid,
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
  }, [setProjectState, toast]);

    const deleteTile = useCallback((tileId: number) => {
        modifyCurrentProject(project => {
            const newTiles = project.tiles.filter(t => t.id !== tileId);
            const newLayers = project.layers.map(layer => ({
                ...layer,
                grid: layer.grid.map(row => row.map(cell => (cell === tileId ? 0 : cell)))
            }));
            return { tiles: newTiles, layers: newLayers };
        });
    }, [modifyCurrentProject]);


  const loadProject = useCallback((id: string) => {
    resetHistory({
        projects: state.projects,
        currentProjectId: id,
    });
  }, [resetHistory, state.projects]);

  const saveProject = useCallback((name: string) => {
    setProjectState(currentState => {
        const current = currentState.projects.find(p => p.id === currentState.currentProjectId);
        if (!current) return currentState;

        const newProject: Project = {
          id: `proj_${new Date().getTime()}_${Math.random()}`,
          name,
          layers: JSON.parse(JSON.stringify(current.layers)),
          activeLayerId: current.activeLayerId,
          tiles: JSON.parse(JSON.stringify(current.tiles)),
          lastModified: Date.now(),
        };

        return {
            ...currentState,
            projects: [...currentState.projects, newProject],
        }
    });
    toast({ title: 'Project Saved!', description: `"${name}" has been saved.`});
  }, [setProjectState, toast]);

  const deleteProject = useCallback((id: string) => {
    const remainingProjects = projects.filter(p => p.id !== id);
    
    if (remainingProjects.length === 0) {
        const newDefault = createNewProject('New Project');
        resetHistory({ projects: [newDefault], currentProjectId: newDefault.id });
    } else {
        let newCurrentId = currentProjectId;
        if (currentProjectId === id) {
            const sortedProjects = [...remainingProjects].sort((a,b) => b.lastModified - a.lastModified);
            newCurrentId = sortedProjects[0].id;
        }
        resetHistory({ projects: remainingProjects, currentProjectId: newCurrentId! });
    }
    toast({ title: 'Project Deleted'});
  }, [projects, currentProjectId, resetHistory, toast]);

  const renameProject = useCallback((id: string, newName: string) => {
    setProjectState(currentState => ({
        ...currentState,
        projects: currentState.projects.map(p => p.id === id ? { ...p, name: newName, lastModified: Date.now() } : p),
    }));
  }, [setProjectState]);
  
    // Layer Management
  const addLayer = useCallback(() => {
    modifyCurrentProject(project => {
        const { width, height } = project.layers[0] ? { width: project.layers[0].grid[0].length, height: project.layers[0].grid.length } : { width: INITIAL_GRID_SIZE, height: INITIAL_GRID_SIZE };
        const newLayer = createNewLayer(`Layer ${project.layers.length + 1}`, createEmptyGrid(width, height));
        return { 
            layers: [...project.layers, newLayer],
            activeLayerId: newLayer.id,
        };
    });
  }, [modifyCurrentProject]);

  const deleteLayer = useCallback((layerId: string) => {
    modifyCurrentProject(project => {
        if (project.layers.length <= 1) {
            toast({ variant: 'destructive', title: 'Cannot Delete', description: 'You must have at least one layer.' });
            return {};
        }
        const newLayers = project.layers.filter(l => l.id !== layerId);
        let newActiveLayerId = project.activeLayerId;
        if (project.activeLayerId === layerId) {
            newActiveLayerId = newLayers[newLayers.length - 1]?.id ?? null;
        }
        return { layers: newLayers, activeLayerId: newActiveLayerId };
    });
  }, [modifyCurrentProject, toast]);
  
  const selectLayer = useCallback((layerId: string) => {
    modifyCurrentProject(() => ({ activeLayerId: layerId }));
  }, [modifyCurrentProject]);

  const renameLayer = useCallback((layerId: string, newName: string) => {
    modifyCurrentProject(project => ({
        layers: project.layers.map(l => l.id === layerId ? { ...l, name: newName } : l)
    }));
  }, [modifyCurrentProject]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    modifyCurrentProject(project => ({
        layers: project.layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l)
    }), true); // Batch update for visibility toggle
  }, [modifyCurrentProject]);

  const reorderLayers = useCallback((newLayers: Layer[]) => {
      modifyCurrentProject(() => ({ layers: newLayers }));
  }, [modifyCurrentProject]);

  const mergeAllLayers = useCallback(() => {
    modifyCurrentProject(project => {
        const visibleLayers = project.layers.filter(l => l.isVisible);
        if (visibleLayers.length <= 1) {
            toast({ title: 'Merge Skipped', description: 'You need at least two visible layers to merge.' });
            return {};
        }

        // Start with a deep copy of the bottom-most visible layer's grid
        const baseLayer = visibleLayers[0];
        const mergedGrid = JSON.parse(JSON.stringify(baseLayer.grid));

        // Iterate from the second layer upwards (index 1 to end)
        for (let i = 1; i < visibleLayers.length; i++) {
            const upperLayer = visibleLayers[i];
            for (let r = 0; r < upperLayer.grid.length; r++) {
                for (let c = 0; c < upperLayer.grid[r].length; c++) {
                    // If the tile on the upper layer is not empty, it overwrites the one below
                    if (upperLayer.grid[r][c] !== 0) {
                        mergedGrid[r][c] = upperLayer.grid[r][c];
                    }
                }
            }
        }
        
        const mergedLayer = createNewLayer("Merged Layer", mergedGrid);

        return {
            layers: [mergedLayer],
            activeLayerId: mergedLayer.id,
        };
    });
  }, [modifyCurrentProject, toast]);

    const clearAllLayers = useCallback((width: number, height: number) => {
        modifyCurrentProject((project) => {
            const newGrid = createEmptyGrid(width, height);
            const clearedLayers = project.layers.map(layer => ({ ...layer, grid: newGrid }));
            return { layers: clearedLayers };
        });
    }, [modifyCurrentProject]);


  return {
    projects,
    currentProject,
    isLoading,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    updateGridInLayer,
    remapGrid,
    updateTiles,
    addTiles,
    deleteTile,
    undo,
    redo,
    canUndo,
    canRedo,
    // Layer actions
    addLayer,
    deleteLayer,
    selectLayer,
    renameLayer,
    toggleLayerVisibility,
    reorderLayers,
    mergeAllLayers,
    clearAllLayers,
  };
};
