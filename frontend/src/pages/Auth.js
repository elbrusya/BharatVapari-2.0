import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Briefcase, Users, GraduationCap, Building } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('job_seeker');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    return '';
  };

  // Password strength validation
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (!isLogin) {
      setPasswordError(validatePassword(value));
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before submission
    const emailErr = validateEmail(email);
    const passwordErr = !isLogin ? validatePassword(password) : '';

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password, fullName, role);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'startup', label: 'Startup', icon: Building, color: 'indigo' },
    { value: 'job_seeker', label: 'Job Seeker', icon: Briefcase, color: 'amber' },
    { value: 'mentor', label: 'Mentor', icon: GraduationCap, color: 'teal' },
    { value: 'mentee', label: 'Mentee', icon: Users, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
              BharatVapari
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Outfit' }}>
            Your Startup Journey Starts Here
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Join India's fastest-growing platform for startups, talent, and mentors. Build
            connections that matter.
          </p>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="p-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-600">
              {isLogin ? 'Sign in to continue your journey' : 'Join the community today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  data-testid="auth-fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                className={`mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span>⚠</span> {emailError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                data-testid="auth-password-input"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                className={`mt-2 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <span>⚠</span> {passwordError}
                </p>
              )}
              {!isLogin && !passwordError && password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-600">Password must contain:</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One lowercase letter
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : ''}>✓ One number</li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <Label className="text-sm font-medium mb-3 block">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        data-testid={`role-${r.value}-button`}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          role === r.value
                            ? `border-${r.color}-500 bg-${r.color}-50`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${role === r.value ? `text-${r.color}-600` : 'text-slate-400'}`} />
                        <div className="text-sm font-medium">{r.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              data-testid="auth-submit-button"
              disabled={loading}
              className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="auth-toggle-button"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}