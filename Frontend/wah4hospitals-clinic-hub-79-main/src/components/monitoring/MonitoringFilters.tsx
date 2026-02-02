import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface MonitoringFiltersProps {
    activeFilters: {
        ward: string;
        status: string;
        doctor: string;
    };
    options: {
        wards: string[];
        statuses: string[];
        doctors: string[];
    };
    handleFilterChange: (key: 'ward' | 'status' | 'doctor', value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

export const MonitoringFilters: React.FC<MonitoringFiltersProps> = ({
    activeFilters,
    options,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,
}) => {
    const renderCheckboxItems = (
        key: 'ward' | 'status' | 'doctor',
        items: string[]
    ) => {
        return items.map((item) => (
            <DropdownMenuCheckboxItem
                key={item}
                checked={activeFilters[key] === item}
                onCheckedChange={() => handleFilterChange(key, activeFilters[key] === item ? '' : item)}
            >
                {item}
            </DropdownMenuCheckboxItem>
        ));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {hasActiveFilters && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                            !
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                {renderCheckboxItems('status', options.statuses)}
                <DropdownMenuSeparator />

                <DropdownMenuLabel>Filter by Ward</DropdownMenuLabel>
                {renderCheckboxItems('ward', options.wards)}
                <DropdownMenuSeparator />

                <DropdownMenuLabel>Filter by Doctor</DropdownMenuLabel>
                {renderCheckboxItems('doctor', options.doctors)}

                {hasActiveFilters && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearFilters} className="text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            Clear All Filters
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};