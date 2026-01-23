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

  useEffect(() => {
    fetchStats();
  }, []);

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