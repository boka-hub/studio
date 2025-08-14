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

interface Action<T extends string> {
  icon: ElementType;
  label: string;
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
}

export function Toolbar<T extends string>({
  actions,
  selectedAction,
  onActionSelect,
  gridSize,
  onGridResize,
  zoom,
  onZoomChange,
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
  
  return (
    <div className="flex flex-col gap-4 p-2">
      <div>
        <h3 className="text-sm font-semibold mb-2 px-2 text-muted-foreground">Tools</h3>
        <div className="flex flex-col gap-1">
          {(Object.keys(actions) as T[]).map((key) => {
            const action = actions[key];
            const Icon = action.icon;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedAction === key ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full flex justify-start gap-2',
                      selectedAction === key && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    onClick={() => onActionSelect(key)}
                    disabled={action.disabled}
                    aria-label={action.label}
                  >
                    <Icon className={cn('h-5 w-5', action.disabled && 'animate-spin')} />
                    <span>{action.label}</span>
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
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResize}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Apply Size</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
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
    </div>
  );
}
