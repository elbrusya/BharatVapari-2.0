import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '../utils/api';
import { toast } from 'sonner';
import { Briefcase, MapPin, DollarSign, Clock, Plus, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HiringPortal() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const [selectedJobForPreferences, setSelectedJobForPreferences] = useState(null);

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full-time',
    salary_range: '',
  });

  // AI Preferences form state
  const [preferencesForm, setPreferencesForm] = useState({
    ideal_experience: 'fresher',
    must_have_skills: '',
    good_to_have_skills: '',
    hiring_priorities: [],
    team_size: '',
    startup_stage: '',
    immediate_joiner: false,
    flexibility_days: '',
  });

  // Application form state
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.getJobs();
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...jobForm,
        requirements: jobForm.requirements.split('\n').filter((r) => r.trim()),
      };
      const response = await api.createJob(data);
      toast.success('Job posted successfully!');
      setShowJobForm(false);
      
      // Prompt to set AI preferences
      const newJobId = response.data.job_id || response.data.id;
      if (newJobId) {
        setTimeout(() => {
          toast.info('Set AI preferences to find the best candidates!', { duration: 5000 });
        }, 1000);
      }
      
      setJobForm({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        job_type: 'full-time',
        salary_range: '',
      });
      fetchJobs();
    } catch (error) {
      toast.error('Failed to create job');
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ideal_experience: preferencesForm.ideal_experience,
        must_have_skills: preferencesForm.must_have_skills.split(',').map(s => s.trim()).filter(s => s),
        good_to_have_skills: preferencesForm.good_to_have_skills.split(',').map(s => s.trim()).filter(s => s),
        hiring_priorities: preferencesForm.hiring_priorities,
        team_size: preferencesForm.team_size ? parseInt(preferencesForm.team_size) : null,
        startup_stage: preferencesForm.startup_stage,
        immediate_joiner: preferencesForm.immediate_joiner,
        flexibility_days: preferencesForm.flexibility_days ? parseInt(preferencesForm.flexibility_days) : null,
      };

      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ai/startup-job-preferences/${selectedJobForPreferences.id}`,
        data,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('AI preferences saved! You can now view matched candidates.');
      setShowPreferencesForm(false);
      setPreferencesForm({
        ideal_experience: 'fresher',
        must_have_skills: '',
        good_to_have_skills: '',
        hiring_priorities: [],
        team_size: '',
        startup_stage: '',
        immediate_joiner: false,
        flexibility_days: '',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.response?.data?.detail || 'Failed to save preferences');
    }
  };

  const togglePriority = (priority) => {
    if (preferencesForm.hiring_priorities.includes(priority)) {
      setPreferencesForm({
        ...preferencesForm,
        hiring_priorities: preferencesForm.hiring_priorities.filter(p => p !== priority)
      });
    } else {
      setPreferencesForm({
        ...preferencesForm,
        hiring_priorities: [...preferencesForm.hiring_priorities, priority]
      });
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.applyJob({
        job_id: selectedJob.id,
        cover_letter: coverLetter,
      });
      toast.success('Application submitted!');
      setShowApplicationForm(false);
      setCoverLetter('');
      setSelectedJob(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
  };

  const JobCard = ({ job }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>
              {job.title}
            </h3>
            <p className="text-indigo-600 font-medium">{job.company}</p>
          </div>
          <div className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
            {job.job_type}
          </div>
        </div>

        <p className="text-slate-600 mb-4 line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            {job.location}
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <DollarSign className="w-4 h-4" />
              {job.salary_range}
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>

        {user?.role === 'startup' && job.posted_by === user.id ? (
          <div className="flex gap-2">
            <Button
              data-testid={`set-preferences-${job.id}-button`}
              onClick={() => {
                setSelectedJobForPreferences(job);
                setShowPreferencesForm(true);
              }}
              variant="outline"
              className="flex-1 rounded-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold"
            >
              Set AI Preferences
            </Button>
            <Button
              data-testid={`ai-match-job-${job.id}-button`}
              onClick={() => window.location.href = `/candidate-matches/${job.id}`}
              className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              View Matches
            </Button>
          </div>
        ) : user?.role !== 'startup' && (
          <Button
            data-testid={`apply-job-${job.id}-button`}
            onClick={() => {
              setSelectedJob(job);
              setShowApplicationForm(true);
            }}
            className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            Apply Now
          </Button>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
              Hiring Portal
            </h1>
            <p className="text-slate-600">
              {user?.role === 'startup'
                ? 'Post jobs and find the perfect talent'
                : 'Discover opportunities and apply to exciting roles'}
            </p>
          </div>
          {user?.role === 'startup' && (
            <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
              <DialogTrigger asChild>
                <Button
                  data-testid="post-job-button"
                  className="rounded-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Post a Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                    Post a New Job
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      data-testid="job-title-input"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      data-testid="job-company-input"
                      value={jobForm.company}
                      onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="job-description-input"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      required
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="requirements">Requirements (one per line)</Label>
                    <Textarea
                      id="requirements"
                      data-testid="job-requirements-input"
                      value={jobForm.requirements}
                      onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                      required
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        data-testid="job-location-input"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_range">Salary Range</Label>
                      <Input
                        id="salary_range"
                        data-testid="job-salary-input"
                        value={jobForm.salary_range}
                        onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                        placeholder="e.g., 10-15 LPA"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    data-testid="submit-job-button"
                    className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    Post Job
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No jobs available yet. Check back soon!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Application Dialog */}
        <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                Apply to {selectedJob?.title}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                  id="coverLetter"
                  data-testid="cover-letter-input"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  rows={6}
                  placeholder="Tell us why you're a great fit for this role..."
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                data-testid="submit-application-button"
                className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Application
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Preferences Dialog */}
        <Dialog open={showPreferencesForm} onOpenChange={setShowPreferencesForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <Sparkles className="w-6 h-6 text-purple-600" />
                Set AI Candidate Preferences
              </DialogTitle>
              <p className="text-slate-600 mt-2">
                Help our AI find the perfect candidates for: <span className="font-semibold">{selectedJobForPreferences?.title}</span>
              </p>
            </DialogHeader>
            <form onSubmit={handleSavePreferences} className="space-y-6 mt-4">
              {/* Experience Level */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Ideal Experience Level</Label>
                <div className="flex flex-wrap gap-2">
                  {['fresher', '1-3yrs', '3-5yrs', '5+yrs'].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setPreferencesForm({ ...preferencesForm, ideal_experience: exp })}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        preferencesForm.ideal_experience === exp
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-300 hover:border-purple-600'
                      }`}
                    >
                      {exp === 'fresher' ? 'Fresher' : exp.replace('yrs', ' Years')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Must Have Skills */}
              <div>
                <Label htmlFor="must_have_skills" className="text-base font-semibold">
                  Must-Have Skills <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="must_have_skills"
                  value={preferencesForm.must_have_skills}
                  onChange={(e) => setPreferencesForm({ ...preferencesForm, must_have_skills: e.target.value })}
                  placeholder="e.g., React, Node.js, Python (comma separated)"
                  className="mt-2"
                  required
                />
                <p className="text-sm text-slate-500 mt-1">Enter skills separated by commas</p>
              </div>

              {/* Good to Have Skills */}
              <div>
                <Label htmlFor="good_to_have_skills" className="text-base font-semibold">
                  Good-to-Have Skills
                </Label>
                <Input
                  id="good_to_have_skills"
                  value={preferencesForm.good_to_have_skills}
                  onChange={(e) => setPreferencesForm({ ...preferencesForm, good_to_have_skills: e.target.value })}
                  placeholder="e.g., AWS, Docker, GraphQL (comma separated)"
                  className="mt-2"
                />
              </div>

              {/* Hiring Priorities */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Hiring Priorities (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {['skills', 'culture_fit', 'learning_ability'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => togglePriority(priority)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        preferencesForm.hiring_priorities.includes(priority)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-300 hover:border-purple-600'
                      }`}
                    >
                      {priority.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Startup Stage */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Startup Stage</Label>
                <div className="flex flex-wrap gap-2">
                  {['idea', 'mvp', 'early', 'growth', 'scale'].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setPreferencesForm({ ...preferencesForm, startup_stage: stage })}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        preferencesForm.startup_stage === stage
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-300 hover:border-purple-600'
                      }`}
                    >
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Size */}
              <div>
                <Label htmlFor="team_size" className="text-base font-semibold">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  value={preferencesForm.team_size}
                  onChange={(e) => setPreferencesForm({ ...preferencesForm, team_size: e.target.value })}
                  placeholder="e.g., 10"
                  className="mt-2"
                />
              </div>

              {/* Immediate Joiner */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="immediate_joiner"
                  checked={preferencesForm.immediate_joiner}
                  onChange={(e) => setPreferencesForm({ ...preferencesForm, immediate_joiner: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <Label htmlFor="immediate_joiner" className="text-base font-semibold cursor-pointer">
                  Need immediate joiner
                </Label>
              </div>

              {/* Flexibility Days */}
              {!preferencesForm.immediate_joiner && (
                <div>
                  <Label htmlFor="flexibility_days" className="text-base font-semibold">
                    Joining Flexibility (Days)
                  </Label>
                  <Input
                    id="flexibility_days"
                    type="number"
                    value={preferencesForm.flexibility_days}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, flexibility_days: e.target.value })}
                    placeholder="e.g., 30"
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreferencesForm(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}