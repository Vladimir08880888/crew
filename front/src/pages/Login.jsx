import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`${t('dashboard.greeting', { name: user.first_name })}`);
      navigate('/dashboard');
    } catch (err) {
      toast.fromError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="auth-card">
        <h1>{t('auth.login.title')}</h1>
        <p className="auth-sub">{t('app.tagline')}</p>

        <label>{t('auth.login.email')}</label>
        <input type="email" required autoFocus autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}/>

        <label>{t('auth.login.password')}</label>
        <input type="password" required autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}/>

        <button type="submit" disabled={busy}>
          {busy ? `${t('common.loading')}` : t('auth.login.submit')}
        </button>

        <p className="auth-footer">
          {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.createAccount')}</Link>
        </p>
      </form>
    </div>
  );
}
