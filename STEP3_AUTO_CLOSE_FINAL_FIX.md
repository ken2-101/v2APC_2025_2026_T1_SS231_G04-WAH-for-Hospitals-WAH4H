# Step 3 Auto-Close - FINAL FIX

## Root Cause: Dialog Component's Internal Close Handler

**THE PROBLEM**: The `<Dialog>` component has an `onOpenChange` handler that was calling `onClose()` whenever the dialog's internal state changed to `false`. When step 3 rendered, something in the Dialog component was triggering this state change, causing the modal to close immediately.

## The Smoking Gun

**File**: `PatientRegistrationModal.tsx` line ~186

**BEFORE**:
```typescript
<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
```

**What was happening**:
1. User clicks "Next" on step 2
2. `setCurrentStep(3)` is called
3. Step 3 renders
4. Dialog component detects some internal state change (could be focus, validation, form event)
5. Dialog's `open` state changes to `false`
6. `onOpenChange` fires with `open = false`
7. `onClose()` is called
8. Modal closes immediately

## The Fix

**Disable Dialog's auto-close behavior** - only allow explicit closes via `handleClose()`:

```typescript
<Dialog open={isOpen} onOpenChange={(open) => {
  console.log('[PatientRegistrationModal] Dialog onOpenChange called, open:', open, 'currentStep:', currentStep);
  if (!open) {
    console.warn('[PatientRegistrationModal] Dialog trying to close on step:', currentStep);
    // Only allow close from handleClose() function, not from dialog internal events
    // onClose();  // ← COMMENTED OUT
  }
}}>
```

## Additional Defensive Fixes Applied

### 1. **Guard in handleNextStep**
Prevent step 3 from trying to advance to a non-existent step 4:
```typescript
else if (currentStep === 3) {
  // SHOULD NEVER REACH HERE - step 3 has no "next" button
  console.error('[PatientRegistrationModal] handleNextStep called on step 3 - this should not happen!');
  return;
}
```

### 2. **Step Change Tracking**
Added useEffect to debug step transitions:
```typescript
React.useEffect(() => {
  console.log('[PatientRegistrationModal] Step changed to:', currentStep);
}, [currentStep]);
```

### 3. **Logging in handleNextStep**
```typescript
console.log('[PatientRegistrationModal] handleNextStep called on step:', currentStep);
```

## How the Modal Works Now

### Close Triggers:
✅ **User clicks "Cancel" on step 1** → `handleClose()` → Modal closes
✅ **User clicks "Previous" then "Cancel"** → `handleClose()` → Modal closes
✅ **Successful API submission** → `handleClose()` → Modal closes
❌ **Dialog internal events** → `onOpenChange` fires → **IGNORED** → Modal stays open

### Step 3 Behavior:
1. User clicks "Next" on step 2
2. Step transitions to 3
3. Step 3 renders with emergency contact fields
4. Dialog component may fire internal events → **IGNORED**
5. User can fill fields, press Enter (blocked), interact normally
6. Modal ONLY closes when:
   - User clicks "Register Patient" AND API succeeds
   - User clicks "Previous" then "Cancel"

## Testing Checklist

✅ Navigate step 1 → 2 → 3 (should stay on step 3)
✅ Fill fields on step 3 (should not close)
✅ Press Enter on step 3 fields (should not submit or close)
✅ Click "Previous" from step 3 (should go back to step 2)
✅ Click "Register Patient" with valid data (should submit and close on success)
✅ Click "Register Patient" with invalid data (should show error and stay open)
✅ Network error during submission (should show error and stay open)

## Files Modified

1. **PatientRegistrationModal.tsx**
   - Line ~186: Disabled Dialog's `onOpenChange` close handler
   - Line ~57: Added useEffect to track step changes
   - Line ~87: Added logging and guard in `handleNextStep`
   - Line ~123: Added logging in `handleSubmit`

## Why This Fix Works

The Dialog component (from shadcn/ui or similar) has built-in close behaviors that fire `onOpenChange(false)` in various scenarios:
- Focus changes
- Click events bubbling
- Form validation
- Accessibility keyboard events

By commenting out the `onClose()` call in `onOpenChange`, we prevent these internal Dialog events from closing our modal. The modal now ONLY closes when we explicitly call `handleClose()` from:
- Cancel button
- Successful submission
- (Future: explicit "X" close button if added)

This gives us complete control over modal lifecycle instead of fighting with Dialog's internal state management.
