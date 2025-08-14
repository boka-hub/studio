import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard, Info, Code } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

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
    { keys: ['I'], description: 'Select AI Place Tool' },
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
        <Tabs defaultValue="shortcuts" className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shortcuts"><Keyboard className="mr-2 h-4 w-4" />Shortcuts</TabsTrigger>
            <TabsTrigger value="about"><Info className="mr-2 h-4 w-4" />About</TabsTrigger>
          </TabsList>
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
