import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface PatientFiltersProps {
  activeFilters: {
    status: string[];
    gender: string[];
    department: string[];
    civilStatus: string[];
  };
  handleFilterChange: (filterType: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  activeFilters,
  handleFilterChange,
  clearFilters,
  hasActiveFilters
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filter
          {hasActiveFilters && (
            <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
              {Object.values(activeFilters).flat().length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={activeFilters.status.includes('Active')}
          onCheckedChange={() => handleFilterChange('status', 'Active')}
        >
          Active
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.status.includes('Inactive')}
          onCheckedChange={() => handleFilterChange('status', 'Inactive')}
        >
          Inactive
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Filter by Gender</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={activeFilters.gender.includes('Male')}
          onCheckedChange={() => handleFilterChange('gender', 'Male')}
        >
          Male
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.gender.includes('Female')}
          onCheckedChange={() => handleFilterChange('gender', 'Female')}
        >
          Female
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={activeFilters.department.includes('General Medicine')}
          onCheckedChange={() => handleFilterChange('department', 'General Medicine')}
        >
          General Medicine
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.department.includes('Cardiology')}
          onCheckedChange={() => handleFilterChange('department', 'Cardiology')}
        >
          Cardiology
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.department.includes('Pediatrics')}
          onCheckedChange={() => handleFilterChange('department', 'Pediatrics')}
        >
          Pediatrics
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.department.includes('Emergency')}
          onCheckedChange={() => handleFilterChange('department', 'Emergency')}
        >
          Emergency
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Filter by Civil Status</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={activeFilters.civilStatus.includes('Single')}
          onCheckedChange={() => handleFilterChange('civilStatus', 'Single')}
        >
          Single
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.civilStatus.includes('Married')}
          onCheckedChange={() => handleFilterChange('civilStatus', 'Married')}
        >
          Married
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.civilStatus.includes('Divorced')}
          onCheckedChange={() => handleFilterChange('civilStatus', 'Divorced')}
        >
          Divorced
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activeFilters.civilStatus.includes('Widowed')}
          onCheckedChange={() => handleFilterChange('civilStatus', 'Widowed')}
        >
          Widowed
        </DropdownMenuCheckboxItem>
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
