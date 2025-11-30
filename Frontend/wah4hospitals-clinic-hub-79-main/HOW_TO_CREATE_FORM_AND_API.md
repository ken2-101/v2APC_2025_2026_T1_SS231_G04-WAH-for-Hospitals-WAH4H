# How to Create a Form, Send Data to Backend, and Fetch Data (React + Django)

This guide explains how to build a full-stack feature using **Django REST Framework** for the backend and **React** for the frontend.

---

## Part 1: Backend (Django)

We will create an API for a simple resource. Let's assume we are creating an API for **"Inventory Items"**.

### 1. Define the Model
In `backend/inventory/models.py`:

```python
from django.db import models

class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)

    def __str__(self):
        return self.name
```

### 2. Create the Serializer
In `backend/inventory/serializers.py`:

```python
from rest_framework import serializers
from .models import InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
```

### 3. Create the Views
In `backend/inventory/views.py`:

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import InventoryItem
from .serializers import InventoryItemSerializer

@api_view(['GET', 'POST'])
def inventory_list(request):
    if request.method == 'GET':
        items = InventoryItem.objects.all()
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 4. Register the URL
In `backend/inventory/urls.py` (and include this in your main `urls.py`):

```python
from django.urls import path
from . import views

urlpatterns = [
    path('items/', views.inventory_list, name='inventory-list'),
]
```

---

## Part 2: Frontend (React)

Now we will create a form to add items and a list to display them.

### 1. Define the Type
In `src/types/inventory.ts`:

```typescript
export interface InventoryItem {
  id?: number; // Optional for new items
  name: string;
  quantity: number;
  price: number;
  category: string;
}
```

### 2. Create the Component
In `src/pages/Inventory.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryItem } from '@/types/inventory';

const Inventory = () => {
  // State for storing the list of items
  const [items, setItems] = useState<InventoryItem[]>([]);
  
  // State for the form
  const [formData, setFormData] = useState<InventoryItem>({
    name: '',
    quantity: 0,
    price: 0,
    category: ''
  });

  // 1. FETCH DATA (GET)
  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/items/');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 2. SEND DATA (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/items/', formData);
      
      // Refresh the list and clear the form
      fetchItems();
      setFormData({ name: '', quantity: 0, price: 0, category: '' });
      alert('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Add New Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <Input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Input name="category" value={formData.category} onChange={handleChange} required />
          </div>
          <Button type="submit">Add Item</Button>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Current Inventory</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="border-b pb-2 flex justify-between">
              <span>{item.name} ({item.category})</span>
              <span className="font-bold">${item.price} - Qty: {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Inventory;
```

## Summary of Key Concepts

1.  **`axios.get(url)`**: Used to fetch data from the backend. Usually placed inside a `useEffect` hook so it runs when the page loads.
2.  **`axios.post(url, data)`**: Used to send form data to the backend to create a new record.
3.  **`useState`**: Used to manage the state of your form inputs and the data list.
4.  **`useEffect`**: Used to trigger side effects like data fetching.
