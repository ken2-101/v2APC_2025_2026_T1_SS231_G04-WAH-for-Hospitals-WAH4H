# Step 3 Auto-Exit Fix - CRITICAL

## Root Cause

**The `handleSubmit` function was NOT checking which step the user was on before processing the submission.**

If ANYTHING triggered the form's `onSubmit` event (keyboard shortcuts, browser autofill, form validation events), the form would process immediately regardless of whether the user was on step 3.

## The Fix

### 1. **CRITICAL: Guard submission by currentStep**
**Location**: `PatientRegistrationModal.tsx` line ~123

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log('[PatientRegistrationModal] handleSubmit called on step:', currentStep);

  // GUARD: Only allow submission on step 3
  if (currentStep !== 3) {
    console.warn('[PatientRegistrationModal] Blocked submission - not on step 3');
    return;  // ← BLOCKS SUBMISSION IF NOT ON STEP 3
  }

  // ... rest of submission logic
};
```

**What This Does**:
- If form submission is triggered on step 1 or 2, it **immediately returns** without processing
- Only when `currentStep === 3` will the form actually submit
- Prevents accidental submission from ANY source (Enter key, autofill, validation triggers, etc.)

### 2. **Initialize Step 3 Form with Default Values**
**Location**: `PatientRegistrationModal.tsx` line ~74

```typescript
const step3Form = useForm<PatientStep3FormData>({
  resolver: zodResolver(patientStep3Schema),
  mode: 'onChange',
  defaultValues: {
    contact_first_name: '',
    contact_last_name: '',
    contact_mobile_number: '',
    contact_relationship: '',
  },
});
```

**Why This Helps**:
- React Hook Form needs explicit empty strings for optional fields
- Without defaults, undefined values can cause validation edge cases
- Ensures consistent form state on step 3

## What Was Happening Before

1. User clicks "Next" on step 2 → transitions to step 3
2. Step 3 renders with all optional fields
3. SOMETHING (browser autofill, validation event, or other trigger) fires form submit
4. `handleSubmit` executes **without checking currentStep**
5. Form validates (all fields optional = always valid)
6. Modal closes immediately

## Behavior After Fix

1. User clicks "Next" on step 2 → transitions to step 3
2. Step 3 renders
3. IF anything tries to trigger submit: **BLOCKED by currentStep guard**
4. User can fill fields, press Enter (blocked), click around safely
5. ONLY when user explicitly clicks "Register Patient" button on step 3 will submission proceed

## Testing

Try these scenarios:
- Click through steps 1 → 2 → 3 normally ✓
- Press Enter on each field on step 3 ✓
- Use browser autofill ✓
- Click "Previous" and "Next" rapidly ✓
- All should keep you on step 3 until you click "Register Patient"

## Files Modified

1. `PatientRegistrationModal.tsx`
   - Line ~123: Added `currentStep !== 3` guard in `handleSubmit`
   - Line ~74: Added `defaultValues` to step3Form initialization

**Total Impact**: 2 surgical fixes, ~10 lines of code
