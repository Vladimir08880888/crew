import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { teamsApi } from '../api/teams.api.js';
import { useAuth } from './AuthContext.jsx';

const TeamContext = createContext(null);
const STORAGE_KEY = 'reminder_active_team';

export function TeamProvider({ children }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(
    Number(localStorage.getItem(STORAGE_KEY)) || null
  );
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) { setTeams([]); return; }
    setLoading(true);
    try {
      const list = await teamsApi.list();
      setTeams(list);
      if (!list.find((f) => f.id === activeTeamId)) {
        const first = list.find((f) => f.status === 'active');
        setActiveTeamId(first?.id || null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeTeamId]);

  useEffect(() => { reload(); }, [user]);

  useEffect(() => {
    if (activeTeamId) localStorage.setItem(STORAGE_KEY, String(activeTeamId));
    else localStorage.removeItem(STORAGE_KEY);
  }, [activeTeamId]);

  const active = teams.find((f) => f.id === activeTeamId) || null;

  return (
    <TeamContext.Provider value={{ teams, active, activeTeamId, setActiveTeamId, reload, loading }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
