import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { UserRole } from '@/contexts/RoleContext';
import { ROLE_OPTIONS } from '@/lib/roleUtils';
import { cn } from '@/lib/utils';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Please enter a valid email';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!role) newErrors.role = 'Please select your role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await register({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role: role as UserRole,
    });

    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#e4ebff] relative overflow-hidden p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-blue-50/40 dark:bg-background/95 -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#e4ebff] rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#e4ebff] rounded-full blur-3xl animate-pulse delay-700 -z-10" />
      
      {/* Decorative Wave/Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />

      <Card className="w-full mx-4 md:mx-0 max-w-[95%] md:max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 ease-out">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
            <UserPlus className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Join WAH4H
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground/80">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn(
                    "h-11 bg-background/50 border-input transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                    errors.firstName && "border-destructive ring-destructive/20"
                  )}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground/80">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={cn(
                    "h-11 bg-background/50 border-input transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                    errors.lastName && "border-destructive ring-destructive/20"
                  )}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "h-11 bg-background/50 border-input transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                  errors.email && "border-destructive ring-destructive/20"
                )}
                placeholder="doctor@hospital.com"
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className={cn(
                  "h-11 bg-background/50 border-input transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                  errors.role && "border-destructive ring-destructive/20"
                )}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-11 bg-background/50 border-input pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                    errors.password && "border-destructive ring-destructive/20"
                  )}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-11 bg-background/50 border-input pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                    errors.confirmPassword && "border-destructive ring-destructive/20"
                  )}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Button 
                variant="link" 
                className="text-primary font-semibold transition-all duration-200 hover:scale-105 hover:underline decoration-primary/50 underline-offset-4"
                onClick={() => navigate('/login')}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer / Copyright */}
      <div className="mt-8 text-center w-full text-xs text-muted-foreground/50">
        © 2026 WAH4Hospitals System. Secure Enterprise Portal.
      </div>
    </div>
  );
};

export default Register;
