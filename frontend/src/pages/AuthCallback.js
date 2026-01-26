import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import RoleSelection from './RoleSelection';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const location = useLocation();
  const hasProcessed = useRef(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // CRITICAL: Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const extractedSessionId = params.get('session_id');

        if (!extractedSessionId) {
          toast.error('Invalid authentication response');
          window.location.href = '/auth';
          return;
        }

        // First, check if user exists by getting user data from Emergent
        const emergentResponse = await axios.get(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          {
            headers: { 'X-Session-ID': extractedSessionId },
          }
        );

        const oauthData = emergentResponse.data;
        const email = oauthData.email;
        const name = oauthData.name;

        // Check if user already exists in our database
        const checkResponse = await axios.post(
          `${API}/auth/google/check-user`,
          { email },
          { withCredentials: true }
        );

        if (checkResponse.data.exists) {
          // Existing user - complete login directly
          const response = await axios.post(
            `${API}/auth/google/session`,
            {},
            {
              headers: { 'X-Session-ID': extractedSessionId },
              withCredentials: true,
            }
          );

          if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Welcome back to BharatVapari!');
            window.location.href = '/dashboard';
          }
        } else {
          // New user - show role selection
          setSessionId(extractedSessionId);
          setUserData({ name, email });
          setShowRoleSelection(true);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        window.location.href = '/auth';
      }
    };

    processSession();
  }, [location]);

  if (showRoleSelection) {
    return <RoleSelection sessionId={sessionId} userData={userData} />;
  }

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