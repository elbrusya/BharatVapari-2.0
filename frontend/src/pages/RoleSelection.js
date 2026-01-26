import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Briefcase, Users, GraduationCap, Building, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RoleSelection({ sessionId, userData }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    { 
      value: 'startup', 
      label: 'Startup', 
      icon: Building, 
      color: 'indigo',
      description: 'Post jobs and build your team'
    },
    { 
      value: 'job_seeker', 
      label: 'Job Seeker', 
      icon: Briefcase, 
      color: 'amber',
      description: 'Find opportunities at startups'
    },
    { 
      value: 'mentor', 
      label: 'Mentor', 
      icon: GraduationCap, 
      color: 'teal',
      description: 'Guide aspiring entrepreneurs'
    },
    { 
      value: 'mentee', 
      label: 'Mentee', 
      icon: Users, 
      color: 'purple',
      description: 'Learn from experienced mentors'
    },
  ];

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select your role');
      return;
    }

    setLoading(true);

    try {
      // Complete registration with selected role
      const response = await axios.post(
        `${API}/auth/google/session`,
        { role: selectedRole },
        {
          headers: {
            'X-Session-ID': sessionId,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success(`Welcome to BharatVapari as a ${roles.find(r => r.value === selectedRole)?.label}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to complete registration');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
              BharatVapari
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
            Welcome, {userData?.name}!
          </h1>
          <p className="text-slate-600 text-lg">Choose your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.value}
                data-testid={`select-role-${role.value}`}
                onClick={() => setSelectedRole(role.value)}
                className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg text-left ${
                  selectedRole === role.value
                    ? `border-${role.color}-500 bg-${role.color}-50 shadow-md`
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedRole === role.value 
                      ? `bg-${role.color}-100` 
                      : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      selectedRole === role.value 
                        ? `text-${role.color}-600` 
                        : 'text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>
                      {role.label}
                    </div>
                    <div className="text-sm text-slate-600">{role.description}</div>
                  </div>
                  {selectedRole === role.value && (
                    <div className={`w-6 h-6 rounded-full bg-${role.color}-500 flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          data-testid="continue-with-role-button"
          className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up your account...' : 'Continue'}
        </Button>

        <p className="text-center text-sm text-slate-500 mt-4">
          You can update your role later in settings
        </p>
      </Card>
    </div>
  );
}