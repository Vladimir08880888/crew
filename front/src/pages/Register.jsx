import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
  });
  const [busy, setBusy] = useState(false);

  function update(k, v) { setForm({ ...form, [k]: v }); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success(t('auth.register.submit'));
      navigate('/teams');
    } catch (err) {
      toast.fromError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="auth-card">
        <h1>{t('auth.register.title')}</h1>
        <p className="auth-sub">{t('app.tagline')}</p>

        <label>{t('auth.register.firstName')}</label>
        <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required autoFocus autoComplete="given-name" />

        <label>{t('auth.register.lastName')}</label>
        <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required autoComplete="family-name" />

        <label>{t('auth.register.email')}</label>
        <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />

        <label>{t('auth.register.password')} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({t('auth.register.passwordHint')})</span></label>
        <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete="new-password" />

        <button type="submit" disabled={busy}>
          {busy ? `${t('common.loading')}` : t('auth.register.submit')}
        </button>

        <p className="auth-footer">
          {t('auth.register.haveAccount')} <Link to="/login">{t('auth.register.login')}</Link>
        </p>
      </form>
    </div>
  );
}
