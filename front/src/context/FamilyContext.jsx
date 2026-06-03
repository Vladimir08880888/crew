import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { familiesApi } from '../api/families.api.js';
import { useAuth } from './AuthContext.jsx';

const FamilyContext = createContext(null);
const STORAGE_KEY = 'reminder_active_family';

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const [families, setFamilies] = useState([]);
  const [activeFamilyId, setActiveFamilyId] = useState(
    Number(localStorage.getItem(STORAGE_KEY)) || null
  );
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) { setFamilies([]); return; }
    setLoading(true);
    try {
      const list = await familiesApi.list();
      setFamilies(list);
      if (!list.find((f) => f.id === activeFamilyId)) {
        const first = list.find((f) => f.status === 'active');
        setActiveFamilyId(first?.id || null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeFamilyId]);

  useEffect(() => { reload(); }, [user]);

  useEffect(() => {
    if (activeFamilyId) localStorage.setItem(STORAGE_KEY, String(activeFamilyId));
    else localStorage.removeItem(STORAGE_KEY);
  }, [activeFamilyId]);

  const active = families.find((f) => f.id === activeFamilyId) || null;

  return (
    <FamilyContext.Provider value={{ families, active, activeFamilyId, setActiveFamilyId, reload, loading }}>
      {children}
    </FamilyContext.Provider>
  );
}

export const useFamily = () => useContext(FamilyContext);
