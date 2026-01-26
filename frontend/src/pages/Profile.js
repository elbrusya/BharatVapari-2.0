import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import api from '../utils/api';
import { toast } from 'sonner';
import { User, Save, Briefcase, MapPin, Linkedin, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    bio: '',
    skills: '',
    location: '',
    linkedin: '',
    // Job Seeker fields
    education: '',
    // Startup fields
    company: '',
    company_registered: null,
    has_gst: null,
    about_founder: '',
    team_size: '',
    // Mentor fields
    experience: '',
    achievements: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        location: user.location || '',
        linkedin: user.linkedin || '',
        education: user.education || '',
        company: user.company || '',
        company_registered: user.company_registered ?? null,
        has_gst: user.has_gst ?? null,
        about_founder: user.about_founder || '',
        team_size: user.team_size || '',
        experience: user.experience || '',
        achievements: user.achievements || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...profile,
        skills: profile.skills.split(',').map((s) => s.trim()).filter((s) => s),
        team_size: profile.team_size ? parseInt(profile.team_size) : null,
      };
      
      const response = await api.updateProfile(data);
      
      if (response.data.profile_complete) {
        toast.success('Profile completed successfully! 🎉');
      } else {
        toast.success('Profile updated! Please complete all required fields.');
      }
      
      // Refresh page to update profile_complete status
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      await axios.delete(`${API}/auth/delete-account`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast.success('Account deleted successfully');
      
      // Logout and redirect to landing page
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit' }}>
            My Profile
          </h1>
          <p className="text-slate-600">Complete your profile to get better opportunities</p>
        </div>

        <Card className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit' }}>
                {user?.full_name}
              </h2>
              <p className="text-slate-600">{user?.email}</p>
              <div className="mt-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                data-testid="profile-bio-input"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                placeholder="Tell us about yourself..."
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="skills" className="text-sm font-medium">
                Skills (comma-separated)
              </Label>
              <Input
                id="skills"
                data-testid="profile-skills-input"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="e.g., React, Python, Marketing"
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="experience" className="text-sm font-medium">
                Experience
              </Label>
              <Textarea
                id="experience"
                data-testid="profile-experience-input"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                rows={3}
                placeholder="Describe your work experience..."
                className="mt-2 rounded-xl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  data-testid="profile-location-input"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="e.g., Bangalore, India"
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Company
                </Label>
                <Input
                  id="company"
                  data-testid="profile-company-input"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="Your company name"
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
              </Label>
              <Input
                id="linkedin"
                data-testid="profile-linkedin-input"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-2 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              data-testid="save-profile-button"
              disabled={loading}
              className="w-full h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </Card>

        {/* Danger Zone - Delete Account */}
        <Card className="p-8 rounded-2xl border-2 border-red-200 bg-red-50/50 shadow-sm mt-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2" style={{ fontFamily: 'Outfit' }}>
                Danger Zone
              </h3>
              <p className="text-red-700 mb-4">
                Once you delete your account, there is no going back. This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 space-y-1 mb-4">
                <li>• Your profile and personal information</li>
                <li>• All job posts and applications</li>
                <li>• Mentor/mentee profiles and sessions</li>
                <li>• All messages and conversations</li>
                <li>• Payment history and bookings</li>
              </ul>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    data-testid="delete-account-button"
                    variant="destructive"
                    className="rounded-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base pt-4">
                      This action <span className="font-bold text-red-600">cannot be undone</span>. This will permanently delete your
                      account and remove all your data from our servers.
                      <br />
                      <br />
                      <span className="font-semibold">Account:</span> {user?.email}
                      <br />
                      <span className="font-semibold">Name:</span> {user?.full_name}
                      <br />
                      <br />
                      All associated data including jobs, applications, messages, and sessions will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      data-testid="cancel-delete-button"
                      className="rounded-full px-6"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-testid="confirm-delete-button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="rounded-full px-6 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}