
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Save, Trash2, Edit, Check, X, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId: string;
  onLoadProject: (id: string) => void;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onRenameProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSave = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Project name cannot be empty.' });
      return;
    }
    if (projects.some(p => p.name === trimmedName)) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'A project with that name already exists.' });
      return;
    }
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    const newProject: Project = {
        ...JSON.parse(JSON.stringify(currentProject)),
        id: `proj_${new Date().getTime()}_${Math.random()}`,
        name: trimmedName,
        lastModified: Date.now(),
    };
    
    onSaveProject(newProject);
    setNewProjectName('');
    toast({ title: 'Project Saved!', description: `"${trimmedName}" has been saved.`});
  };

  const handleLoad = (id: string) => {
    setLoadingProjectId(id);
    onLoadProject(id);
  };

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditingName('');
  };

  const confirmRename = () => {
    if (!editingProjectId) return;
    
    const trimmedName = editingName.trim();
    if (!trimmedName) {
       toast({ variant: 'destructive', title: 'Rename Failed', description: 'Project name cannot be empty.' });
       return;
    }
    
    // Check if another project (not the one being edited) already has the new name
    if (projects.some(p => p.id !== editingProjectId && p.name === trimmedName)) {
        toast({ variant: 'destructive', title: 'Rename Failed', description: 'Another project already has that name.' });
        return;
    }

    onRenameProject(editingProjectId, trimmedName);
    toast({ title: 'Project Renamed', description: `Project has been renamed to "${trimmedName}".`});
    cancelEditing();
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
          <DialogDescription>
            Save, load, and manage your TileForge projects. All data is stored in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-full -mx-6 px-6">
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saved Projects List */}
            <div className="flex flex-col gap-2 h-full">
              <h3 className="font-semibold text-muted-foreground px-1">Saved Projects</h3>
              <ScrollArea className="border rounded-md flex-grow">
                <div className="p-2 space-y-1">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className={cn(
                          "flex items-center justify-between p-2 rounded-md",
                          project.id === currentProjectId && "bg-muted font-semibold",
                      )}
                    >
                    {editingProjectId === project.id ? (
                        <div className="flex-grow flex items-center gap-1">
                          <Input 
                              value={editingName} 
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') confirmRename();
                                  if (e.key === 'Escape') cancelEditing();
                              }}
                              className="h-8"
                              autoFocus
                              onFocus={(e) => e.target.select()}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={confirmRename}><Check className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                        </div>
                    ) : (
                      <>
                          <span className="truncate flex-grow">{project.name}</span>
                          <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(project)}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={project.id === currentProjectId}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                      <AlertDialogTitle>Delete &quot;{project.name}&quot;?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This will permanently delete this project. This action cannot be undone.
                                      </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteProject(project.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                              <Button 
                                  size="sm" 
                                  className="h-8" 
                                  onClick={() => handleLoad(project.id)} 
                                  disabled={project.id === currentProjectId || loadingProjectId === project.id}
                              >
                                  {loadingProjectId === project.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Load
                              </Button>
                          </div>
                      </>
                    )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {/* Save New Project */}
            <div className="flex flex-col gap-4 p-4 border rounded-md bg-muted/50">
              <div className="space-y-2">
                  <h3 className="font-semibold">Save Current Project</h3>
                  <p className="text-sm text-muted-foreground">Save your current map and tile palette as a new project.</p>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="new-project-name">Project Name</Label>
                  <Input
                  id="new-project-name"
                  placeholder="My Awesome Map"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
              </div>
              <Button onClick={handleSave} disabled={!newProjectName.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Save New Project
              </Button>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
