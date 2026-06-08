import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { ManagerOnly } from './components/layout/ManagerOnly.jsx';
import { HideFromEquipier } from './components/layout/HideFromEquipier.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { RoleRedirect } from './components/layout/RoleRedirect.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stats from './pages/Stats.jsx';
import Families from './pages/Families.jsx';
import FamilyDetail from './pages/FamilyDetail.jsx';
import FamilyCreate from './pages/FamilyCreate.jsx';
import FamilyJoin from './pages/FamilyJoin.jsx';
import FamilySettings from './pages/FamilySettings.jsx';
import Profile from './pages/Profile.jsx';
import Planning from './pages/Planning.jsx';
import ManagerHelp from './pages/ManagerHelp.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Racine : redirige vers /dashboard pour les managers, /planning pour les équipiers */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Pages accessibles à tous (équipier + manager) */}
        <Route path="/planning" element={<Planning />} />
        <Route path="/profile" element={<Profile />} />

        {/* Pages cachées à l'équipier déjà dans une équipe, mais ouvertes
            aux managers ET aux utilisateurs sans équipe (nouvel inscrit
            qui doit rejoindre via code ou créer son équipe). */}
        <Route path="/dashboard" element={<HideFromEquipier><Dashboard /></HideFromEquipier>} />
        <Route path="/teams/new" element={<HideFromEquipier><FamilyCreate /></HideFromEquipier>} />
        <Route path="/teams/join" element={<HideFromEquipier><FamilyJoin /></HideFromEquipier>} />

        {/* Pages strictement réservées aux managers d'une équipe */}
        <Route path="/stats"     element={<ManagerOnly><Stats /></ManagerOnly>} />
        <Route path="/teams"     element={<ManagerOnly><Families /></ManagerOnly>} />
        <Route path="/teams/:id" element={<ManagerOnly><FamilyDetail /></ManagerOnly>} />
        <Route path="/teams/:id/settings" element={<ManagerOnly><FamilySettings /></ManagerOnly>} />
        <Route path="/help"      element={<ManagerOnly><ManagerHelp /></ManagerOnly>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
