import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { familiesApi } from '../api/families.api.js';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function FamilyCreate() {
  const navigate = useNavigate();
  const { reload } = useFamily();
  const toast = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const family = await familiesApi.create({ name });
      await reload();
      toast.success(t('familyCreate.createdToast', { name: family.name }));
      navigate(`/teams/${family.id}`);
    } catch (err) {
      toast.fromError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('familyCreate.title')}</h1>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 480 }}>
        <label>{t('familyCreate.nameLabel')}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus
               placeholder={t('familyCreate.namePlaceholder')} />

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
