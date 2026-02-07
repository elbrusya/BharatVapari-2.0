import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Loader2,
  Settings,
  RefreshCw,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIMatches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(null);
  const [activeFilter, setActiveFilter] = useState('best');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'job_seeker') {
      toast.error('This feature is only for job seekers');
      navigate('/dashboard');
      return;
    }
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ai/job-matches`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMatches(response.data);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Please complete your preferences first');
        navigate('/ai-preferences');
      } else {
        toast.error('Failed to load matches');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
    toast.success('Matches refreshed!');
  };

  const getMatchIcon = (category) => {
    switch (category) {
      case 'best':
        return <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
      case 'good':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'stretch':
        return <Target className="w-5 h-5 text-purple-500" />;
      default:
        return <Briefcase className="w-5 h-5 text-slate-500" />;
    }
  };

  const getMatchColor = (category) => {
    switch (category) {
      case 'best':
        return 'from-yellow-500 to-orange-500';
      case 'good':
        return 'from-blue-500 to-indigo-500';
      case 'stretch':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Finding your perfect matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matches) return null;

  const displayMatches = 
    activeFilter === 'best' ? matches.best_matches :
    activeFilter === 'good' ? matches.good_matches :
    matches.stretch_matches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
                Your AI-Powered Job Matches
              </h1>
              <p className="text-slate-600">
                Found {matches.total_matches} opportunities matching your preferences
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/ai-preferences')}
                variant="outline"
                className="rounded-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* AI Insights */}
          {matches.ai_insights && (
            <Card className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">AI Insights</h3>
                  <p className="text-blue-100 leading-relaxed whitespace-pre-line">
                    {matches.ai_insights}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveFilter('best')}
            variant={activeFilter === 'best' ? 'default' : 'outline'}
            className={`rounded-full ${
              activeFilter === 'best'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'border-2 border-slate-300'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            Best Matches ({matches.best_matches.length})
          </Button>
          <Button
            onClick={() => setActiveFilter('good')}
            variant={activeFilter === 'good' ? 'default' : 'outline'}
            className={`rounded-full ${
              activeFilter === 'good'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                : 'border-2 border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Good Matches ({matches.good_matches.length})
          </Button>
          <Button
            onClick={() => setActiveFilter('stretch')}
            variant={activeFilter === 'stretch' ? 'default' : 'outline'}
            className={`rounded-full ${
              activeFilter === 'stretch'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'border-2 border-slate-300'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Stretch Opportunities ({matches.stretch_matches.length})
          </Button>
        </div>

        {/* Job Cards */}
        <div className="grid gap-6">
          {displayMatches.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border-2 border-slate-200">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No {activeFilter} matches found
              </h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your preferences or check other match categories
              </p>
              <Button
                onClick={() => navigate('/ai-preferences')}
                className="rounded-full"
              >
                Update Preferences
              </Button>
            </Card>
          ) : (
            displayMatches.map((match) => (
              <Card
                key={match.job_id}
                className="p-6 rounded-3xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getMatchColor(match.match_category)} flex items-center justify-center flex-shrink-0`}>
                        {getMatchIcon(match.match_category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {match.job_title}
                          </h3>
                          <Badge className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(match.match_score)}`}>
                            {match.match_score}% Match
                          </Badge>
                        </div>
                        <p className="text-lg text-slate-600 font-medium mb-3">
                          {match.company}
                        </p>

                        {/* Match Reasons */}
                        <div className="space-y-2 mb-4">
                          {match.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              {reason.startsWith('✅') ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="text-sm text-slate-700">
                                {reason.replace('✅', '').replace('⚠️', '').trim()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Match Scores */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Skills</div>
                            <div className="text-lg font-bold text-slate-800">{match.skill_match}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Salary</div>
                            <div className="text-lg font-bold text-slate-800">{match.salary_match}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Location</div>
                            <div className="text-lg font-bold text-slate-800">{match.location_match}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Experience</div>
                            <div className="text-lg font-bold text-slate-800">{match.experience_match}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link to={`/hiring/${match.job_id}`}>
                      <Button className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 whitespace-nowrap">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
