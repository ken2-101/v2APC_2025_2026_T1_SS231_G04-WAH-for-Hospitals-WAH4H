import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    if (isLoading) return;
    const demoEmail = 'doctor@gmail.com';
    const demoPassword = 'doctor123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    const success = await login(demoEmail, demoPassword);
    if (success) navigate('/dashboard');
  };

  const handleForgotPassword = () => {
    alert('Demo credentials:\nEmail: demo@hospital.com\nPassword: demo123');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#e4ebff] relative overflow-hidden p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-blue-50/40 dark:bg-background/95 -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#e4ebff] rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#e4ebff] rounded-full blur-3xl animate-pulse delay-700 -z-10" />
      
      {/* Decorative Wave/Mesh (Optional) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />

      <Card className="w-full mx-4 md:mx-0 max-w-[90%] md:max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 ease-out">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
            {/* Using Lucide Icon as placeholder if image fails, or wrapping image */}
            <div className="relative flex items-center justify-center">
                 <img src="/wah_logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} />
                 <Activity className="w-8 h-8 text-white hidden fallback-icon-target" /> 
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Portal Access for Medical Staff
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
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
              {errors.email && <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80">Password</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" 
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
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
              {errors.password && <p className="text-xs font-medium text-destructive animate-in slide-in-from-left-1">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-base" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/50 backdrop-blur-xl px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-11 border-primary/20 hover:bg-accent/5 hover:text-primary transition-colors" 
            onClick={handleDemoLogin} 
            disabled={isLoading}
          >
            <Activity className="mr-2 h-4 w-4" />
            Launch Demo Environment
          </Button>

          <div className="text-center pt-2">
            <Button 
              variant="link" 
              className="text-primary font-semibold transition-all duration-200 hover:scale-105 hover:underline decoration-primary/50 underline-offset-4" 
              onClick={() => navigate('/register')}
            >
              Don't have an account? Register access
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

export default Login;
