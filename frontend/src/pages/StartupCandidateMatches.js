import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Calendar,
  Check,
  X,
  Video,
  Phone,
  MapPin
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StartupCandidateMatches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Interview form
  const [interviewForm, setInterviewForm] = useState({
    interview_date: '',
    interview_time: '',
    interview_type: 'video',
    location: '',
    meeting_link: '',
    notes: ''
  });
  
  // Rejection form
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  
  // Candidate statuses
  const [candidateStatuses, setCandidateStatuses] = useState({});

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
      
      // Fetch status for each candidate
      const statuses = {};
      for (const candidate of response.data.matches) {
        const statusRes = await axios.get(`${API}/candidates/${candidate.user_id}/status/${jobId}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        statuses[candidate.user_id] = statusRes.data;
      }
      setCandidateStatuses(statuses);
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

  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      // Make accept decision
      await axios.post(
        `${API}/candidates/${selectedCandidate.user_id}/decision?job_id=${jobId}`,
        { decision: 'accepted', notes: interviewForm.notes },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Schedule interview if date is provided
      if (interviewForm.interview_date && interviewForm.interview_time) {
        await axios.post(
          `${API}/candidates/${selectedCandidate.user_id}/interview?job_id=${jobId}`,
          interviewForm,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        toast.success(`Candidate accepted and interview scheduled!`);
      } else {
        toast.success(`Candidate accepted successfully!`);
      }
      
      setShowAcceptModal(false);
      setInterviewForm({
        interview_date: '',
        interview_time: '',
        interview_type: 'video',
        location: '',
        meeting_link: '',
        notes: ''
      });
      
      // Refresh statuses
      fetchCandidateMatches();
    } catch (error) {
      toast.error('Failed to accept candidate');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/candidates/${selectedCandidate.user_id}/decision?job_id=${jobId}`,
        { 
          decision: 'rejected', 
          rejection_reason: rejectionReason,
          notes: rejectionNotes 
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      toast.success('Candidate decision recorded');
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectionNotes('');
      
      // Refresh statuses
      fetchCandidateMatches();
    } catch (error) {
      toast.error('Failed to reject candidate');
    }
  };

  const getCandidateStatus = (candidateId) => {
    return candidateStatuses[candidateId]?.decision?.decision || 'pending';
  };

  const getStatusBadge = (status) => {
    const badges = {
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-300' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-300' },
      pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    };
    const badge = badges[status] || badges.pending;
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
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
                  <div className="flex flex-col gap-3 min-w-[180px]">
                    {/* Status Badge */}
                    <div className="text-center">
                      {getStatusBadge(getCandidateStatus(candidate.user_id))}
                    </div>
                    
                    {getCandidateStatus(candidate.user_id) === 'pending' ? (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowAcceptModal(true);
                          }}
                          className="rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 whitespace-nowrap"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowRejectModal(true);
                          }}
                          variant="outline"
                          className="rounded-full border-2 border-red-600 text-red-600 hover:bg-red-50 whitespace-nowrap"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      candidateStatuses[candidate.user_id]?.interviews?.length > 0 && (
                        <div className="text-xs text-center p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                          <span className="text-blue-600 font-medium">
                            Interview Scheduled
                          </span>
                        </div>
                      )
                    )}
                    
                    <Button
                      onClick={() => navigate(`/chat/${candidate.user_id}`)}
                      variant="outline"
                      className="rounded-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 whitespace-nowrap"
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

        {/* Accept Modal */}
        <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <Check className="w-6 h-6 text-green-600" />
                Accept Candidate & Schedule Interview
              </DialogTitle>
              <p className="text-slate-600 mt-2">
                Accept <span className="font-semibold">{selectedCandidate?.user_name}</span> and optionally schedule an interview
              </p>
            </DialogHeader>
            <form onSubmit={handleAccept} className="space-y-6 mt-4">
              {/* Interview Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interview_date" className="text-base font-semibold">Interview Date (Optional)</Label>
                  <Input
                    id="interview_date"
                    type="date"
                    value={interviewForm.interview_date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })}
                    className="mt-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="interview_time" className="text-base font-semibold">Interview Time</Label>
                  <Input
                    id="interview_time"
                    type="time"
                    value={interviewForm.interview_time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interview_time: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Interview Type</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'video', label: 'Video Call', icon: Video },
                    { value: 'phone', label: 'Phone', icon: Phone },
                    { value: 'in-person', label: 'In Person', icon: MapPin }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInterviewForm({ ...interviewForm, interview_type: value })}
                      className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                        interviewForm.interview_type === value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-300 hover:border-purple-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Link (for video) */}
              {interviewForm.interview_type === 'video' && (
                <div>
                  <Label htmlFor="meeting_link" className="text-base font-semibold">Meeting Link</Label>
                  <Input
                    id="meeting_link"
                    type="url"
                    value={interviewForm.meeting_link}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="mt-2"
                  />
                </div>
              )}

              {/* Location (for in-person) */}
              {interviewForm.interview_type === 'in-person' && (
                <div>
                  <Label htmlFor="location" className="text-base font-semibold">Location</Label>
                  <Input
                    id="location"
                    value={interviewForm.location}
                    onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                    placeholder="Office address or meeting location"
                    className="mt-2"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-semibold">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  placeholder="Any additional information for the candidate..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                >
                  Accept Candidate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <X className="w-6 h-6 text-red-600" />
                Reject Candidate
              </DialogTitle>
              <p className="text-slate-600 mt-2">
                Reject <span className="font-semibold">{selectedCandidate?.user_name}</span> for this position
              </p>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-6 mt-4">
              {/* Rejection Reason */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Reason (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Skills mismatch',
                    'Experience level',
                    'Salary expectations',
                    'Other candidates better fit',
                    'Position filled'
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        rejectionReason === reason
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-slate-300 hover:border-red-600'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Notes */}
              <div>
                <Label htmlFor="rejection_notes" className="text-base font-semibold">
                  Feedback (Optional - will be shared with candidate)
                </Label>
                <Textarea
                  id="rejection_notes"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Constructive feedback for the candidate..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
