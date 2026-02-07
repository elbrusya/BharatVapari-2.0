import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { Briefcase, Users, MessageCircle, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, applications: 0, sessions: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [checkingPreferences, setCheckingPreferences] = useState(true);

  useEffect(() => {
    fetchStats();
    if (user?.role === 'job_seeker') {
      checkPreferences();
    }
  }, [user]);

  const checkPreferences = async () => {
    try {
      const response = await api.get('/ai/job-seeker-preferences');
      if (response.data.exists && response.data.preferences.completed) {
        setHasPreferences(true);
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
    } finally {
      setCheckingPreferences(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [jobsRes, appsRes, sessionsRes, convsRes] = await Promise.all([
        api.getJobs(0, 5),
        api.getMyApplications(),
        api.getMySessions(),
        api.getConversations(),
      ]);

      setStats({
        jobs: jobsRes.data.length,
        applications: appsRes.data.length,
        sessions: sessionsRes.data.length,
        messages: convsRes.data.length,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      startup: { label: 'Startup', color: 'bg-indigo-100 text-indigo-700' },
      job_seeker: { label: 'Job Seeker', color: 'bg-amber-100 text-amber-700' },
      mentor: { label: 'Mentor', color: 'bg-teal-100 text-teal-700' },
      mentee: { label: 'Mentee', color: 'bg-purple-100 text-purple-700' },
    };
    const badge = badges[role] || badges.job_seeker;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
                Welcome back, {user?.full_name?.split(' ')[0]}!
              </h1>
              <div className="flex items-center gap-3">
                {getRoleBadge(user?.role)}
                {!user?.profile_complete && (
                  <span className="text-sm text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Complete your profile
                  </span>
                )}
              </div>
            </div>
            <Link to="/profile">
              <Button
                data-testid="complete-profile-button"
                className="rounded-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {user?.profile_complete ? 'Edit Profile' : 'Complete Profile'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
              {stats.applications}
            </div>
            <div className="text-sm text-slate-600">Active Applications</div>
          </Card>

          <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
              {stats.sessions}
            </div>
            <div className="text-sm text-slate-600">Mentorship Sessions</div>
          </Card>

          <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-amber-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
              {stats.messages}
            </div>
            <div className="text-sm text-slate-600">Active Conversations</div>
          </Card>

          <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
              {stats.jobs}
            </div>
            <div className="text-sm text-slate-600">Available Jobs</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* AI Matching Card - For Job Seekers */}
          {user?.role === 'job_seeker' && (
            <Card className="p-8 rounded-2xl border-l-4 border-l-blue-500 border border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }}>
                      AI Job Matching
                    </h3>
                    {!hasPreferences && !checkingPreferences && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mb-4">
                    {hasPreferences 
                      ? 'View your personalized AI-powered job recommendations tailored to your profile'
                      : 'Get personalized job recommendations powered by AI that match your skills, preferences, and career goals'
                    }
                  </p>
                  {checkingPreferences ? (
                    <Button
                      disabled
                      className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg opacity-50"
                    >
                      Loading...
                    </Button>
                  ) : hasPreferences ? (
                    <Link to="/ai-matches">
                      <Button
                        data-testid="goto-ai-matches-button"
                        className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                      >
                        View My Matches
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/ai-preferences">
                      <Button
                        data-testid="goto-ai-matching-button"
                        className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                      >
                        Start AI Matching
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* AI Candidate Matching Card - For Startups */}
          {user?.role === 'startup' && (
            <Card className="p-8 rounded-2xl border-l-4 border-l-purple-500 border border-slate-200 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }}>
                      AI Candidate Matching
                    </h3>
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Find the perfect candidates for your jobs using AI-powered matching. Get ranked candidates with compatibility scores and interview suggestions.
                  </p>
                  <Link to="/hiring">
                    <Button
                      data-testid="goto-ai-candidate-matching-button"
                      className="rounded-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                    >
                      View Your Jobs
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500 mt-3">
                    💡 Tip: Set candidate preferences when posting jobs to unlock AI matching
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-8 rounded-2xl border-l-4 border-l-indigo-500 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Outfit' }}>
                  Hiring Portal
                </h3>
                <p className="text-slate-600 mb-4">
                  {user?.role === 'startup'
                    ? 'Post jobs and find the perfect talent for your team'
                    : 'Browse opportunities and apply to exciting roles'}
                </p>
                <Link to="/hiring">
                  <Button
                    data-testid="goto-hiring-button"
                    className="rounded-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {user?.role === 'startup' ? 'Post a Job' : 'Browse Jobs'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-2xl border-l-4 border-l-teal-500 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-green-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Outfit' }}>
                  Mentorship Portal
                </h3>
                <p className="text-slate-600 mb-4">
                  {user?.role === 'mentor'
                    ? 'Share your expertise and guide the next generation'
                    : 'Connect with experienced mentors to accelerate your growth'}
                </p>
                <Link to="/mentorship">
                  <Button
                    data-testid="goto-mentorship-button"
                    className="rounded-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  >
                    {user?.role === 'mentor' ? 'Setup Profile' : 'Find Mentors'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}