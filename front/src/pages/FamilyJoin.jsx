import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { familiesApi } from '../api/families.api.js';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function FamilyJoin() {
  const navigate = useNavigate();
  const { reload } = useFamily();
  const toast = useToast();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await familiesApi.join(code.trim());
      await reload();
      toast.success(res.message);
      navigate('/teams');
    } catch (err) {
      toast.fromError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('familyJoin.title')}</h1>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 480 }}>
        <label>{t('familyJoin.codeLabel')}</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} required autoFocus
               placeholder={t('familyJoin.codePlaceholder')} style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }} />
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
          {t('familyJoin.codeHint')}
        </p>

        <div className="row" style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={busy}><Users size={16} /> {t('familyJoin.submit')}</button>
          <button type="button" className="secondary" onClick={() => navigate('/teams')}>
            <X size={16} /> {t('common.cancel')}
          </button>
        </div>
      </form>
    </>
  );
}
