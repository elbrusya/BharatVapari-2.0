import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Shield,
  Users,
  Briefcase,
  GraduationCap,
  MessageCircle,
  LogOut,
  Search,
  Trash2,
  Edit,
  BarChart3,
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, jobsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users?limit=100`),
        axios.get(`${API}/admin/jobs?limit=50`),
        axios.get(`${API}/admin/requests`),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setJobs(jobsRes.data.jobs);
      setAdminRequests(requestsRes.data.requests);
    } catch (error) {
      toast.error('Failed to load admin data');
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleApproveRequest = async () => {
    if (!tempPassword) {
      toast.error('Please enter a temporary password');
      return;
    }

    try {
      await axios.post(`${API}/admin/requests/approve`, {
        request_id: selectedRequest.id,
        approved: true,
        password: tempPassword,
      });
      
      toast.success(`Admin access approved for ${selectedRequest.email}`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setTempPassword('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this admin request?')) {
      return;
    }

    try {
      await axios.post(`${API}/admin/requests/approve`, {
        request_id: requestId,
        approved: false,
      });
      
      toast.success('Admin request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const pendingRequests = adminRequests.filter(req => req.status === 'pending');

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center"> 
        <div className="text-white"> Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900"> 
      {/* Admin Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50"> 
        <div className="max-w-7xl mx-auto px-6 py-4"> 
          <div className="flex items-center justify-between"> 
            <div className="flex items-center gap-3"> 
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center"> 
                <Shield className="w-5 h-5 text-white\" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white\" style={{ fontFamily: 'Outfit' }}>
                  Admin Portal
                </h1>
                <p className="text-xs text-slate-400"> BharatVapari Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4"> 
              <Link
                to=\"/\"
                className="text-slate-300 hover:text-white transition-colors text-sm\"
              >
                View Main Site
              </Link>
              <Button
                onClick={handleLogout}
                variant=\"ghost\"
                className="text-slate-300 hover:text-red-400\"
                data-testid=\"admin-logout-button\"
              >
                <LogOut className="w-5 h-5\" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8"> 
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700"> 
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
            data-testid=\"tab-overview\"
          >
            <BarChart3 className="w-5 h-5 inline mr-2\" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
            data-testid=\"tab-requests\"
          >
            <Shield className="w-5 h-5 inline mr-2\" />
            Admin Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"> 
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
            data-testid=\"tab-users\"
          >
            <Users className="w-5 h-5 inline mr-2\" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
            data-testid=\"tab-jobs\"
          >
            <Briefcase className="w-5 h-5 inline mr-2\" />
            Jobs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6\" style={{ fontFamily: 'Outfit' }}>
              Platform Statistics
            </h2>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8"> 
              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <div className="flex items-center justify-between mb-4"> 
                  <Users className="w-8 h-8 text-indigo-400\" />
                  <span className="text-green-400 text-sm"> Active</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1"> {stats?.users?.total || 0}</div>
                <div className="text-sm text-slate-400"> Total Users</div>
              </Card>

              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <div className="flex items-center justify-between mb-4"> 
                  <Briefcase className="w-8 h-8 text-amber-400\" />
                  <span className="text-blue-400 text-sm"> Live</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1"> {stats?.hiring?.active_jobs || 0}</div>
                <div className="text-sm text-slate-400"> Active Jobs</div>
              </Card>

              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <div className="flex items-center justify-between mb-4"> 
                  <GraduationCap className="w-8 h-8 text-teal-400\" />
                  <span className="text-purple-400 text-sm"> Available</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1"> {stats?.mentorship?.total_mentors || 0}</div>
                <div className="text-sm text-slate-400"> Mentors</div>
              </Card>

              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <div className="flex items-center justify-between mb-4"> 
                  <MessageCircle className="w-8 h-8 text-green-400\" />
                  <span className="text-yellow-400 text-sm"> Sent</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1"> {stats?.engagement?.total_messages || 0}</div>
                <div className="text-sm text-slate-400"> Messages</div>
              </Card>
            </div>

            {/* User Breakdown */}
            <div className="grid md:grid-cols-2 gap-6"> 
              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <h3 className="text-lg font-semibold text-white mb-4"> User Distribution</h3>
                <div className="space-y-3"> 
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Startups</span>
                    <span className="text-white font-semibold"> {stats?.users?.startups || 0}</span>
                  </div>
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Job Seekers</span>
                    <span className="text-white font-semibold"> {stats?.users?.job_seekers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Mentors</span>
                    <span className="text-white font-semibold"> {stats?.users?.mentors || 0}</span>
                  </div>
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Mentees</span>
                    <span className="text-white font-semibold"> {stats?.users?.mentees || 0}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-800 border-slate-700"> 
                <h3 className="text-lg font-semibold text-white mb-4"> Platform Activity</h3>
                <div className="space-y-3"> 
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Total Applications</span>
                    <span className="text-white font-semibold"> {stats?.hiring?.total_applications || 0}</span>
                  </div>
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Mentorship Sessions</span>
                    <span className="text-white font-semibold"> {stats?.mentorship?.total_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center"> 
                    <span className="text-slate-400"> Total Jobs Posted</span>
                    <span className="text-white font-semibold"> {stats?.hiring?.total_jobs || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Admin Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6\" style={{ fontFamily: 'Outfit' }}>
              Admin Access Requests
            </h2>

            {pendingRequests.length === 0 ? (
              <Card className="p-12 bg-slate-800 border-slate-700 text-center"> 
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4\" />
                <p className="text-slate-400"> No pending admin requests</p>
              </Card>
            ) : (
              <div className="space-y-4"> 
                {adminRequests.map((request) => (
                  <Card key={request.id} className="p-6 bg-slate-800 border-slate-700"> 
                    <div className="flex items-start justify-between"> 
                      <div className="flex-1"> 
                        <div className="flex items-center gap-3 mb-3"> 
                          <h3 className="text-lg font-semibold text-white"> {request.full_name}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                            request.status === 'approved' ? 'bg-green-900 text-green-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-2"> {request.email}</p>
                        <div className="bg-slate-700/50 rounded-lg p-4 mb-3"> 
                          <p className="text-sm text-slate-400 mb-1"> Reason:</p>
                          <p className="text-sm text-white"> {request.reason}</p>
                        </div>
                        <p className="text-xs text-slate-500"> 
                          Requested: {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4"> 
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApprovalModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white\"
                            data-testid={`approve-request-${request.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant=\"destructive\"
                            data-testid={`reject-request-${request.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedRequest && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"> 
                <Card className="w-full max-w-md p-6 bg-slate-800 border-slate-700"> 
                  <h3 className="text-xl font-bold text-white mb-4"> Approve Admin Access</h3>
                  <p className="text-slate-300 mb-4"> 
                    Approve admin access for <strong>{selectedRequest.email}</strong>?
                  </p>
                  <div className="mb-6"> 
                    <Label className="text-slate-300 mb-2 block"> Set Temporary Password</Label>
                    <Input
                      type=\"text\"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder=\"Enter temporary password\"
                      className="bg-slate-700 border-slate-600 text-white\"
                      data-testid=\"temp-password-input\"
                    />
                    <p className="text-xs text-slate-500 mt-2"> 
                      Share this password securely with the new admin. They should change it after first login.
                    </p>
                  </div>
                  <div className="flex gap-3"> 
                    <Button
                      onClick={handleApproveRequest}
                      className="flex-1 bg-green-600 hover:bg-green-700\"
                      data-testid=\"confirm-approve-button\"
                    >
                      Confirm Approval
                    </Button>
                    <Button
                      onClick={() => {
                        setShowApprovalModal(false);
                        setSelectedRequest(null);
                        setTempPassword('');
                      }}
                      variant=\"outline\"
                      className="flex-1 border-slate-600\"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6"> 
              <h2 className="text-2xl font-bold text-white\" style={{ fontFamily: 'Outfit' }}>
                Manage Users
              </h2>
              <div className="relative"> 
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400\" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=\"Search users...\"
                  className="pl-10 bg-slate-800 border-slate-700 text-white w-64\"
                  data-testid=\"search-users-input\"
                />
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700"> 
              <div className="overflow-x-auto"> 
                <table className="w-full"> 
                  <thead className="bg-slate-700"> 
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700"> 
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-750"> 
                        <td className="px-6 py-4 whitespace-nowrap"> 
                          <div className="text-sm font-medium text-white"> {user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"> 
                          <div className="text-sm text-slate-300"> {user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"> 
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-900 text-indigo-300"> 
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"> 
                          <div className="text-sm text-slate-400"> 
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"> 
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant=\"ghost\"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20\"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4\" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6\" style={{ fontFamily: 'Outfit' }}>
              Manage Jobs
            </h2>

            <Card className="bg-slate-800 border-slate-700"> 
              <div className="overflow-x-auto"> 
                <table className="w-full"> 
                  <thead className="bg-slate-700"> 
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Posted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"> 
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700"> 
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-750"> 
                        <td className="px-6 py-4"> 
                          <div className="text-sm font-medium text-white"> {job.title}</div>
                        </td>
                        <td className="px-6 py-4"> 
                          <div className="text-sm text-slate-300"> {job.company}</div>
                        </td>
                        <td className="px-6 py-4"> 
                          <div className="text-sm text-slate-400"> {job.location}</div>
                        </td>
                        <td className="px-6 py-4"> 
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              job.status === 'active'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-gray-900 text-gray-300'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4"> 
                          <div className="text-sm text-slate-400"> 
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4"> 
                          <Button
                            onClick={() => handleDeleteJob(job.id)}
                            variant=\"ghost\"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20\"
                            data-testid={`delete-job-${job.id}`}
                          >
                            <Trash2 className="w-4 h-4\" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
