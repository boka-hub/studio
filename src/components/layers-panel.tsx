
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layer } from '@/lib/types';
import { PlusCircle, Eye, EyeOff, Trash2, Edit, Check, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onRenameLayer: (id: string, newName: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorderLayers: (layers: Layer[]) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onRenameLayer,
  onToggleVisibility,
  onReorderLayers,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  const dragTargetRef = useRef<HTMLDivElement | null>(null);

  const startEditing = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const cancelEditing = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const confirmRename = () => {
    if (!editingLayerId || !editingName.trim()) {
      cancelEditing();
      return;
    }
    onRenameLayer(editingLayerId, editingName.trim());
    cancelEditing();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, layerId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLayerId(layerId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const targetElement = e.currentTarget as HTMLDivElement;
    if (targetElement !== dragTargetRef.current) {
        if (dragTargetRef.current) {
            dragTargetRef.current.style.borderBottom = '';
            dragTargetRef.current.style.borderTop = '';
        }
        dragTargetRef.current = targetElement;
    }
    
    const rect = targetElement.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;

    targetElement.style.borderTop = isAfter ? '' : '2px solid hsl(var(--primary))';
    targetElement.style.borderBottom = isAfter ? '2px solid hsl(var(--primary))' : '';
  };

  const handleDragLeave = () => {
     if (dragTargetRef.current) {
        dragTargetRef.current.style.borderBottom = '';
        dragTargetRef.current.style.borderTop = '';
        dragTargetRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropLayerId: string) => {
    e.preventDefault();

    if (draggedLayerId === null || draggedLayerId === dropLayerId) {
      handleDragLeave();
      setDraggedLayerId(null);
      return;
    }
    
    const displayLayers = [...layers].reverse();
    const draggedIndex = displayLayers.findIndex(l => l.id === draggedLayerId);
    const dropTargetIndex = displayLayers.findIndex(l => l.id === dropLayerId);

    const reordered = Array.from(displayLayers);
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    
    // Adjust index for splice
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    const finalDropIndex = isAfter ? dropTargetIndex + 1 : dropTargetIndex;

    reordered.splice(finalDropIndex, 0, draggedItem);
    
    // Convert back to original storage order (reverse of display order)
    onReorderLayers(reordered.reverse());
    handleDragLeave();
    setDraggedLayerId(null);
  };

  const handleDragEnd = () => {
    handleDragLeave();
    setDraggedLayerId(null);
  };

  // Layers are rendered from top to bottom, but z-index wise they go from bottom to top.
  // We reverse the array for display so that the "top" layer (rendered last) is at the top of the list.
  const displayLayers = [...layers].reverse();

  return (
    <div className="px-2 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Layers</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddLayer}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-48 border rounded-md">
        <div className="p-1 space-y-1">
          {displayLayers.map(layer => (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center p-1.5 rounded-md cursor-pointer transition-all border-y-2 border-transparent',
                activeLayerId === layer.id && 'bg-secondary hover:bg-secondary',
                draggedLayerId === layer.id ? 'opacity-50' : 'opacity-100'
              )}
              onClick={() => onSelectLayer(layer.id)}
            >
              <GripVertical className="h-4 w-4 mr-2 text-muted-foreground cursor-move" />
             {editingLayerId === layer.id ? (
                <div className="flex-grow flex items-center gap-1">
                    <Input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRename();
                            if (e.key === 'Escape') cancelEditing();
                        }}
                        className="h-7"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={confirmRename}><Check className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                </div>
              ) : (
                <>
                    <span className="text-sm truncate flex-grow" onDoubleClick={() => startEditing(layer)}>
                        {layer.name}
                    </span>
                    <div className="flex items-center flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}>
                            {layer.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => e.stopPropagation()} disabled={layers.length <= 1}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete layer &quot;{layer.name}&quot;?</AlertDialogTitle>
                                    <AlertDialogDescription>This action will permanently delete this layer and all its content. This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteLayer(layer.id)}>Delete Layer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
