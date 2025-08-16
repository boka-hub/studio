import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard, Info, ToyBrick } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
    { keys: ['B'], description: 'Select Brush Tool' },
    { keys: ['E'], description: 'Select Eraser Tool' },
    { keys: ['P'], description: 'Select Picker Tool' },
    { keys: ['G'], description: 'Select Fill Tool' },
    { keys: ['S'], description: 'Select Spray Tool' },
    { keys: ['R'], description: 'Select Rectangle Tool' },
    { keys: ['L'], description: 'Select Gradient Tool' },
    { keys: ['N'], description: 'Select Noise Tool' },
    { keys: ['M'], description: 'Select/Lasso Tool' },
    { keys: ['W'], description: 'Select Magic Wand Tool' },
    { keys: ['T'], description: 'Select Path Tool' },
    { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
    { keys: ['Ctrl', 'Y'], or: ['Ctrl', 'Shift', 'Z'], description: 'Redo last action' },
    { keys: ['Ctrl', 'C'], description: 'Copy selection' },
    { keys: ['Ctrl', 'V'], description: 'Paste selection' },
    { keys: ['Delete'], description: 'Delete selection' },
    { keys: ['Escape'], description: 'Deselect current selection' },
    { keys: ['Ctrl', '='], description: 'Zoom In' },
    { keys: ['Ctrl', '-'], description: 'Zoom Out' },
    { keys: ['Ctrl', '0'], description: 'Reset Zoom to 100%' },
    { keys: ['Ctrl', 'S'], description: 'Export Map as .txt' },
];

const features = [
    { 
        name: "Brush Tool",
        short: "Paints individual tiles on the canvas.",
        long: "The most basic tool. Click on any cell to place the currently selected primary tile from the palette. You can also click and drag to draw freeform lines."
    },
    { 
        name: "Eraser Tool",
        short: "Removes tiles from the canvas.",
        long: "The eraser sets any tile it touches back to the default 'Empty' state (ID 0). You can click to erase a single tile or click and drag to erase multiple tiles."
    },
    { 
        name: "Picker Tool",
        short: "Selects a tile directly from the canvas.",
        long: "Instead of finding a tile in the palette, use the picker to click on any tile already placed on the grid. That tile will become your new primary selected tile, and the tool will automatically switch back to the brush."
    },
    { 
        name: "Fill (Bucket) Tool",
        short: "Fills a contiguous area of the same tile.",
        long: "Click on any tile on the grid, and the fill tool will replace that tile and every connected tile of the same type with your currently selected primary tile. It will not cross boundaries of different tile types."
    },
    { 
        name: "Spray Tool",
        short: "Scatters the selected tile in a random pattern.",
        long: "Creates a more natural, randomized look. When you click and drag, the spray tool applies the primary tile in a circular area around the cursor, but only to a random subset of the cells within that circle, based on a fixed density. Great for grass, rocks, and flowers."
    },
    {
        name: "Rectangle Tool",
        short: "Draws a filled rectangle of tiles.",
        long: "Click and drag to define the two opposite corners of a rectangle. The tool will preview the shape as you drag, and upon release, it will fill the entire rectangular area with your currently selected primary tile."
    },
    {
        name: "Gradient Tool",
        short: "Blends two tiles over a rectangular area.",
        long: "This tool creates a smooth transition between your primary and secondary tiles using a dithering pattern. Select a primary tile (left-click) and a secondary tile (right-click) in the palette. Then, click and drag to define an area. The area will be filled with a mix of the two tiles, creating a gradient effect."
    },
    {
        name: "Noise Tool",
        short: "Fills a rectangle with a random mix of two tiles.",
        long: "Similar to the Gradient tool, this uses your primary and secondary tiles. Click and drag to define a rectangle. Upon release, every cell in the area will be randomly set to either the primary or secondary tile with a 50/50 chance. Ideal for creating varied, non-uniform terrain."
    },
    {
        name: "Select (Lasso) Tool",
        short: "Selects a rectangular area of tiles.",
        long: "Click and drag to draw a rectangular selection box. Once an area is selected, you can use the Selection Actions (Fill, Copy, Paste, Delete, Invert) on it. Press 'Escape' to deselect."
    },
    {
        name: "Magic Wand Tool",
        short: "Selects a connected area of identical tiles.",
        long: "A powerful selection tool. Click on any tile, and the magic wand will automatically select all adjacent tiles of the same type, no matter how complex the shape. You can then use the Selection Actions on this precise selection."
    },
    {
        name: "Path Tool",
        short: "Draws intelligent paths that connect automatically.",
        long: "This AI-powered tool simplifies creating roads, walls, or rivers. To use it, import a set of path tiles with a common naming prefix (e.g., 'road_straight', 'road_corner'). Select any of these tiles in the palette and draw a path. The AI will analyze the connections and automatically swap in the correct straight, corner, or T-junction tiles to make the path seamless."
    },
    {
        name: "Selection Actions",
        short: "Perform actions on a selected area.",
        long: "Once you have an area selected with the Lasso or Magic Wand, a new set of tools appears in the toolbar: Fill (fills with primary tile), Copy (copies tile data), Paste (pastes copied data at selection start), Delete (clears the area), and Invert (swaps primary tile with others)."
    }
];


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings & Information</DialogTitle>
          <DialogDescription>
            View keyboard shortcuts, app information, and other settings.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="features" className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features"><ToyBrick className="mr-2 h-4 w-4" />Features</TabsTrigger>
            <TabsTrigger value="shortcuts"><Keyboard className="mr-2 h-4 w-4" />Shortcuts</TabsTrigger>
            <TabsTrigger value="about"><Info className="mr-2 h-4 w-4" />About</TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="flex-grow overflow-hidden">
             <ScrollArea className="h-full">
                <Accordion type="single" collapsible className="w-full p-4">
                  {features.map((feature, index) => (
                     <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold">{feature.name}</p>
                                <p className="text-sm font-normal text-muted-foreground">{feature.short}</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {feature.long}
                        </AccordionContent>
                      </AccordionItem>
                  ))}
                </Accordion>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="shortcuts" className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <p className="text-sm">{shortcut.description}</p>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{key}</Badge>
                      ))}
                      {shortcut.or && (
                          <>
                            <span className='text-xs text-muted-foreground mx-1'>or</span>
                            {shortcut.or.map((key, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{key}</Badge>
                            ))}
                          </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="about" className="flex-grow overflow-auto p-4">
             <div className="space-y-6 text-sm">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">About TileForge</h3>
                    <p className="text-muted-foreground">
                        TileForge is an intelligent, AI-powered tile map editor built with modern web technologies. 
                        It's designed to make map creation faster, more intuitive, and more creative.
                    </p>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Core Technologies</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li><span className="font-semibold text-foreground">Next.js & React:</span> For a fast and responsive user interface.</li>
                        <li><span className="font-semibold text-foreground">Genkit (Gemini AI):</span> Powers the intelligent tools like AI Tile Placement and Path generation.</li>
                        <li><span className="font-semibold text-foreground">ShadCN/UI & TailwindCSS:</span> For the clean, modern, and accessible component library.</li>
                        <li><span className="font-semibold text-foreground">Lucide React:</span> For the beautiful and consistent icon set.</li>
                    </ul>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Version</h4>
                    <p className="text-muted-foreground">
                        Version 1.0.0
                    </p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">Created With</h4>
                    <p className="text-muted-foreground">
                       Firebase Studio
                    </p>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
