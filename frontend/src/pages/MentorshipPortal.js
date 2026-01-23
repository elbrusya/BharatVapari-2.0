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
import { Users, Star, Calendar, Clock, Plus, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MentorshipPortal() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Mentor form state
  const [mentorForm, setMentorForm] = useState({
    expertise: '',
    bio: '',
    experience_years: '',
    hourly_rate: '',
    availability: '',
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    session_date: '',
    duration: 60,
    topic: '',
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.getMentors();
      setMentors(response.data);
    } catch (error) {
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMentorProfile = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...mentorForm,
        expertise: mentorForm.expertise.split(',').map((e) => e.trim()),
        experience_years: parseInt(mentorForm.experience_years),
        hourly_rate: mentorForm.hourly_rate ? parseFloat(mentorForm.hourly_rate) : null,
        availability: mentorForm.availability.split(',').map((d) => d.trim()),
      };
      await api.createMentorProfile(data);
      toast.success('Mentor profile created!');
      setShowMentorForm(false);
      fetchMentors();
    } catch (error) {
      toast.error('Failed to create profile');
    }
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    try {
      await api.bookSession({
        mentor_id: selectedMentor.user_id,
        ...bookingForm,
      });
      toast.success('Session booked successfully!');
      setShowBookingForm(false);
      setBookingForm({ session_date: '', duration: 60, topic: '' });
    } catch (error) {
      toast.error('Failed to book session');
    }
  };

  const MentorCard = ({ mentor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-green-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>
              {mentor.user?.full_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {mentor.experience_years} years experience
            </div>
          </div>
        </div>

        <p className="text-slate-600 mb-4 line-clamp-3">{mentor.bio}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {mentor.expertise?.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>

        {mentor.hourly_rate && (
          <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold">
            <Star className="w-5 h-5" />
            ₹{mentor.hourly_rate}/hour
          </div>
        )}

        {user?.role !== 'mentor' && (
          <Button
            data-testid={`book-mentor-${mentor.user_id}-button`}
            onClick={() => {
              setSelectedMentor(mentor);
              setShowBookingForm(true);
            }}
            className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            Book Session
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
              Mentorship Portal
            </h1>
            <p className="text-slate-600">
              {user?.role === 'mentor'
                ? 'Share your expertise and guide aspiring entrepreneurs'
                : 'Connect with experienced mentors to accelerate your growth'}
            </p>
          </div>
          {user?.role === 'mentor' && (
            <Dialog open={showMentorForm} onOpenChange={setShowMentorForm}>
              <DialogTrigger asChild>
                <Button
                  data-testid="create-mentor-profile-button"
                  className="rounded-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Setup Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                    Create Mentor Profile
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMentorProfile} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="expertise">Expertise (comma-separated)</Label>
                    <Input
                      id="expertise"
                      data-testid="mentor-expertise-input"
                      value={mentorForm.expertise}
                      onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })}
                      required
                      placeholder="e.g., Product Management, Fundraising, Marketing"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      data-testid="mentor-bio-input"
                      value={mentorForm.bio}
                      onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                      required
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <Input
                        id="experience_years"
                        data-testid="mentor-experience-input"
                        type="number"
                        value={mentorForm.experience_years}
                        onChange={(e) =>
                          setMentorForm({ ...mentorForm, experience_years: e.target.value })
                        }
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                      <Input
                        id="hourly_rate"
                        data-testid="mentor-rate-input"
                        type="number"
                        value={mentorForm.hourly_rate}
                        onChange={(e) => setMentorForm({ ...mentorForm, hourly_rate: e.target.value })}
                        placeholder="Optional"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="availability">Availability (comma-separated days)</Label>
                    <Input
                      id="availability"
                      data-testid="mentor-availability-input"
                      value={mentorForm.availability}
                      onChange={(e) => setMentorForm({ ...mentorForm, availability: e.target.value })}
                      required
                      placeholder="e.g., Monday, Wednesday, Friday"
                      className="mt-2"
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="submit-mentor-profile-button"
                    className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  >
                    Create Profile
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        ) : mentors.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No mentors available yet. Check back soon!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.user_id} mentor={mentor} />
            ))}
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
                Book Session with {selectedMentor?.user?.full_name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBookSession} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="session_date">Session Date & Time</Label>
                <Input
                  id="session_date"
                  data-testid="session-date-input"
                  type="datetime-local"
                  value={bookingForm.session_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, session_date: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  data-testid="session-duration-input"
                  type="number"
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration: parseInt(e.target.value) })}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="topic">Session Topic</Label>
                <Textarea
                  id="topic"
                  data-testid="session-topic-input"
                  value={bookingForm.topic}
                  onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  required
                  rows={4}
                  placeholder="What would you like to discuss?"
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                data-testid="submit-booking-button"
                className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}