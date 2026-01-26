import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Invalid authentication response');
          navigate('/auth');
          return;
        }

        // Exchange session_id for user data and session_token
        const response = await axios.post(
          `${API}/auth/google/session`,
          {},
          {
            headers: {
              'X-Session-ID': sessionId,
            },
            withCredentials: true, // Important for cookies
          }
        );

        if (response.data.success) {
          // Store user in localStorage for immediate access
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          toast.success('Welcome to BharatVapari!');
          
          // Navigate to dashboard with user data
          navigate('/dashboard', {
            replace: true,
            state: { user: response.data.user }
          });
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error(error.response?.data?.detail || 'Authentication failed');
        navigate('/auth');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-slate-700 font-medium">Completing authentication...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait</p>
      </div>
    </div>
  );
}