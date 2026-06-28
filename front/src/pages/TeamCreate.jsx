import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { teamsApi } from '../api/teams.api.js';
import { useTeam } from '../context/TeamContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function TeamCreate() {
  const navigate = useNavigate();
  const { reload } = useTeam();
  const toast = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const team = await teamsApi.create({ name });
      await reload();
      toast.success(t('teamCreate.createdToast', { name: team.name }));
      navigate(`/teams/${team.id}`);
    } catch (err) {
      toast.fromError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('teamCreate.title')}</h1>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 480 }}>
        <label>{t('teamCreate.nameLabel')}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus
               placeholder={t('teamCreate.namePlaceholder')} />

        <div className="row" style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={busy}><Save size={16} /> {t('common.create')}</button>
          <button type="button" className="secondary" onClick={() => navigate('/teams')}>
            <X size={16} /> {t('common.cancel')}
          </button>
        </div>
      </form>
    </>
  );
}
