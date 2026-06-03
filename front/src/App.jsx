import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stats from './pages/Stats.jsx';
import Families from './pages/Families.jsx';
import FamilyDetail from './pages/FamilyDetail.jsx';
import FamilyCreate from './pages/FamilyCreate.jsx';
import FamilyJoin from './pages/FamilyJoin.jsx';
import Profile from './pages/Profile.jsx';
import Planning from './pages/Planning.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/teams" element={<Families />} />
        <Route path="/teams/new" element={<FamilyCreate />} />
        <Route path="/teams/join" element={<FamilyJoin />} />
        <Route path="/teams/:id" element={<FamilyDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
