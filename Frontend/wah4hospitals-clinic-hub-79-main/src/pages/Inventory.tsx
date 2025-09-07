
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, AlertTriangle, Plus, TrendingDown, Edit, Trash2, Search, Filter, X } from 'lucide-react';
import { AddItemModal } from '@/components/inventory/AddItemModal';
import { EditItemModal } from '@/components/inventory/EditItemModal';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([
    {
      id: 1,
      name: 'Paracetamol 500mg',
      category: 'Medicine',
      stock: 15,
      minStock: 50,
      unit: 'tablets',
      status: 'low',
      supplier: 'MedSupply Corp',
      expiryDate: '2024-12-31',
      batchNumber: 'PAR001'
    },
    {
      id: 2,
      name: 'Surgical Gloves',
      category: 'Medical Supplies',
      stock: 200,
      minStock: 100,
      unit: 'pieces',
      status: 'normal',
      supplier: 'Healthcare Solutions',
      expiryDate: '2025-06-30',
      batchNumber: 'SG002'
    },
    {
      id: 3,
      name: 'Insulin',
      category: 'Medicine',
      stock: 5,
      minStock: 20,
      unit: 'vials',
      status: 'critical',
      supplier: 'Pharma Direct',
      expiryDate: '2024-08-15',
      batchNumber: 'INS003'
    },
    {
      id: 4,
      name: 'Bandages',
      category: 'Medical Supplies',
      stock: 150,
      minStock: 75,
      unit: 'rolls',
      status: 'normal',
      supplier: 'MedCare Plus',
      expiryDate: '2026-01-01',
      batchNumber: 'BND004'
    },
    {
      id: 5,
      name: 'Antibiotics - Amoxicillin',
      category: 'Medicine',
      stock: 25,
      minStock: 40,
      unit: 'capsules',
      status: 'low',
      supplier: 'Global Pharma',
      expiryDate: '2024-10-20',
      batchNumber: 'AMX005'
    },
    {
      id: 6,
      name: 'Syringes 10ml',
      category: 'Medical Supplies',
      stock: 300,
      minStock: 150,
      unit: 'pieces',
      status: 'normal',
      supplier: 'Sterile Supplies Inc',
      expiryDate: '2025-12-31',
      batchNumber: 'SYR006'
    },
    {
      id: 7,
      name: 'Blood Pressure Monitor',
      category: 'Equipment',
      stock: 12,
      minStock: 5,
      unit: 'units',
      status: 'normal',
      supplier: 'MedTech Equipment',
      expiryDate: 'N/A',
      batchNumber: 'BPM007'
    },
    {
      id: 8,
      name: 'Face Masks N95',
      category: 'Medical Supplies',
      stock: 8,
      minStock: 100,
      unit: 'boxes',
      status: 'critical',
      supplier: 'Safety First Medical',
      expiryDate: '2025-03-15',
      batchNumber: 'N95008'
    },
    {
      id: 9,
      name: 'Thermometer Digital',
      category: 'Equipment',
      stock: 20,
      minStock: 10,
      unit: 'units',
      status: 'normal',
      supplier: 'Digital Health Co',
      expiryDate: 'N/A',
      batchNumber: 'THM009'
    },
    {
      id: 10,
      name: 'Acetaminophen 250mg',
      category: 'Medicine',
      stock: 80,
      minStock: 60,
      unit: 'tablets',
      status: 'normal',
      supplier: 'MedSupply Corp',
      expiryDate: '2024-11-30',
      batchNumber: 'ACE010'
    },
    {
      id: 11,
      name: 'Gauze Pads',
      category: 'Medical Supplies',
      stock: 45,
      minStock: 100,
      unit: 'packs',
      status: 'low',
      supplier: 'Wound Care Specialists',
      expiryDate: '2025-08-20',
      batchNumber: 'GAU011'
    },
    {
      id: 12,
      name: 'Stethoscope',
      category: 'Equipment',
      stock: 8,
      minStock: 15,
      unit: 'units',
      status: 'low',
      supplier: 'Professional Medical',
      expiryDate: 'N/A',
      batchNumber: 'STE012'
    },
    {
      id: 13,
      name: 'Ibuprofen 400mg',
      category: 'Medicine',
      stock: 120,
      minStock: 80,
      unit: 'tablets',
      status: 'normal',
      supplier: 'Pain Relief Pharma',
      expiryDate: '2025-02-28',
      batchNumber: 'IBU013'
    },
    {
      id: 14,
      name: 'Alcohol Swabs',
      category: 'Medical Supplies',
      stock: 35,
      minStock: 200,
      unit: 'boxes',
      status: 'critical',
      supplier: 'Sterile Solutions',
      expiryDate: '2025-07-10',
      batchNumber: 'ALC014'
    },
    {
      id: 15,
      name: 'Pulse Oximeter',
      category: 'Equipment',
      stock: 15,
      minStock: 8,
      unit: 'units',
      status: 'normal',
      supplier: 'Oxygen Monitoring Inc',
      expiryDate: 'N/A',
      batchNumber: 'POX015'
    },
    {
      id: 16,
      name: 'Aspirin 100mg',
      category: 'Medicine',
      stock: 2,
      minStock: 50,
      unit: 'tablets',
      status: 'critical',
      supplier: 'Cardio Pharma',
      expiryDate: '2024-09-15',
      batchNumber: 'ASP016'
    },
    {
      id: 17,
      name: 'IV Bags Saline',
      category: 'Medical Supplies',
      stock: 90,
      minStock: 50,
      unit: 'bags',
      status: 'normal',
      supplier: 'IV Solutions Co',
      expiryDate: '2025-01-20',
      batchNumber: 'IVS017'
    },
    {
      id: 18,
      name: 'Wheelchair',
      category: 'Equipment',
      stock: 6,
      minStock: 10,
      unit: 'units',
      status: 'low',
      supplier: 'Mobility Solutions',
      expiryDate: 'N/A',
      batchNumber: 'WCH018'
    },
    {
      id: 19,
      name: 'Cough Syrup',
      category: 'Medicine',
      stock: 40,
      minStock: 30,
      unit: 'bottles',
      status: 'normal',
      supplier: 'Respiratory Care Pharma',
      expiryDate: '2024-12-10',
      batchNumber: 'CSY019'
    },
    {
      id: 20,
      name: 'Surgical Scissors',
      category: 'Equipment',
      stock: 25,
      minStock: 20,
      unit: 'units',
      status: 'normal',
      supplier: 'Surgical Instruments Ltd',
      expiryDate: 'N/A',
      batchNumber: 'SSC020'
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    category: [],
    supplier: []
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleAddItem = (newItem: any) => {
    setInventoryItems([...inventoryItems, newItem]);
  };

  const handleEditItem = (updatedItem: any) => {
    setInventoryItems(inventoryItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleDeleteItem = (itemId: number) => {
    setInventoryItems(inventoryItems.filter(item => item.id !== itemId));
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      category: [],
      supplier: []
    });
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(item.status);
    const matchesCategory = activeFilters.category.length === 0 || activeFilters.category.includes(item.category);
    const matchesSupplier = activeFilters.supplier.length === 0 || activeFilters.supplier.includes(item.supplier);

    return matchesSearch && matchesStatus && matchesCategory && matchesSupplier;
  });

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track medical supplies and equipment</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryItems.filter(item => item.status === 'low' || item.status === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryItems.filter(item => item.status === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(inventoryItems.map(item => item.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Items</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search items, category, supplier, batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
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
                    checked={activeFilters.status.includes('critical')}
                    onCheckedChange={() => handleFilterChange('status', 'critical')}
                  >
                    Critical
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.status.includes('low')}
                    onCheckedChange={() => handleFilterChange('status', 'low')}
                  >
                    Low Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.status.includes('normal')}
                    onCheckedChange={() => handleFilterChange('status', 'normal')}
                  >
                    Normal
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.category.includes('Medicine')}
                    onCheckedChange={() => handleFilterChange('category', 'Medicine')}
                  >
                    Medicine
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.category.includes('Medical Supplies')}
                    onCheckedChange={() => handleFilterChange('category', 'Medical Supplies')}
                  >
                    Medical Supplies
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.category.includes('Equipment')}
                    onCheckedChange={() => handleFilterChange('category', 'Equipment')}
                  >
                    Equipment
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Supplier</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.supplier.includes('MedSupply Corp')}
                    onCheckedChange={() => handleFilterChange('supplier', 'MedSupply Corp')}
                  >
                    MedSupply Corp
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.supplier.includes('Healthcare Solutions')}
                    onCheckedChange={() => handleFilterChange('supplier', 'Healthcare Solutions')}
                  >
                    Healthcare Solutions
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.supplier.includes('Pharma Direct')}
                    onCheckedChange={() => handleFilterChange('supplier', 'Pharma Direct')}
                  >
                    Pharma Direct
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([filterType, values]) =>
                values.map(value => (
                  <Badge key={`${filterType}-${value}`} variant="secondary" className="flex items-center gap-1">
                    {value}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange(filterType, value)}
                    />
                  </Badge>
                ))
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item Name</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Stock</th>
                  <th className="text-left py-2">Min Stock</th>
                  <th className="text-left py-2">Supplier</th>
                  <th className="text-left py-2">Batch</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3">{item.category}</td>
                    <td className="py-3">{item.stock} {item.unit}</td>
                    <td className="py-3">{item.minStock} {item.unit}</td>
                    <td className="py-3">{item.supplier}</td>
                    <td className="py-3 font-mono text-sm">{item.batchNumber}</td>
                    <td className="py-3">{getStatusBadge(item.status)}</td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{item.name}" from inventory? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items found matching your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleEditItem}
        item={selectedItem}
      />
    </div>
  );
};

export default Inventory;
