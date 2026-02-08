/**
 * Patient Registration Modal - 4-Step Wizard
 * Aligned with Patient model (wah4h-backend/patients/models.py)
 *
 * Page 1: Basic Info
 * Page 2: Contact & Address
 * Page 3: Emergency Contact
 * Page 4: Additional Info
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { PatientFormData } from '../../types/patient';
import {
  patientStep1Schema,
  patientStep2Schema,
  patientStep3Schema,
  patientStep4Schema,
  patientFormDataSchema,
  type PatientStep1FormData,
  type PatientStep2FormData,
  type PatientStep3FormData,
  type PatientStep4FormData,
} from '../../schemas/patientSchema';
import {
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PWD_TYPE_OPTIONS,
  RELIGION_OPTIONS,
  CONTACT_RELATIONSHIP_OPTIONS,
  REGISTRATION_STEPS,
} from '../../constants/patientConstants';
import addressData from '../../data/addressData.json';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: any) => void;
  isLoading?: boolean;
  error?: string;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  error,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [allStepsData, setAllStepsData] = useState<Partial<PatientFormData>>({});

  // Step 1: Basic Info
  const step1Form = useForm<PatientStep1FormData>({
    resolver: zodResolver(patientStep1Schema),
    mode: 'onChange',
  });

  // Step 2: Contact & Address
  const step2Form = useForm<PatientStep2FormData>({
    resolver: zodResolver(patientStep2Schema),
    mode: 'onChange',
  });

  // Step 3: Emergency Contact
  const step3Form = useForm<PatientStep3FormData>({
    resolver: zodResolver(patientStep3Schema),
    mode: 'onChange',
  });

  // Step 4: Additional Info
  const step4Form = useForm<PatientStep4FormData>({
    resolver: zodResolver(patientStep4Schema),
    mode: 'onChange',
  });

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await step1Form.trigger();
      if (!isValid) return;
      setAllStepsData(prev => ({
        ...prev,
        ...step1Form.getValues(),
      }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const isValid = await step2Form.trigger();
      if (!isValid) return;
      setAllStepsData(prev => ({
        ...prev,
        ...step2Form.getValues(),
      }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const isValid = await step3Form.trigger();
      if (!isValid) return;
      setAllStepsData(prev => ({
        ...prev,
        ...step3Form.getValues(),
      }));
      setCurrentStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate step 4
    const isValid = await step4Form.trigger();
    if (!isValid) return;

    const finalData: PatientFormData = {
      ...allStepsData,
      ...step4Form.getValues(),
    } as PatientFormData;

    // Validate complete form
    try {
      const validatedData = patientFormDataSchema.parse(finalData);
      if (onSuccess) {
        onSuccess(validatedData);
      }
      handleClose();
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setAllStepsData({});
    step1Form.reset();
    step2Form.reset();
    step3Form.reset();
    step4Form.reset();
    onClose();
  };

  const getStepProgress = () => {
    return Math.round(((currentStep - 1) / 4) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) return; }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Register New Patient - Step {currentStep} of 4</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{REGISTRATION_STEPS[currentStep - 1].title}</span>
            <span>{getStepProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{REGISTRATION_STEPS[currentStep - 1].description}</p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && <Step1Form form={step1Form} />}

          {/* STEP 2: Contact & Address */}
          {currentStep === 2 && <Step2Form form={step2Form} />}

          {/* STEP 3: Emergency Contact */}
          {currentStep === 3 && <Step3Form form={step3Form} />}

          {/* STEP 4: Additional Info */}
          {currentStep === 4 && <Step4Form form={step4Form} />}

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handlePreviousStep}
              disabled={isLoading}
            >
              {currentStep === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4 mr-2" /> Previous</>}
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Creating Patient...' : 'Register Patient'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// STEP 1: BASIC INFO
// ============================================================================
const Step1Form = ({ form }: { form: any }) => {
  const { register, formState: { errors }, watch } = form;
  const indigenousFlag = watch('indigenous_flag');

  return (
    <div className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Last Name *"
          error={errors.last_name}
          {...register('last_name')}
          placeholder="e.g., Dela Cruz"
        />
        <FormField
          label="First Name *"
          error={errors.first_name}
          {...register('first_name')}
          placeholder="e.g., Juan"
        />
        <FormField
          label="Middle Name"
          error={errors.middle_name}
          {...register('middle_name')}
          placeholder="e.g., Santos"
        />
        <FormField
          label="Suffix"
          error={errors.suffix_name}
          {...register('suffix_name')}
          placeholder="e.g., Jr, III"
        />
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Date of Birth *"
          type="date"
          error={errors.birthdate}
          {...register('birthdate')}
        />
        <SelectField
          label="Gender *"
          error={errors.gender}
          {...register('gender')}
          options={[{ value: '', label: 'Select Gender' }, ...GENDER_OPTIONS]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField
          label="Civil Status"
          error={errors.civil_status}
          {...register('civil_status')}
          options={[{ value: '', label: 'Select Status' }, ...MARITAL_STATUS_OPTIONS]}
        />
        <SelectField
          label="Blood Type"
          error={errors.blood_type}
          {...register('blood_type')}
          options={[{ value: '', label: 'Select Blood Type' }, ...BLOOD_TYPE_OPTIONS]}
        />
        <SelectField
          label="PWD Type"
          error={errors.pwd_type}
          {...register('pwd_type')}
          options={[{ value: '', label: 'Select PWD Type' }, ...PWD_TYPE_OPTIONS]}
        />
      </div>

      {/* Indigenous */}
      <div className="pt-2 border-t">
        <CheckboxField
          label="Indigenous Person"
          {...register('indigenous_flag')}
        />
        {indigenousFlag && (
          <div className="mt-2">
            <FormField
              label="Indigenous Group"
              error={errors.indigenous_group}
              {...register('indigenous_group')}
              placeholder="e.g., Ilocano, Bicolano"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STEP 2: CONTACT & ADDRESS
// ============================================================================
const Step2Form = ({ form }: { form: any }) => {
  const { register, formState: { errors }, watch, setValue } = form;
  const selectedRegion = watch('address_state');
  const selectedProvince = watch('address_district');
  const selectedCity = watch('address_city');

  // Check if cascading data exists for the selected values
  const regionArr = Array.isArray(addressData.regions) ? addressData.regions : [];
  const provinces = selectedRegion && (addressData.provinces as Record<string, any[]>)?.[selectedRegion];
  const cities = selectedProvince && (addressData.cities as Record<string, any[]>)?.[selectedProvince];
  const barangays = selectedCity && (addressData.barangays as Record<string, string[]>)?.[selectedCity];

  const hasProvinces = Array.isArray(provinces) && provinces.length > 0;
  const hasCities = Array.isArray(cities) && cities.length > 0;
  const hasBarangays = Array.isArray(barangays) && barangays.length > 0;

  return (
    <div className="space-y-4">
      <FormField
        label="Mobile Number *"
        error={errors.mobile_number}
        {...register('mobile_number')}
        placeholder="e.g., 09123456789"
      />

      <div className="pt-4 border-t">
        <h4 className="text-sm font-semibold mb-4">Address (PSGC)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SelectField
            label="Region"
            error={errors.address_state}
            {...register('address_state', {
              onChange: () => {
                setValue('address_district', '');
                setValue('address_city', '');
                setValue('address_line', '');
              },
            })}
            options={[
              { value: '', label: 'Select Region' },
              ...regionArr.map((r: any) => ({
                value: r.code,
                label: r.name,
              })),
            ]}
          />
          {hasProvinces ? (
            <SelectField
              label="Province"
              error={errors.address_district}
              {...register('address_district', {
                onChange: () => {
                  setValue('address_city', '');
                  setValue('address_line', '');
                },
              })}
              options={[
                { value: '', label: 'Select Province' },
                ...provinces.map((p: any) => ({
                  value: p.code,
                  label: p.name,
                })),
              ]}
            />
          ) : (
            <FormField
              label="Province"
              error={errors.address_district}
              {...register('address_district')}
              placeholder="Enter province name"
              disabled={!selectedRegion}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasCities ? (
            <SelectField
              label="City/Municipality *"
              error={errors.address_city}
              {...register('address_city', {
                onChange: () => {
                  setValue('address_line', '');
                },
              })}
              options={[
                { value: '', label: 'Select City/Municipality' },
                ...cities.map((c: any) => ({
                  value: c.code,
                  label: c.name,
                })),
              ]}
            />
          ) : (
            <FormField
              label="City/Municipality *"
              error={errors.address_city}
              {...register('address_city')}
              placeholder="Enter city/municipality name"
              disabled={!selectedProvince}
            />
          )}
          {hasBarangays ? (
            <SelectField
              label="Barangay *"
              error={errors.address_line}
              {...register('address_line')}
              options={[
                { value: '', label: 'Select Barangay' },
                ...barangays.map((b: string) => ({
                  value: b,
                  label: b,
                })),
              ]}
            />
          ) : (
            <FormField
              label="Barangay *"
              error={errors.address_line}
              {...register('address_line')}
              placeholder="Enter barangay name"
              disabled={!selectedCity}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Postal Code"
          error={errors.address_postal_code}
          {...register('address_postal_code')}
          placeholder="e.g., 1234"
        />
        <FormField
          label="Country"
          error={errors.address_country}
          {...register('address_country')}
          placeholder="e.g., Philippines"
        />
      </div>
    </div>
  );
};

// ============================================================================
// STEP 3: EMERGENCY CONTACT
// ============================================================================
const Step3Form = ({ form }: { form: any }) => {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Emergency Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Contact First Name *"
          error={errors.contact_first_name}
          {...register('contact_first_name')}
          placeholder="e.g., Maria"
        />
        <FormField
          label="Contact Last Name *"
          error={errors.contact_last_name}
          {...register('contact_last_name')}
          placeholder="e.g., Dela Cruz"
        />
        <FormField
          label="Contact Mobile Number *"
          error={errors.contact_mobile_number}
          {...register('contact_mobile_number')}
          placeholder="e.g., 09123456789"
        />
        <SelectField
          label="Relationship"
          error={errors.contact_relationship}
          {...register('contact_relationship')}
          options={[{ value: '', label: 'Select Relationship' }, ...CONTACT_RELATIONSHIP_OPTIONS]}
        />
      </div>
    </div>
  );
};

// ============================================================================
// STEP 4: ADDITIONAL INFO
// ============================================================================
const Step4Form = ({ form }: { form: any }) => {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Nationality"
          error={errors.nationality}
          {...register('nationality')}
          placeholder="e.g., Filipino"
        />
        <SelectField
          label="Religion"
          error={errors.religion}
          {...register('religion')}
          options={[{ value: '', label: 'Select Religion' }, ...RELIGION_OPTIONS]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Occupation"
          error={errors.occupation}
          {...register('occupation')}
          placeholder="e.g., Teacher, Engineer"
        />
        <FormField
          label="Education"
          error={errors.education}
          {...register('education')}
          placeholder="e.g., Bachelor's Degree"
        />
      </div>

      <FormField
        label="PhilHealth ID"
        error={errors.philhealth_id}
        {...register('philhealth_id')}
        placeholder="e.g., PH-123456-789"
      />

      <FormField
        label="Image URL"
        error={errors.image_url}
        {...register('image_url')}
        placeholder="e.g., https://example.com/photo.jpg"
      />

      <div className="pt-2 border-t">
        <CheckboxField
          label="Consent to Data Processing"
          {...register('consent_flag')}
        />
        <p className="text-xs text-gray-500 mt-1">
          I consent to the processing and storage of my personal health information
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE FORM FIELDS
// ============================================================================
const FormField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: any }
>(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Input
      ref={ref}
      className={error ? 'border-red-500' : ''}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error.message}</p>}
  </div>
));
FormField.displayName = 'FormField';

const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: any;
    options: Array<{ value: string; label: string }>;
  }
>(({ label, error, options, className, ...props }, ref) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      ref={ref}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error.message}</p>}
  </div>
));
SelectField.displayName = 'SelectField';

const CheckboxField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: any }
>(({ label, error, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <input
      ref={ref}
      type="checkbox"
      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      {...props}
    />
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {error && <p className="text-xs text-red-500">{error.message}</p>}
  </div>
));
CheckboxField.displayName = 'CheckboxField';
