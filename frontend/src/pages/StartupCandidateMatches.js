import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Sparkles,
  User,
  Briefcase,
  TrendingUp,
  Target,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Calendar
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StartupCandidateMatches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    if (user?.role !== 'startup') {
      toast.error('This feature is only for startups');
      navigate('/dashboard');
      return;
    }
    if (jobId) {
      fetchCandidateMatches();
    }
  }, [jobId]);

  const fetchCandidateMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ai/candidate-matches/${jobId}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMatches(response.data);
      setJobDetails({ title: response.data.job_title });
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Please set candidate preferences for this job first');
        navigate('/hiring');
      } else if (error.response?.status === 404) {
        toast.error('Job not found');
        navigate('/hiring');
      } else {
        toast.error('Failed to load candidate matches');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Finding the best candidates for you...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matches) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/hiring')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
                AI Candidate Matches
              </h1>
              <p className="text-lg text-slate-600">
                For: <span className="font-semibold">{matches.job_title}</span>
              </p>
              <p className="text-slate-500">
                Found {matches.total_candidates} candidates
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">AI-Powered Ranking</h3>
                <p className="text-purple-100 leading-relaxed">
                  Candidates are ranked based on skills match, experience alignment, availability, and career goals. 
                  Each profile includes strengths, gaps, and AI-generated interview questions.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Candidate Cards */}
        <div className="grid gap-6">
          {matches.matches.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border-2 border-slate-200">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No candidates found yet
              </h3>
              <p className="text-slate-600 mb-6">
                Wait for job seekers to complete their profiles, or adjust your candidate preferences
              </p>
            </Card>
          ) : (
            matches.matches.map((candidate, idx) => (
              <Card
                key={candidate.user_id}
                className="p-6 rounded-3xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 font-bold text-white text-lg`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-slate-800">
                            {candidate.user_name}
                          </h3>
                          <Badge className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(candidate.match_score)}`}>
                            {candidate.match_score}% Match
                          </Badge>
                        </div>

                        {/* Match Scores */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Skills</div>
                            <div className="text-lg font-bold text-slate-800">{candidate.skill_match}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Experience</div>
                            <div className="text-lg font-bold text-slate-800">{candidate.experience_match}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Availability</div>
                            <div className="text-lg font-bold text-slate-800">{candidate.availability_match}%</div>
                          </div>
                        </div>

                        {/* Strengths */}
                        {candidate.strengths.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Strengths
                            </h4>
                            <div className="space-y-2">
                              {candidate.strengths.map((strength, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-slate-700">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gaps */}
                        {candidate.gaps.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              Development Areas
                            </h4>
                            <div className="space-y-2">
                              {candidate.gaps.map((gap, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-slate-700">{gap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interview Questions */}
                        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            AI-Generated Interview Questions
                          </h4>
                          <div className="space-y-2">
                            {candidate.suggested_questions.map((question, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-purple-600 font-semibold flex-shrink-0">{idx + 1}.</span>
                                <span className="text-sm text-slate-700">{question}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => navigate(`/chat/${candidate.user_id}`)}
                      className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
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
