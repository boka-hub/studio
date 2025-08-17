
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard, Info, ToyBrick, RefreshCw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
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
        name: "Selection Actions",
        short: "Perform actions on a selected area.",
        long: "Once you have an area selected with the Lasso or Magic Wand, a new set of tools appears in the toolbar: Fill (fills with primary tile), Copy (copies tile data), Paste (pastes copied data at selection start), Delete (clears the area), and Invert (swaps primary tile with others)."
    }
];

const handleReset = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tileforge-grid');
        window.localStorage.removeItem('tileforge-tiles');
        window.localStorage.removeItem('tileforge-zoom');
        window.location.reload();
    }
}

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
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="about" className="flex-grow overflow-auto p-4 space-y-6">
             <div className="space-y-6 text-sm">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Getting Started with TileForge</h3>
                    <p className="text-muted-foreground">
                        Welcome to TileForge! Your work is automatically saved to your browser&apos;s local storage. Here&apos;s a quick guide to creating your first map.
                    </p>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold">Step 1: Importing Your Tiles</h4>
                    <p className="text-muted-foreground">
                        Every map starts with tiles. You have two primary ways to add them to your palette on the right:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">Import Individual Tiles:</span> Use the <span className="italic">Import Tiles</span> button in the header to select one or more image files from your computer.</li>
                        <li><span className="font-semibold text-foreground">Slice a Spritesheet:</span> If you have a single image containing multiple tiles (a spritesheet), use the <span className="italic">Slice Sheet</span> button. This will open a tool where you can specify the dimensions of your tiles (e.g., 16x16) and automatically slice them into individual tiles for your palette. You can also drag-and-drop a spritesheet directly onto the canvas to open this tool.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 2: Building Your Map</h4>
                     <p className="text-muted-foreground">
                        With your tiles in the palette, you can start building. Select a tile by left-clicking it in the palette to make it your primary "brush" color. Select a secondary tile with a right-click for use with advanced tools.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                       <li>Use the <span className="font-semibold text-foreground">Brush</span> to paint tiles and the <span className="font-semibold text-foreground">Eraser</span> to remove them.</li>
                       <li>The <span className="font-semibold text-foreground">Fill</span> tool will flood-fill an area of identical tiles with your selected tile.</li>
                       <li>The <span className="font-semibold text-foreground">Picker</span> lets you select a tile that's already on the map.</li>
                    </ul>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold">Step 3: Advanced Tools & Selections</h4>
                     <p className="text-muted-foreground">
                        For more complex patterns, use the shape and selection tools.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li>The <span className="font-semibold text-foreground">Rectangle</span> tool draws filled rectangles. <span className="font-semibold text-foreground">Gradient</span> and <span className="font-semibold text-foreground">Noise</span> use your primary and secondary tiles to create interesting textures.</li>
                        <li>Use <span className="font-semibold text-foreground">Select</span> or the <span className="font-semibold text-foreground">Magic Wand</span> to select areas of your map. Once selected, you can use the selection-specific actions in the toolbar to Fill, Delete, Copy, or Paste parts of your map.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 4: Exporting Your Work</h4>
                     <p className="text-muted-foreground">
                        Once you&apos;re done, you can export your creation.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">Export Map:</span> Saves the grid data as a simple text file, easy to parse in any game engine.</li>
                        <li><span className="font-semibold text-foreground">Export Spritesheet:</span> Compiles all the tiles used in your palette back into a single, optimized spritesheet image and provides a metadata file that maps tile names and properties to their coordinates on the sheet.</li>
                    </ul>
                </div>
                <div className="space-y-2 mt-6">
                    <h4 className="font-semibold">Created With</h4>
                    <p className="text-muted-foreground">
                       Firebase Studio
                    </p>
                </div>
            </div>
             <DialogFooter className="pt-4 border-t">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset Project
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all saved map data, tiles, and settings from your browser&apos;s local storage. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

    