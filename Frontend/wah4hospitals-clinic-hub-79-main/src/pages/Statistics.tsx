/*
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Activity, Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PrintButton } from '@/components/ui/PrintButton';
import { Button } from '@/components/ui/button';
import { Notification } from '@/components/ui/notification';

const Statistics = () => {
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  
  const monthlyData = [
    { month: 'Jan', patients: 120, revenue: 450000 },
    { month: 'Feb', patients: 135, revenue: 520000 },
    { month: 'Mar', patients: 148, revenue: 580000 },
    { month: 'Apr', patients: 162, revenue: 620000 },
    { month: 'May', patients: 175, revenue: 680000 },
    { month: 'Jun', patients: 188, revenue: 720000 }
  ];

  const handleGenerateReport = () => {
    setNotification({
      message: 'Report generated successfully',
      type: 'success'
    });
  };

  const handlePrint = () => {
    setNotification({
      message: 'Printing report...',
      type: 'info'
    });
  };

  const handleExportData = () => {
    // In a real app, this would generate a CSV file
    const csvContent = "month,patients,revenue\n" + 
      monthlyData.map(item => `${item.month},${item.patients},${item.revenue}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hospital_statistics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({
      message: 'Data exported successfully',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-600">Hospital performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" onClick={handleGenerateReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <PrintButton onPrint={handlePrint} />
        </div>
      </div>

      <div id="printable-content">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">1,328</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₱720K</p>
                  <p className="text-sm text-green-600">+8% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bed Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900">87%</p>
                  <p className="text-sm text-yellow-600">+5% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Stay</p>
                  <p className="text-2xl font-bold text-gray-900">4.2 days</p>
                  <p className="text-sm text-red-600">-0.3 from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Patient Admissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="patients" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-secondary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
*/