
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter, Clock } from 'lucide-react';

const AuditTrail = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:22',
      user: 'Dr. Sarah Johnson',
      action: 'Patient Record Updated',
      details: 'Updated patient ID: 12345 medical history',
      ipAddress: '192.168.1.100',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:10',
      user: 'Admin John Smith',
      action: 'User Created',
      details: 'Created new user account for Nurse Maria Garcia',
      ipAddress: '192.168.1.50',
      status: 'success'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:15',
      user: 'Unknown User',
      action: 'Login Failed',
      details: 'Failed login attempt for admin@hospital.com',
      ipAddress: '203.0.113.1',
      status: 'warning'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:30',
      user: 'Nurse Maria Garcia',
      action: 'Medication Administered',
      details: 'Administered medication to patient ID: 67890',
      ipAddress: '192.168.1.75',
      status: 'success'
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="Login">Login Actions</SelectItem>
              <SelectItem value="User">User Management</SelectItem>
              <SelectItem value="Patient">Patient Records</SelectItem>
              <SelectItem value="System">System Changes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="border rounded-lg">
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-1">IP Address</div>
            <div className="col-span-1">Status</div>
          </div>
          
          {filteredLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-12 gap-4 p-4 border-b items-center text-sm">
              <div className="col-span-2 font-mono">{log.timestamp}</div>
              <div className="col-span-2 font-medium">{log.user}</div>
              <div className="col-span-2">{log.action}</div>
              <div className="col-span-4 text-muted-foreground">{log.details}</div>
              <div className="col-span-1 font-mono text-xs">{log.ipAddress}</div>
              <div className="col-span-1">
                <Badge variant={getStatusColor(log.status)}>
                  {log.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTrail;
