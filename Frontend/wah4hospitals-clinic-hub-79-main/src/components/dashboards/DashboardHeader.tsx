import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Layout } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onToggleWidget: (widget: string) => void;
  visibleWidgets: Record<string, boolean>;
  widgetLabels: Record<string, string>;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleWidget, visibleWidgets, widgetLabels }) => {
  const { user } = useAuth();
  const { currentRole } = useRole();

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-100/50 backdrop-blur-sm shadow-sm grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        
        {/* Left: Greeting & Role */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left justify-self-center md:justify-self-start">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Good morning, {user?.firstName ? `Dr. ${user.lastName}` : 'Doctor'}!
          </h1>
          <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-200 shadow-sm">
              {formatRole(currentRole)}
            </span>
            <p className="text-muted-foreground text-sm hidden md:block">
               — Hospital Overview
            </p>
          </div>
        </div>

        {/* Center: Date Display */}
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md px-8 py-3 rounded-2xl shadow-sm border border-blue-100/50 flex flex-col items-center justify-self-center">
             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">Today is</p>
             <p className="text-lg font-bold text-foreground leading-none">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </p>
        </div>

        {/* Right: Actions */}
        <div className="justify-self-center md:justify-self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600/70 hover:text-blue-700 hover:bg-blue-200/30 rounded-full">
                <Layout className="w-5 h-5" />
                <span className="sr-only">Customize Dashboard</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Dashboard Widgets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(widgetLabels).map(([key, label]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visibleWidgets[key]}
                    onCheckedChange={() => onToggleWidget(key)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
  );
};

export default DashboardHeader;
