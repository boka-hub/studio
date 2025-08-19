
import React, { useState, useEffect } from 'react';
import type { FC, ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Maximize, RectangleHorizontal, Circle, Slash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Selection, Tool, AutoTileMode, Shape } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

interface ToolbarProps<T extends Tool> {
  actions: Record<T, Action<T>>;
  selectedAction: T;
  onActionSelect: (action: T) => void;
  gridSize: { width: number, height: number };
  onGridResize: (width: number, height: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isCollapsed: boolean;
  selection: Selection | null;
  selectionActions: Record<string, SelectionAction>;
  sprayRadius: number;
  onSprayRadiusChange: (radius: number) => void;
  sprayDensity: number;
  onSprayDensityChange: (density: number) => void;
  autoTileMode: AutoTileMode;
  onAutoTileModeChange: (mode: AutoTileMode) => void;
  autoTileOverwrite: boolean;
  onAutoTileOverwriteChange: (overwrite: boolean) => void;
  shape: Shape;
  onShapeChange: (shape: Shape) => void;
}

export function Toolbar<T extends Tool>({
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
  sprayRadius,
  onSprayRadiusChange,
  sprayDensity,
  onSprayDensityChange,
  autoTileMode,
  onAutoTileModeChange,
  autoTileOverwrite,
  onAutoTileOverwriteChange,
  shape,
  onShapeChange,
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
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-2">
        <div>
          <h3 className={cn("text-sm font-semibold mb-2 px-2 text-muted-foreground", isCollapsed && "hidden")}>Tools</h3>
          <div className={cn("grid gap-1", isCollapsed ? "grid-cols-1" : "grid-cols-2")}>
            {(Object.keys(actions) as T[]).map((key) => {
              const action = actions[key];
              const Icon = action.icon;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedAction === key ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full flex h-auto py-2 gap-2 items-center',
                        isCollapsed ? 'justify-center' : 'justify-start pl-3'
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
            {selectedAction === 'shape' && (
               <>
                <Separator />
                <div className="px-2 space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Shape Settings</h3>
                     <ToggleGroup type="single" value={shape} onValueChange={(value: Shape) => value && onShapeChange(value)} className="w-full grid grid-cols-3">
                        <ToggleGroupItem value="rectangle" aria-label="Draw a rectangle">
                            <RectangleHorizontal className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="circle" aria-label="Draw a circle">
                            <Circle className="h-4 w-4" />
                        </ToggleGroupItem>
                         <ToggleGroupItem value="line" aria-label="Draw a line">
                            <Slash className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
              </>
            )}
            {selectedAction === 'spray' && (
              <>
                <Separator />
                <div className="px-2 space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Spray Settings</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Radius ({sprayRadius} tiles)</Label>
                            <Slider
                                value={[sprayRadius]}
                                onValueChange={(value) => onSprayRadiusChange(value[0])}
                                min={1}
                                max={10}
                                step={1}
                                aria-label="Spray radius"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Density ({Math.round(sprayDensity * 100)}%)</Label>
                            <Slider
                                value={[sprayDensity]}
                                onValueChange={(value) => onSprayDensityChange(value[0])}
                                min={0.1}
                                max={1}
                                step={0.1}
                                aria-label="Spray density"
                            />
                        </div>
                    </div>
                </div>
              </>
            )}
             {selectedAction === 'auto-tile' && (
              <>
                <Separator />
                <div className="px-2 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Auto-Tile Settings</h3>
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Mode</h4>
                      <RadioGroup value={autoTileMode} onValueChange={(v) => onAutoTileModeChange(v as AutoTileMode)}>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="9-tile" id="r1" />
                              <Label htmlFor="r1">9-Tile (Simple)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="13-tile" id="r2" />
                              <Label htmlFor="r2">13-Tile (Interior)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="47-tile" id="r3" />
                              <Label htmlFor="r3">47-Tile (Blob)</Label>
                          </div>
                      </RadioGroup>
                    </div>
                     <div className="space-y-2">
                       <h4 className="text-xs font-medium text-muted-foreground">Behavior</h4>
                       <div className="flex items-center justify-between rounded-lg border p-3">
                          <Label htmlFor="autotile-overwrite">Overwrite</Label>
                          <Switch 
                            id="autotile-overwrite"
                            checked={autoTileOverwrite}
                            onCheckedChange={onAutoTileOverwriteChange}
                          />
                       </div>
                     </div>
                </div>
              </>
            )}
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
                                              size="icon"
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
