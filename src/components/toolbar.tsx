import React, { useState, useEffect } from 'react';
import type { FC, ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Selection } from '@/lib/types';

interface Action<T extends string> {
  icon: ElementType;
  label: string;
  disabled?: boolean;
}

interface SelectionAction {
    icon: ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface ToolbarProps<T extends string> {
  actions: Record<T, Action<T>>;
  selectedAction: T;
  onActionSelect: (action: T) => void;
  gridSize: { width: number, height: number };
  onGridResize: (width: number, height: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isCollapsed: boolean;
  selection: Selection | null;
  selectionActions: Record<string, SelectionAction>
}

export function Toolbar<T extends string>({
  actions,
  selectedAction,
  onActionSelect,
  gridSize,
  onGridResize,
  zoom,
  onZoomChange,
  isCollapsed,
  selection,
  selectionActions,
}: ToolbarProps<T>) {
  const [localGridSize, setLocalGridSize] = useState(gridSize);

  useEffect(() => {
    setLocalGridSize(gridSize);
  }, [gridSize]);

  const handleResize = () => {
    const width = Math.max(1, Math.min(256, localGridSize.width));
    const height = Math.max(1, Math.min(256, localGridSize.height));
    onGridResize(width, height);
  };
  
  const selectionActionEntries = Object.entries(selectionActions);
  
  return (
    <ScrollArea className="flex-grow">
      <div className={cn("flex flex-col gap-4 p-2", isCollapsed && "items-center")}>
        <div>
          <h3 className={cn("text-sm font-semibold mb-2 px-2 text-muted-foreground", isCollapsed && "hidden")}>Tools</h3>
          <div className={cn("grid gap-1", isCollapsed ? 'grid-cols-2' : 'grid-cols-2')}>
            {(Object.keys(actions) as T[]).map((key) => {
              const action = actions[key];
              const Icon = action.icon;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedAction === key ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full flex h-auto py-2 gap-1 text-xs items-center justify-start',
                        isCollapsed ? 'flex-col px-1' : 'flex-row pl-3',
                         selectedAction === key && 'bg-primary/80 text-primary-foreground hover:bg-primary/90'
                      )}
                      onClick={() => onActionSelect(key)}
                      disabled={action.disabled}
                      aria-label={action.label}
                    >
                      <Icon className={cn('h-5 w-5', action.disabled && 'animate-spin')} />
                      <span className={cn(isCollapsed && 'hidden')}>{action.label.split('(')[0].trim()}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        {!isCollapsed && (
          <>
            {selection && (
                <>
                  <Separator />
                    <div className="px-2 space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Selection</h3>
                         <div className="grid grid-cols-3 gap-1">
                          {selectionActionEntries.map(([key, action]) => (
                              <Tooltip key={key}>
                                  <TooltipTrigger asChild>
                                      <div>
                                          <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-full h-8"
                                              onClick={action.onClick}
                                              disabled={action.disabled}
                                          >
                                              <action.icon className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right">
                                      <p>{action.label}</p>
                                  </TooltipContent>
                              </Tooltip>
                          ))}
                         </div>
                    </div>
                </>
            )}
            <Separator />
            <div className="px-2">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Canvas</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Grid Size (1-256)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1" max="256"
                      value={localGridSize.width}
                      onChange={e => setLocalGridSize({...localGridSize, width: parseInt(e.target.value, 10) || 1 })}
                      onBlur={handleResize}
                      className="w-16 h-8 text-center"
                      aria-label="Grid width"
                    />
                    <span className="text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min="1" max="256"
                      value={localGridSize.height}
                      onChange={e => setLocalGridSize({...localGridSize, height: parseInt(e.target.value, 10) || 1 })}
                      onBlur={handleResize}
                      className="w-16 h-8 text-center"
                      aria-label="Grid height"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-8" onClick={handleResize}>
                      <Maximize className="h-4 w-4 mr-2" />
                      Apply Size
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Zoom ({Math.round(zoom * 100)}%)</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-5 w-5 text-muted-foreground" />
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => onZoomChange(value[0])}
                      min={0.1}
                      max={2}
                      step={0.05}
                      aria-label="Zoom slider"
                    />
                    <ZoomIn className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                      <Button variant="outline" size="sm" onClick={() => onZoomChange(1)} className="h-7">Reset Zoom (Ctrl+0)</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
