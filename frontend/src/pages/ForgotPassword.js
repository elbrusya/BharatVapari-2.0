import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { Sparkles, ArrowLeft, Mail, Key, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password');

  // Forgot Password State
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Email State
  const [fullName, setFullName] = useState('');
  const [foundAccounts, setFoundAccounts] = useState([]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      setGeneratedCode(response.data.reset_code);
      setShowResetForm(true);
      toast.success('Reset code generated! (Check below)');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        email,
        reset_code: resetCode,
        new_password: newPassword,
      });
      toast.success('Password reset successfully! You can now login');
      navigate('/auth');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleFindEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/find-email?full_name=${encodeURIComponent(fullName)}`);
      setFoundAccounts(response.data.accounts || []);
      if (response.data.accounts?.length > 0) {
        toast.success(response.data.message);
      } else {
        toast.error('No accounts found with that name');
      }
    } catch (error) {
      toast.error('Failed to find accounts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/auth" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
              BharatVapari
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
            Account Recovery
          </h1>
          <p className="text-slate-600">Recover your account credentials</p>
        </div>

        {/* Tabs */}
        <Card className="p-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="password" data-testid="forgot-password-tab">
                <Key className="w-4 h-4 mr-2" />
                Forgot Password
              </TabsTrigger>
              <TabsTrigger value="email" data-testid="forgot-email-tab">
                <Mail className="w-4 h-4 mr-2" />
                Forgot Email
              </TabsTrigger>
            </TabsList>

            {/* Forgot Password Tab */}
            <TabsContent value="password">
              {!showResetForm ? (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      data-testid="forgot-password-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="mt-2 h-12 rounded-xl"
                    />
                    <p className="text-sm text-slate-600 mt-2">
                      Enter your email address and we'll send you a reset code
                    </p>
                  </div>

                  <Button
                    type="submit"
                    data-testid="request-reset-code-button"
                    disabled={loading}
                    className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {loading ? 'Generating...' : 'Get Reset Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-medium text-amber-800 mb-2">Your Reset Code:</p>
                    <p className="text-2xl font-bold text-amber-900 tracking-wider">{generatedCode}</p>
                    <p className="text-xs text-amber-700 mt-2">
                      In production, this would be sent to your email. Code expires in 10 minutes.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="resetCode" className="text-sm font-medium">
                      Reset Code
                    </Label>
                    <Input
                      id="resetCode"
                      data-testid="reset-code-input"
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      data-testid="new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter strong password"
                      className="mt-2 h-12 rounded-xl"
                    />
                    <p className="text-xs text-slate-600 mt-2">
                      Must be 8+ characters with uppercase, lowercase, number & special character
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetCode('');
                        setNewPassword('');
                        setGeneratedCode('');
                      }}
                      variant="outline"
                      className="flex-1 h-12 rounded-full"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      data-testid="submit-reset-password-button"
                      disabled={loading}
                      className="flex-1 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            {/* Forgot Email Tab */}
            <TabsContent value="email">
              <form onSubmit={handleFindEmail} className="space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    data-testid="find-email-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="mt-2 h-12 rounded-xl"
                  />
                  <p className="text-sm text-slate-600 mt-2">
                    We'll search for accounts matching your name
                  </p>
                </div>

                <Button
                  type="submit"
                  data-testid="find-email-button"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  {loading ? 'Searching...' : 'Find My Email'}
                </Button>
              </form>

              {foundAccounts.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-slate-700">Found Accounts:</p>
                  {foundAccounts.map((account, idx) => (
                    <Card key={idx} className="p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-sm text-slate-600">{account.email}</p>
                          <p className="text-xs text-amber-600">{account.hint}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}