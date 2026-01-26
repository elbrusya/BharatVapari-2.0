import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Home, Briefcase, Users, MessageCircle, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
              BharatVapari
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              data-testid="nav-dashboard-link"
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              to="/hiring"
              data-testid="nav-hiring-link"
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">Hiring</span>
            </Link>
            <Link
              to="/mentorship"
              data-testid="nav-mentorship-link"
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Mentorship</span>
            </Link>
            <Link
              to="/chat"
              data-testid="nav-chat-link"
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Chat</span>
            </Link>
            <Link
              to="/profile"
              data-testid="nav-profile-link"
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </Link>
            <Button
              data-testid="nav-logout-button"
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center gap-2 text-slate-700 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}