# How to Add a New Module

This guide outlines the steps to add a new module (tab) to the WAH4Hospitals application.

## 1. Create the Module Page

Create a new page component in `src/pages/`. This will be the main entry point for your module.

**Example:** `src/pages/MyNewModule.tsx`

```tsx
import React from 'react';

const MyNewModule = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">My New Module</h1>
      <p className="text-gray-600">Welcome to the new module.</p>
      {/* Add your module content here */}
    </div>
  );
};

export default MyNewModule;
```

## 2. Register the Module in `App.tsx`

You need to register the module in three places within `src/App.tsx`.

### A. Import the Component and Icon
Import your new page and a suitable icon from `lucide-react`.

```tsx
import MyNewModule from "./pages/MyNewModule";
import { Star } from 'lucide-react'; // Choose an appropriate icon
```

### B. Add to the `tabs` Array
Add a new object to the `tabs` configuration array. The `id` must be unique.

```tsx
const tabs = [
  // ... existing tabs
  { id: 'my-module', name: 'My Module', icon: <Star className="w-4 h-4" /> },
];
```

### C. Update `AppContent` Routing Logic
Update the `useEffect` hook to sync the URL path with the active tab.

```tsx
useEffect(() => {
  const path = location.pathname;
  // ... existing checks
  if (path === '/my-module') {
    setActiveTab('my-module');
  }
}, [location.pathname]);
```

### D. Update `renderContent` Switch Statement
Add a case to render your component when the tab is active.

```tsx
const renderContent = () => {
  switch (activeTab) {
    // ... existing cases
    case 'my-module':
      return <MyNewModule />;
    // ...
  }
};
```

### E. Add the Route
Add a new `<Route>` to the router configuration.

```tsx
<Routes>
  {/* ... existing routes */}
  <Route path="/my-module" element={<AppContent />} />
</Routes>
```

## 3. Configure Role Access in `RoleContext.tsx`

Update `src/contexts/RoleContext.tsx` to grant access to specific user roles.

Find the `roleAccessConfig` object and add your module's `id` (from step 2B) to the arrays of the allowed roles.

```tsx
const roleAccessConfig: Record<UserRole, string[]> = {
  'doctor': ['dashboard', 'patients', 'my-module', ...], // Added 'my-module'
  'administrator': ['dashboard', 'patients', 'my-module', ...],
  // ... other roles
};
```

Also, if the module should be available in "Admin Mode", update the `setAvailableTabs` call inside the `useEffect` for admin mode:

```tsx
if (isAdminMode && currentRole === 'administrator') {
  setAvailableTabs(['dashboard', ..., 'my-module', ...]);
}
```

## 4. (Optional) Create Components and Types

For better organization, create specific sub-components and types for your module.

*   **Types:** Create `src/types/myModule.ts`
*   **Components:** Create a folder `src/components/my-module/` and add components like `MyModuleTable.tsx`, `MyModuleFilters.tsx`, etc.

## Summary Checklist

- [ ] Created page component in `src/pages/`
- [ ] Imported component and icon in `src/App.tsx`
- [ ] Added to `tabs` array in `src/App.tsx`
- [ ] Updated URL sync logic in `src/App.tsx`
- [ ] Updated `renderContent` in `src/App.tsx`
- [ ] Added Route in `src/App.tsx`
- [ ] Updated `roleAccessConfig` in `src/contexts/RoleContext.tsx`
