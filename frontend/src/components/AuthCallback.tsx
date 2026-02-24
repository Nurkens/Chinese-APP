import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokenAndLoadUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      setTokenAndLoadUser(token)
        .then(() => {
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Failed to authenticate with Google:', error);
          navigate('/?error=google_auth_failed');
        });
    } else {
      navigate('/?error=no_token');
    }
  }, [searchParams, navigate, setTokenAndLoadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-100">
      <div className="text-center">
        <div className="text-6xl mb-4">🔄</div>
        <p className="text-amber-900 text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
