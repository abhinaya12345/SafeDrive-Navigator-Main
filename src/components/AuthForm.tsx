import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (success) {
          toast.success('Welcome back!');
          navigate('/map');
        } else {
          toast.error('Invalid credentials. Please try again.');
        }
      } else if (mode === 'signup') {
        const success = await signup(email, password, name);
        if (success) {
          toast.success('Account created successfully!');
          navigate('/map');
        } else {
          toast.error('Signup failed. Please check your details.');
        }
      } else if (mode === 'forgot') {
        const success = await resetPassword(email);
        if (success) {
          setVerificationSent(true);
          toast.success('Password reset link sent to your email!');
        } else {
          toast.error('Please enter a valid email address.');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setVerificationSent(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="glass-panel p-8 space-y-6">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center mb-4"
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold gradient-text">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' && 'Sign in to access RoadGuard AI'}
            {mode === 'signup' && 'Join RoadGuard AI for safer journeys'}
            {mode === 'forgot' && 'Enter your email to reset password'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 mx-auto bg-risk-safe/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-risk-safe" />
              </div>
              <p className="text-foreground">Check your email for the reset link!</p>
              <Button variant="ghost" onClick={() => switchMode('login')}>
                Back to Login
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-secondary border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-secondary border-border focus:border-primary"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="glow"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center text-sm">
          {mode === 'login' && (
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p className="text-muted-foreground">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
