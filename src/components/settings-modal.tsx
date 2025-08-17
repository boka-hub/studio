
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
    { keys: ['C'], description: 'Select Scatter Tool' },
    { keys: ['M'], description: 'Select/Lasso Tool' },
    { keys: ['W'], description: 'Select Magic Wand Tool' },
    { keys: ['Ctrl', 'C'], description: 'Copy selection to clipboard' },
    { keys: ['Ctrl', 'V'], description: 'Paste from clipboard to selection' },
    { keys: ['Delete'], description: 'Delete tiles within a selection' },
    { keys: ['Escape'], description: 'Deselect current selection or cancel drawing' },
    { keys: ['Ctrl', '='], description: 'Zoom In' },
    { keys: ['Ctrl', '-'], description: 'Zoom Out' },
    { keys: ['Ctrl', '0'], description: 'Reset Zoom to 100%' },
    { keys: ['Ctrl', 'S'], description: 'Export Map as .txt file' },
];

const features = [
    // Drawing Tools
    {
        name: "Brush",
        short: "Paints individual tiles.",
        long: "This is your main drawing tool. Select a tile from the palette by left-clicking it. Then, click on any cell in the grid to place that tile. You can also click and hold the mouse button while dragging to draw free-form lines."
    },
    {
        name: "Eraser",
        short: "Removes tiles from the grid.",
        long: "The eraser sets any tile it touches back to the transparent 'Empty' state (which has an ID of 0). You can click a single tile to erase it, or click and drag to clear a larger area."
    },
    {
        name: "Picker",
        short: "Selects a tile directly from the grid.",
        long: "Tired of hunting for a tile in the palette? Use the Picker tool to click on any tile that's already placed on your map. That tile will instantly become your active primary tile, and the tool will automatically switch back to the Brush so you can continue drawing with it."
    },
    {
        name: "Fill (Bucket)",
        short: "Fills a whole area of identical tiles.",
        long: "The Fill tool replaces a whole section of connected, identical tiles with your currently selected primary tile. For example, if you have a large patch of grass and click on one grass tile with 'water' selected, the entire patch of grass will become water. The fill will not go past tiles of a different type."
    },
    // Shape & Pattern Tools
    {
        name: "Rectangle",
        short: "Draws a filled rectangle of tiles.",
        long: "This tool is for creating perfect rectangular shapes. Click and hold the mouse button to set the first corner, drag your mouse to the opposite corner, and release. The entire area you defined will be filled with your currently selected primary tile."
    },
    {
        name: "Gradient",
        short: "Blends two tiles smoothly.",
        long: "Creates a smooth transition between two tiles using a dithering (checkerboard) pattern. First, select a primary tile (left-click) and a secondary tile (right-click) in the palette. Then, use the Gradient tool to draw a rectangle. The area will be filled with a mix of the two tiles, creating a gradient effect from left to right."
    },
    {
        name: "Noise",
        short: "Fills an area with a random mix of two tiles.",
        long: "Similar to the Gradient tool, this uses your primary and secondary tiles. When you draw a rectangle, every cell inside it will be randomly set to either the primary or secondary tile with a 50/50 chance. This is perfect for creating varied, non-uniform textures like dirt patches, rocky ground, or starry skies."
    },
    {
        name: "Spray",
        short: "Scatters the selected tile in a random pattern.",
        long: "This tool helps create a more natural, randomized look. When you click and drag, the spray tool applies your primary tile in a circular area, but only to a random subset of cells. You can adjust the 'Radius' and 'Density' of the spray in the toolbar. Great for things like grass, flowers, or rubble."
    },
    {
        name: "Scatter",
        short: "Paints with a random tile from a custom set.",
        long: "The Scatter tool lets you draw with a random tile from a pre-defined set. First, select the Scatter tool. Then, go to the tile palette and click on all the tiles you want to include in your set (they will be highlighted). Now, when you draw with the scatter tool, it will randomly pick a tile from your set for each cell. This is excellent for creating varied forests or dungeons with different tile types."
    },
    // Selection Tools
    {
        name: "Select (Lasso)",
        short: "Selects a rectangular area of your map.",
        long: "Click and drag to draw a rectangular selection box. Once an area is selected, you can perform special actions on it using the 'Selection' tools in the toolbar (like Fill, Copy, Paste, etc.). Press the 'Escape' key to clear your selection."
    },
    {
        name: "Magic Wand",
        short: "Selects a connected area of identical tiles.",
        long: "A very powerful selection tool. Click on any tile, and the magic wand will automatically select all adjacent tiles of the same type, no matter how complex the shape is. This is perfect for selecting an entire river, forest, or room floor with a single click. You can then use the 'Selection' actions on it."
    },
    {
        name: "Selection Actions",
        short: "Tools for editing a selected area.",
        long: "Once you have an area selected, a new set of tools appears in the toolbar: Fill (fills the selection with your primary tile), Copy (copies the selected tile data to an invisible clipboard), Paste (pastes the clipboard into the top-left of a new selection), Delete (clears all tiles in the selection), Invert (swaps your primary tile with other tiles), and Mirror (flips the selection horizontally or vertically)."
    },
    // Project & File Management
    {
        name: "Project Management",
        short: "Save and load multiple maps.",
        long: "All of your work is automatically saved in your browser. Use the 'Manage Projects' button (database icon) to open the project manager. Here you can: 'Save as New Project' to create a snapshot of your current map, 'Load' a different project, 'Rename' existing ones, or 'Delete' projects you no longer need. The app will always auto-load the last project you worked on."
    },
    {
        name: "Importing & Slicing",
        short: "Add new tiles to your palette.",
        long: "You can add tiles using the 'Import Tiles' button (for individual image files) or the 'Slice Sheet' button (for spritesheets). The slicer lets you define the tile dimensions (e.g., 16x16) to automatically cut up a larger image. You can also drag-and-drop images directly onto the app to open the slicer."
    },
    {
        name: "Exporting",
        short: "Save your map and tiles to your computer.",
        long: "Use 'Export Map' to save your map's layout as a simple text file (.txt). Use 'Export Spritesheet' to create a single, optimized spritesheet image of all your tiles, along with a metadata file that describes each tile's properties and position."
    },
     {
        name: "Clearing & Resetting",
        short: "Quickly clear your workspace.",
        long: "The header contains buttons to 'Clear Map' (erases the grid but keeps your tiles) and 'Clear Palette' (deletes all tiles and the map). Both actions have confirmation dialogs. To completely reset the entire application and delete all saved projects, you can use the 'Reset Project' button found in the 'About' tab of this settings window."
    },
    {
        name: "Live Preview",
        short: "A simple mode to test your map's collisions.",
        long: "Click the 'Play' icon in the header to enter Live Preview mode. A player indicator will appear on the map. You can move it around with the arrow keys. The player will not be able to move onto any tiles that you have marked as 'Solid' in the palette, allowing you to quickly test the collidable areas of your map. Press 'Escape' to exit."
    },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const handleReset = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tileforge-projects');
        window.localStorage.removeItem('tileforge-panel-layout');
        window.location.reload();
    }
  }

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
                        Welcome to TileForge! This is an all-in-one tool for creating 2D tile maps. Your work is automatically saved to your browser&apos;s local storage, so you can close the tab and come back later. Here&apos;s a quick guide to creating your first map from scratch.
                    </p>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold">Step 1: Adding Tiles to Your Palette</h4>
                    <p className="text-muted-foreground">
                        Your map is made of tiles, which live in the **Palette** on the right. To start, you need to add some images.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">Importing Individual Images:</span> Use the <span className="italic">Import Tiles</span> button (upload icon) in the header to select one or more image files (like PNGs) from your computer. Each image will become a single tile.</li>
                        <li><span className="font-semibold text-foreground">Slicing a Spritesheet:</span> If you have a single image that contains a grid of many smaller tiles (a spritesheet), use the <span className="italic">Slice Sheet</span> button (scissors icon). This opens a tool where you can specify the dimensions of your tiles (e.g., 16x16 pixels). It will then automatically cut up the sheet and add each piece as a separate tile to your palette. You can also **drag-and-drop a spritesheet file** directly onto the app to open this tool.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 2: Drawing Your Map</h4>
                     <p className="text-muted-foreground">
                        With tiles in your palette, you can now build your map on the central **Grid**. Select a tool from the **Toolbar** on the left.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                       <li>In the palette, **left-click** a tile to select it as your primary "brush" color.</li>
                       <li>Use the <span className="font-semibold text-foreground">Brush</span> tool to paint tiles, and the <span className="font-semibold text-foreground">Eraser</span> to remove them.</li>
                       <li>Experiment with other tools like <span className="font-semibold text-foreground">Fill</span>, <span className="font-semibold text-foreground">Rectangle</span>, and <span className="font-semibold text-foreground">Spray</span> to build your world quickly.</li>
                    </ul>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold">Step 3: Managing and Saving Your Work</h4>
                     <p className="text-muted-foreground">
                        All your changes are **auto-saved** to the current project. If you want to work on multiple maps, use the project manager.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li>Click the <span className="font-semibold text-foreground">Manage Projects</span> button (database icon) to see all your saved projects.</li>
                        <li>Here, you can <span className="font-semibold text-foreground">Save as New Project</span> to create a copy of your current work, or <span className="font-semibold text-foreground">Load</span> a different map to continue editing it.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 4: Exporting for Your Game</h4>
                     <p className="text-muted-foreground">
                        When your map is ready, you need to get it into your game engine.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">Export Map:</span> Saves the grid data as a comma-separated text file (.txt). Each number in the file corresponds to a tile's ID, which you can use to reconstruct the map in your code.</li>
                        <li><span className="font-semibold text-foreground">Export Spritesheet:</span> This is the most common option. It compiles all the tiles from your palette back into a single, optimized spritesheet image (PNG). It also gives you a metadata file (.txt) that tells you the name, properties (like 'solid'), and coordinates of each tile on the sheet.</li>
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
                            This will permanently delete all saved projects and settings from your browser&apos;s local storage. This action cannot be undone.
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
