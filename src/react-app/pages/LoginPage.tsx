import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      login(token);
      // Remove token from URL
      navigate('/', { replace: true });
    }
  }, [location, login, navigate]);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Loading...</h1>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = (response: any) => {
    console.log('Login successful:', response);
    // TODO: Handle successful login here
  };
  const handleLoginFailure = () => {
    console.error('Login failed');
    // TODO: Handle login failure here
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Scholark</h1>
        <p className="text-gray-600 mb-8 text-center">
          A minimalist, flexible SaaS tool for researchers to track conferences and research topics.
        </p>

        <div>
          <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
        </div>

        <div className="mt-8 text-sm text-center text-gray-500">
          <p>This application is currently in private beta.</p>
          <p>You need to be whitelisted to access it.</p>
        </div>
      </div>
    </div>
  );
}
