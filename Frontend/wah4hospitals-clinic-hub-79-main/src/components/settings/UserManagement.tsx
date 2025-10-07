
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@hospital.com', role: 'Doctor', status: 'Active', lastLogin: '2024-01-15' },
    { id: 2, name: 'Nurse Maria Garcia', email: 'maria.garcia@hospital.com', role: 'Nurse', status: 'Active', lastLogin: '2024-01-14' },
    { id: 3, name: 'Admin John Smith', email: 'john.smith@hospital.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15' },
    { id: 4, name: 'Dr. Michael Brown', email: 'michael.brown@hospital.com', role: 'Doctor', status: 'Inactive', lastLogin: '2024-01-10' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Doctor">Doctor</SelectItem>
              <SelectItem value="Nurse">Nurse</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/*Selection bar*/}
        {selectedUsers.length > 0 && (
          <div className="flex flew-wrap items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-sm">
              {selectedUsers.length} user(s) selected
            </span>
            <Button variant="outline" size="sm">Activate</Button>
            <Button variant="outline" size="sm">Deactivate</Button>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        )}

        {/*Scrollable Table COntainer */}
        <div className="border rounded-lg overflow-x-auto no scrollbar">
          {/*Table Header */}
          <div className="min-w-[800px] grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium">
            <div className="col-span-1">
              <Checkbox 
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Actions</div>
          </div>
          
          {/* Table Rows */}
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="min-w-[800px] grid grid-cols-12 gap-4 p-4 border-b items-center"
            >
              <div className="col-span-1">
                <Checkbox 
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => 
                    handleSelectUser(user.id, !!checked)
                  }
                />
              </div>
              <div className="col-span-3 font-medium">{user.name}</div>
              <div className="col-span-3 text-muted-foreground max-w-[200px] truncate">{user.email}</div>
              <div className="col-span-2">
                <Badge variant="outline">{user.role}</Badge>
              </div>
              <div className="col-span-2">
                <Badge 
                  variant={user.status ==="Active" ? "default" : "secondary"}
                >
                  {user.status}
                </Badge>
              </div>
              <div className="col-span-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
