
import React, { useState, useEffect } from 'react';
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
import type { AppSettings, ExportFormat } from '@/lib/types';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const shortcuts = [
    { keys: ['B'], description: 'Select Brush Tool' },
    { keys: ['E'], description: 'Select Eraser Tool' },
    { keys: ['P'], description: 'Select Picker Tool' },
    { keys: ['G'], description: 'Select Fill Tool' },
    { keys: ['S'], description: 'Select Spray Tool' },
    { keys: ['A'], description: 'Select Auto-Tile Tool' },
    { keys: ['R'], description: 'Select Shape Tool' },
    { keys: ['L'], description: 'Select Gradient Tool' },
    { keys: ['N'], description: 'Select Noise Tool' },
    { keys: ['C'], description: 'Select Scatter Tool' },
    { keys: ['M'], 'description': 'Select/Lasso Tool' },
    { keys: ['W'], 'description': 'Select Magic Wand Tool' },
    { keys: ['Ctrl', 'Drag'], description: 'Draw rectangle with current tile (overrides tool)' },
    { keys: ['Ctrl', 'C'], description: 'Copy selection to clipboard' },
    { keys: ['Ctrl', 'V'], description: 'Paste from clipboard to selection' },
    { keys: ['Delete'], description: 'Delete tiles within a selection' },
    { keys: ['Escape'], description: 'Deselect current selection or cancel drawing' },
    { keys: ['Ctrl', '='], description: 'Zoom In' },
    { keys: ['Ctrl', '-'], description: 'Zoom Out' },
    { keys: ['Ctrl', '0'], description: 'Reset Zoom to 100%' },
    { keys: ['Ctrl', 'S'], description: 'Open Export Menu' },
];

const features = [
    {
        name: "Auto-Tile",
        short: "Automatically places the correct tile to form connections.",
        long: `This powerful offline tool makes drawing environments like walls or terrain incredibly fast. Select a mode (9, 13, or 47-tile) from the toolbar, then select the exact number of tiles required for that mode in the palette. When you draw, the tool analyzes neighbors and places the correct tile automatically.

IMPORTANT: The order in which you select tiles in the palette is absolutely critical for the logic to work. You must select them in the precise order listed below.

---

**9-Tile (Simple Walls/Paths)**

This is for simple connections. You must select exactly 9 tiles.

Selection Order:
1. Top-Left Corner
2. Top Edge
3. Top-Right Corner
4. Left Edge
5. Center (solid)
6. Right Edge
7. Bottom-Left Corner
8. Bottom Edge
9. Bottom-Right Corner

---

**13-Tile (With Interior Corners)**

This set adds support for interior corners, perfect for more complex walls or dungeons. You must select exactly 13 tiles.

Selection Order:
1. Top Edge
2. Bottom Edge
3. Left Edge
4. Right Edge
5. Top-Left Corner (Outer)
6. Top-Right Corner (Outer)
7. Bottom-Left Corner (Outer)
8. Bottom-Right Corner (Outer)
9. Top-Left Corner (Inner)
10. Top-Right Corner (Inner)
11. Bottom-Left Corner (Inner)
12. Bottom-Right Corner (Inner)
13. Center (solid)

---

**47-Tile (Blob/Terrain)**

This is the most comprehensive set, ideal for natural, organic terrain like grass, dirt, or sand. You must create a full 47-tile set and select them in the correct order based on the standardized "blob" tileset layout. A visual guide for the selection order can be easily found online by searching for "Godot 3x3 minimal tileset".`
    },
    {
        name: "Brush",
        short: "Paints individual tiles.",
        long: "This is your main drawing tool. Select a tile from the palette by left-clicking it. Then, click on any cell in the grid to place that tile. You can also click and hold the mouse button while dragging to draw free-form lines."
    },
    {
        name: "Clearing & Resetting",
        short: "Quickly clear your workspace.",
        long: "The header contains buttons to **Clear Map** (erases the grid but keeps your tiles) and **Clear Palette** (deletes all tiles and the map). Both actions have confirmation dialogs. To completely reset the entire application and delete all saved projects, you can use the **Reset Project** button found in the **About** tab of this settings window."
    },
    {
        name: "Eraser",
        short: "Removes tiles from the grid.",
        long: "The eraser sets any tile it touches back to the transparent **Empty** state (which has an ID of 0). You can click a single tile to erase it, or click and drag to clear a larger area."
    },
     {
        name: "Importing & Exporting",
        short: "How to get your data in and out of TileForge.",
        long: `Understanding how data flows is key. TileForge is designed to be both simple and powerful.

---

**1. Exporting Your Map Data**

This saves the layout of your grid(s). The format automatically changes based on your settings.

- **Single-Layer Mode (exports as .txt):**
This is a simple comma-separated (CSV) file. Each number is a tile ID from your palette. The structure of the text file directly matches your visual grid. Game engines can easily parse this by splitting the text by newlines (for rows) and then by commas (for cells) to rebuild the map array.

- **Multi-Layer Mode (exports as .json):**
This is a much richer format that saves everything needed to rebuild your map perfectly. It contains a main object with a **tiles** array (listing all your tiles with their ID, name, and 'solid' property) and a **layers** array (listing all your layers, each with its own name, visibility status, and grid of tile IDs). This is the ideal format for loading a full, complex scene into a game engine.

---

**2. Exporting Your Tiles (Spritesheet & Metadata)**

When you click **Export Sheet**, the app does two powerful things:

- **Creates a Spritesheet (.png):** It combines all the tiles from your palette into a single image file.
- **Creates a Metadata File (.txt):** This is the "brain" of your spritesheet. It's a JSON-formatted text file that stores the **tileWidth**, **tileHeight**, and the original **name**, **ID**, and **solid** property for every single tile, along with its position (index) in the sheet.

---

**3. The Power of Re-importing**

This is where the metadata file shines, creating a perfect, lossless workflow.

- Open the **Slice Sheet** tool.
- Upload your exported **.png** spritesheet.
- The slicer will also look for a companion **.txt** metadata file with the same name, or you can add it manually.
- When the metadata is found, the slicer **perfectly restores everything**: it configures the correct tile dimensions, slices the sheet, and assigns the original name, ID, and solid property back to every single tile.

This allows you to export your tiles, edit them in another program, and re-import them back into TileForge without losing any of your work or setup.`
    },
    {
        name: "Fill (Bucket)",
        short: "Fills a whole area of identical tiles.",
        long: "The Fill tool replaces a whole section of connected, identical tiles with your currently selected primary tile. For example, if you have a large patch of grass and click on one grass tile with 'water' selected, the entire patch of grass will become water. The fill will not go past tiles of a different type."
    },
    {
        name: "Gradient",
        short: "Blends two tiles smoothly.",
        long: "Creates a smooth transition between two tiles using a dithering (checkerboard) pattern. First, select a primary tile (left-click) and a secondary tile (right-click) in the palette. Then, use the Gradient tool to draw a rectangle. The area will be filled with a mix of the two tiles, creating a gradient effect from left to right."
    },
    {
        name: "Layers",
        short: "Organize your map into multiple layers.",
        long: "The layers feature can be enabled in the settings. When enabled, a new **Layers Panel** will appear on the left. You can add, delete, rename, and reorder layers. All drawing operations will apply only to the currently selected active layer. You can also toggle the visibility of each layer to focus on what you're working on. When exporting with layers enabled, it's best to use the **.json** format, which will save all your layer data."
    },
    {
        name: "Live Preview",
        short: "A simple mode to test your map's collisions.",
        long: "Click the **Play** icon in the header to enter Live Preview mode. A player indicator will appear on the map. You can move it around with the arrow keys. The player will not be able to move onto any tiles that you have marked as **Solid** in the palette, allowing you to quickly test the collidable areas of your map. Press 'Escape' to exit."
    },
    {
        name: "Magic Wand",
        short: "Selects a connected area of identical tiles.",
        long: "A very powerful selection tool. Click on any tile, and the magic wand will automatically select all adjacent tiles of the same type, no matter how complex the shape is. This is perfect for selecting an entire river, forest, or room floor with a single click. You can then use the **Selection** actions on it."
    },
    {
        name: "Noise",
        short: "Fills an area with a random mix of two tiles.",
        long: "Similar to the Gradient tool, this uses your primary and secondary tiles. When you draw a rectangle, every cell inside it will be randomly set to either the primary or secondary tile with a 50/50 chance. This is perfect for creating varied, non-uniform textures like dirt patches, rocky ground, or starry skies."
    },
    {
        name: "Picker",
        short: "Selects a tile directly from the grid.",
        long: "Tired of hunting for a tile in the palette? Use the Picker tool to click on any tile that's already placed on your map. That tile will instantly become your active primary tile, and the tool will automatically switch back to the Brush so you can continue drawing with it."
    },
    {
        name: "Project Management",
        short: "Save and load multiple maps.",
        long: "All of your work is automatically saved in your browser. Use the **Manage Projects** button (database icon) to open the project manager. Here you can: **Save as New Project** to create a snapshot of your current map, **Load** a different project, **Rename** existing ones, or **Delete** projects you no longer need. The app will always auto-load the last project you worked on."
    },
     {
        name: "Rectangle Shortcut",
        short: "Quickly draw a rectangle with any tool.",
        long: "Hold down the **Ctrl** key (or **Cmd** on Mac) and click-and-drag to draw a rectangle filled with your primary tile. This will override your currently selected tool. If you have the **Eraser** selected, it will draw a rectangle of empty tiles instead. This is a great way to quickly block out large areas or clear sections without switching tools."
    },
    {
        name: "Scatter",
        short: "Paints with a random tile from a custom set.",
        long: "The Scatter tool lets you draw with a random tile from a pre-defined set. First, select the Scatter tool. Then, go to the tile palette and click on all the tiles you want to include in your set (they will be highlighted). Now, when you draw with the scatter tool, it will randomly pick a tile from your set for each cell. This is excellent for creating varied forests or dungeons with different tile types."
    },
    {
        name: "Select (Lasso)",
        short: "Selects a rectangular area of your map.",
        long: "Click and drag to draw a rectangular selection box. Once an area is selected, you can perform special actions on it using the **Selection** tools in the toolbar (like Fill, Copy, Paste, etc.). Press the 'Escape' key to clear your selection."
    },
    {
        name: "Selection Actions",
        short: "Tools for editing a selected area.",
        long: "Once you have an area selected, a new set of tools appears in the toolbar: Fill (fills the selection with your primary tile), Copy (copies the selected tile data to an invisible clipboard), Paste (pastes the clipboard into the top-left of a new selection), Delete (clears all tiles in the selection), Invert (swaps your primary tile with other tiles), and Mirror (flips the selection horizontally or vertically)."
    },
    {
        name: "Shape Tool",
        short: "Draws geometric shapes like rectangles, circles, and lines.",
        long: "This tool allows you to draw predefined geometric shapes. Select the primary shape type (**Rectangle**, **Circle**, or **Line**) from the toolbar. Click and hold to set the starting point, drag your mouse to define the size and orientation, and release to draw the shape. Shapes are filled with your currently selected primary tile."
    },
    {
        name: "Spray",
        short: "Scatters the selected tile in a random pattern.",
        long: "This tool helps create a more natural, randomized look. When you click and drag, the spray tool applies your primary tile in a circular area, but only to a random subset of cells. You can adjust the **Radius** and **Density** of the spray in the toolbar. Great for things like grass, flowers, or rubble."
    },
];

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-semibold text-foreground/90">{children}</span>;

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <B key={i}>{part.slice(2, -2)}</B>;
        }
        return part;
      })}
    </>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {

  const handleReset = () => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tileforge-projects');
        window.localStorage.removeItem('tileforge-panel-layout');
        window.localStorage.removeItem('tileforge-app-settings');
        window.location.reload();
    }
  }
  
  const handleSettingToggle = (key: keyof AppSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleExportFormatChange = (value: ExportFormat) => {
    onSettingsChange({ ...settings, exportFormat: value });
  };

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
                  {features.sort((a, b) => a.name.localeCompare(b.name)).map((feature, i) => (
                     <AccordionItem value={feature.name} key={feature.name}>
                        <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold">{feature.name}</p>
                                <p className="text-sm font-normal text-muted-foreground">{feature.short}</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                          <FormattedText text={feature.long} />
                        </AccordionContent>
                      </AccordionItem>
                  ))}
                </Accordion>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="shortcuts" className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {shortcuts.map((shortcut, i) => (
                  <div key={shortcut.description} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <p className="text-sm">{shortcut.description}</p>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <Badge key={`${shortcut.description}-${key}`} variant="secondary" className="text-xs">{key}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="about" className="flex-grow overflow-auto p-4 space-y-6">
             <div className="space-y-4">
                 <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">App Settings</h3>
                    <p className="text-sm text-muted-foreground">Changes are applied immediately.</p>
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="layers-enabled">Enable Layers Panel</Label>
                            <Switch 
                                id="layers-enabled"
                                checked={settings.layersEnabled}
                                onCheckedChange={(checked) => handleSettingToggle('layersEnabled', checked)}
                            />
                        </div>
                        <div className="space-y-3 rounded-lg border p-3">
                            <Label>Default Export Format</Label>
                             <RadioGroup value={settings.exportFormat} onValueChange={handleExportFormatChange}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="txt" id="r_txt" />
                                    <Label htmlFor="r_txt">.txt (Simple CSV for single layers)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="json" id="r_json" />
                                    <Label htmlFor="r_json">.json (Complex, for layers and properties)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                 </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">About TileForge</h3>
                    <p className="text-muted-foreground">
                        Welcome to TileForge! This is an all-in-one tool for creating 2D tile maps. Your work is automatically saved to your browser&apos;s local storage, so you can close the tab and come back later.
                    </p>
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
