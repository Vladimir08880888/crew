import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
