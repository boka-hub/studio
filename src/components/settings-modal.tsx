
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
    { keys: ['A'], description: 'Select Auto-Tile Tool' },
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
        name: "Auto-Tile",
        short: "Automatically places the correct tile to form connections.",
        long: "This powerful offline tool makes drawing environments like walls or terrain incredibly fast. Select a mode (9, 13, or 47-tile) from the toolbar, then select the exact number of tiles required for that mode in the palette. When you draw, the tool analyzes neighbors and places the correct tile automatically.\n\nIMPORTANT: The order in which you select tiles is critical for the logic to work.\n\n---\n\n**9-Tile (Simple Walls/Paths)**\n\nThis is for simple connections. You must select exactly 9 tiles.\n\nSelection Order:\n1. Top-Left Corner\n2. Top Edge\n3. Top-Right Corner\n4. Left Edge\n5. Center (solid)\n6. Right Edge\n7. Bottom-Left Corner\n8. Bottom Edge\n9. Bottom-Right Corner\n\n---\n\n**13-Tile (With Interior Corners)**\n\nThis set adds support for interior corners, perfect for more complex walls or dungeons. You must select exactly 13 tiles.\n\nSelection Order:\n1. Top Edge\n2. Bottom Edge\n3. Left Edge\n4. Right Edge\n5. Top-Left Corner (Outer)\n6. Top-Right Corner (Outer)\n7. Bottom-Left Corner (Outer)\n8. Bottom-Right Corner (Outer)\n9. Top-Left Corner (Inner)\n10. Top-Right Corner (Inner)\n11. Bottom-Left Corner (Inner)\n12. Bottom-Right Corner (Inner)\n13. Center (solid)\n\n---\n\n**47-Tile (Blob/Terrain)**\n\nThis is the most comprehensive set, ideal for natural, organic terrain like grass, dirt, or sand. You must create a full 47-tile set and select them in the correct order.\n\nA visual guide for the standard 47-tile layout can be easily found by searching for 'blob tileset layout' online. It's a common standard in 2D game development."
    },
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
        short: "Add new tiles from images and spritesheets.",
        long: "Use 'Import Tiles' for individual images or 'Slice Sheet' for spritesheets. The Batch Slicer handles multiple sheets at once. For lossless re-importing, use the manual 'Add .txt Metadata' button inside the slicer to associate your exported metadata file with its spritesheet. This guarantees all your original names and settings are preserved."
    },
    {
        name: "Exporting",
        short: "Save your map and tiles to your computer.",
        long: "Use 'Export Map' to save your layout as a simple .txt file. Use 'Export Spritesheet' to create a single image of all your tiles. This also generates a powerful companion .txt metadata file containing all tile names, properties (like 'solid'), and layout info. This file is designed to be used with the Slicer for perfect, lossless re-importing of your work."
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
                  {features.sort((a, b) => a.name.localeCompare(b.name)).map((feature, index) => (
                     <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold">{feature.name}</p>
                                <p className="text-sm font-normal text-muted-foreground">{feature.short}</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
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
                        Your map is made of tiles, which live in the **Palette** on the right. To start, you need to add some images. You can do this by dragging files directly onto the application.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">For Individual Images:</span> Use the <span className="italic">Import Tiles</span> button (upload icon) in the header. Each image will become a single tile.</li>
                        <li><span className="font-semibold text-foreground">For Spritesheets:</span> Use the <span className="italic">Slice Sheet</span> button (scissors icon). This opens the **Batch Slicer**, where you can specify tile dimensions (e.g., 16x16 pixels) to automatically cut up a sheet. You can also **drag-and-drop a spritesheet file** directly onto the app to open this tool.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 2: Drawing Your Map</h4>
                     <p className="text-muted-foreground">
                        With tiles in your palette, you can now build your map on the central **Grid**. Select a tool from the **Toolbar** on the left.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                       <li>In the palette, **left-click** a tile to select it as your primary "brush" color. **Right-click** to select a secondary color for tools like Gradient and Noise.</li>
                       <li>Use the <span className="font-semibold text-foreground">Brush</span> tool to paint tiles, and the <span className="font-semibold text-foreground">Eraser</span> to remove them.</li>
                       <li>Experiment with other tools like <span className="font-semibold text-foreground">Fill</span>, <span className="font-semibold text-foreground">Rectangle</span>, and the powerful <span className="font-semibold text-foreground">Auto-Tile</span> tool to build your world quickly.</li>
                    </ul>
                </div>
                 <div className="space-y-3">
                    <h4 className="font-semibold">Step 3: Saving and Exporting Your Work</h4>
                     <p className="text-muted-foreground">
                        All your changes are **auto-saved** to the current project in your browser. To get your assets for your game, you need to export them.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li><span className="font-semibold text-foreground">Export Map:</span> Saves the grid data as a comma-separated text file (.txt). Each number in the file corresponds to a tile's ID.</li>
                        <li><span className="font-semibold text-foreground">Export Spritesheet:</span> This is the most powerful option. It compiles all your tiles back into a single spritesheet image and provides a companion **metadata .txt file**. This text file contains all the names, properties, and layout info for your tiles.</li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Step 4: Re-importing and Iterating</h4>
                     <p className="text-muted-foreground">
                        To continue working on a project, you don't need to do anything—just open the app. To bring an exported spritesheet back into TileForge without losing your names and properties:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                        <li>Open the <span className="font-semibold text-foreground">Slice Sheet</span> tool.</li>
                        <li>Drop in your spritesheet image file.</li>
                        <li>Use the <span className="font-semibold text-foreground">"Add .txt Metadata"</span> button to manually select your corresponding metadata file. This will perfectly restore all your tiles, names, and settings.</li>
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
