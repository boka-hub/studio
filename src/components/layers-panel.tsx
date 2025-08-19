
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layer } from '@/lib/types';
import { PlusCircle, Eye, EyeOff, Trash2, Edit, Check, X } from 'lucide-react';
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
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onRenameLayer,
  onToggleVisibility,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
          {layers.map(layer => (
            <div
              key={layer.id}
              className={cn(
                'flex items-center p-1.5 rounded-md cursor-pointer hover:bg-muted',
                activeLayerId === layer.id && 'bg-secondary hover:bg-secondary'
              )}
              onClick={() => onSelectLayer(layer.id)}
            >
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" onClick={confirmRename}><Check className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
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
