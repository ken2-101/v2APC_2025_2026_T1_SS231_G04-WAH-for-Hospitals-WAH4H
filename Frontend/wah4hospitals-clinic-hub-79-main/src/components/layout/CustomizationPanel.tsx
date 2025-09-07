
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import { Pencil, Moon, Sun } from 'lucide-react';

interface CustomizationPanelProps {
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ isDarkMode, onToggleDarkMode }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="hover-lift">
          <Pencil className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Customize Interface</SheetTitle>
          <SheetDescription>
            Personalize your experience with these appearance settings.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-gray-500">Switch between light and dark</p>
              </div>
              <div className="flex items-center">
                <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                <Switch 
                  id="dark-mode" 
                  checked={isDarkMode}
                  onCheckedChange={onToggleDarkMode}
                />
                <Moon className="w-4 h-4 ml-2 text-blue-700" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <SheetClose asChild>
              <Button className="w-full">Apply Changes</Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomizationPanel;
