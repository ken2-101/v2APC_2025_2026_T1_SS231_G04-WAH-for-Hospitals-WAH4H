# Modal Closing on API Error - FIXED

## Root Cause

The modal was closing even when the API call failed because:

1. **Modal wasn't awaiting the async `onSuccess` callback** - errors weren't being caught
2. **Parent component was closing the modal on success** - conflicting responsibilities
3. **Parent component was swallowing errors** - modal couldn't detect failure

## The Fixes

### 1. **Modal: Await `onSuccess` to catch errors**
**File**: `PatientRegistrationModal.tsx` lines ~150-162

**BEFORE**:
```typescript
try {
  const validatedData = patientFormDataSchema.parse(finalData);
  if (onSuccess) {
    onSuccess(validatedData);  // ❌ Not awaited - errors not caught
  }
  handleClose();  // ❌ Always executes, even if API fails
} catch (err) {
  console.error('Validation error:', err);
}
```

**AFTER**:
```typescript
try {
  const validatedData = patientFormDataSchema.parse(finalData);
  if (onSuccess) {
    // ✅ Await the async API call - if it throws, we catch it below
    await onSuccess(validatedData);
  }
  // ✅ Only close modal if API call succeeded
  handleClose();
} catch (err) {
  console.error('[PatientRegistrationModal] Submission error:', err);
  // ✅ Modal stays open on error so user can see the error message
}
```

### 2. **Parent: Re-throw errors and don't close modal**
**File**: `PatientRegistration.tsx` lines ~134-158

**BEFORE**:
```typescript
try {
  const res = await axios.post(API_URL, patientData);
  setFormSuccess(`Patient registered successfully!`);
  setShowRegistrationModal(false);  // ❌ Parent closes modal
  fetchPatients();
} catch (err: any) {
  // ... error handling ...
  setFormError(messages);
  // ❌ Error swallowed - modal doesn't know about failure
}
```

**AFTER**:
```typescript
try {
  const res = await axios.post(API_URL, patientData);
  setFormSuccess(`Patient registered successfully!`);
  // ✅ Don't close modal here - let modal close itself on success
  fetchPatients();
  // ✅ Return success - modal will close after this resolves
} catch (err: any) {
  // ... error handling ...
  setFormError(messages);
  // ✅ Re-throw error so modal knows to stay open
  throw err;
}
```

## Behavior Before vs After

### ❌ **BEFORE**:
1. User fills form and clicks "Register Patient"
2. API call fails (validation error, network error, etc.)
3. Modal closes immediately
4. User sees empty screen, no error message visible
5. Error is lost, user confused

### ✅ **AFTER**:
1. User fills form and clicks "Register Patient"
2. API call fails
3. **Modal stays open**
4. Error message displays in modal's error alert
5. User can see what went wrong and fix the issue
6. User can try again without re-entering all data

### ✅ **SUCCESS CASE**:
1. User fills form and clicks "Register Patient"
2. API call succeeds
3. Modal closes automatically
4. Success message shows on main page
5. Patient list refreshes with new patient

## Files Modified

1. **PatientRegistrationModal.tsx** (lines ~150-162)
   - Added `await` before `onSuccess(validatedData)`
   - Moved `handleClose()` to only execute on success
   - Added comment explaining error handling

2. **PatientRegistration.tsx** (lines ~134-158)
   - Removed `setShowRegistrationModal(false)` from success handler
   - Added `throw err` in catch block to propagate errors
   - Added comments explaining flow

## Testing Scenarios

✅ **Success**: API returns 201 → Modal closes, success message shows, patient list refreshes
✅ **Validation Error**: API returns 400 → Modal stays open, error shows in alert
✅ **Network Error**: No connection → Modal stays open, error shows in alert
✅ **Server Error**: API returns 500 → Modal stays open, error shows in alert

All error scenarios now keep the modal open so users can see and fix issues!
