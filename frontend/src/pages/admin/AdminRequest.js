import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, User, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminRequest() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/request`, formData);
      setRequestId(response.data.request_id);
      setSubmitted(true);
      toast.success('Admin access request submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>
            Request Submitted!
          </h2>
          <p className="text-slate-300 mb-6">
            Your admin access request has been submitted successfully. An existing admin will review your request and notify you via email.
          </p>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-400 mb-2">Request ID</p>
            <p className="text-sm text-white font-mono">{requestId}</p>
          </div>
          <div className="space-y-3">
            <Link to="/admin/login">
              <Button className="w-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-semibold">
                Go to Admin Login
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full rounded-full border-slate-600 text-slate-300 hover:bg-slate-700">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
            Request Admin Access
          </h1>
          <p className="text-slate-400">Submit your request to become a BharatVapari admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="full_name"
              data-testid="admin-request-name-input"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="mt-2 h-12 rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Your full name"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              data-testid="admin-request-email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-2 h-12 rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-slate-500 mt-1">
              You will receive approval notification at this email
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reason for Admin Access <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reason"
              data-testid="admin-request-reason-input"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={5}
              className="mt-2 rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Explain why you need admin access to the BharatVapari platform..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Be specific about your role and responsibilities
            </p>
          </div>

          <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Important:</strong> Your request will be reviewed by existing admins. Only submit this request if you are authorized personnel.
            </p>
          </div>

          <Button
            type="submit"
            data-testid="submit-admin-request-button"
            disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-semibold shadow-lg"
          >
            {loading ? 'Submitting Request...' : 'Submit Admin Request'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/admin/login" className="text-sm text-slate-400 hover:text-slate-300 block">
            Already have admin access? Login here
          </Link>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-300 block">
            Back to main site
          </Link>
        </div>
      </Card>
    </div>
  );
}