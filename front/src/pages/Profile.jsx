import { useState } from 'react';
import { Save, Copy, Check, Calendar, Lock, User as UserIcon, Smartphone } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api.js';
import { usersApi } from '../api/users.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { API_BASE } from '../config/api.js';
import { QRCodeView } from '../components/ui/QRCode.jsx';

function CalendarFeed({ label, icon: Icon, url, color = 'var(--primary)' }) {
  const toast = useToast();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const webcalUrl = url.replace(/^https?:/, 'webcal:');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('profile.urlCopiedToast'));
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error(t('profile.copyImpossibleToast')); }
  }

  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <h3 style={{ color }}>
        <Icon size={16} style={{ verticalAlign: '-2px' }} /> {label}
      </h3>

      <div className="row" style={{ alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <div className="col" style={{ alignItems: 'center', gap: '0.4rem' }}>
          <QRCodeView value={webcalUrl} size={160} />
          <span className="muted" style={{ fontSize: '0.75rem' }}>{t('profile.scanWithCamera')}</span>
        </div>

        <div className="col" style={{ flex: 1, minWidth: 240, gap: '0.6rem' }}>
          <code style={{ wordBreak: 'break-all', display: 'block', padding: '0.5rem', fontSize: '0.8rem' }}>
            {url}
          </code>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <a href={webcalUrl}>
              <button>
                <Calendar size={14} /> {t('profile.openInCalendar')}
              </button>
            </a>
            <button className="secondary" onClick={copy}>
              {copied ? <><Check size={14} /> {t('profile.copied')}</> : <><Copy size={14} /> {t('profile.copyUrl')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '' });

  async function submitProfile(e) {
    e.preventDefault();
    try {
      const updated = await usersApi.updateProfile(form);
      setUser(updated);
      toast.success(t('profile.profileUpdatedToast'));
    } catch (err) { toast.fromError(err); }
  }

  async function submitPassword(e) {
    e.preventDefault();
    try {
      await authApi.changePassword(pwd);
      setPwd({ current_password: '', new_password: '' });
      toast.success(t('profile.passwordChangedToast'));
    } catch (err) { toast.fromError(err); }
  }

  const base = API_BASE.startsWith('http')
    ? `${API_BASE}/calendar/${user.calendar_token}`
    : `${window.location.origin}${API_BASE}/calendar/${user.calendar_token}`;
  const allUrl = `${base}.ics`;

  return (
    <>
      <div className="page-header">
        <h1>{t('profile.title')}</h1>
      </div>

      <div className="stack" style={{ maxWidth: 800 }}>
        <form className="card" onSubmit={submitProfile}>
          <h3><UserIcon size={16} style={{ verticalAlign: '-2px' }} /> {t('profile.personalInfo')}</h3>
          <label>{t('profile.firstName')}</label>
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          <label>{t('profile.lastName')}</label>
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          <div style={{ marginTop: '1rem' }}>
            <button type="submit"><Save size={14} /> {t('profile.save')}</button>
          </div>
        </form>

        <form className="card" onSubmit={submitPassword}>
          <h3><Lock size={16} style={{ verticalAlign: '-2px' }} /> {t('profile.password')}</h3>
          <label>{t('profile.currentPassword')}</label>
          <input type="password" value={pwd.current_password}
            onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} required />
          <label>{t('profile.newPassword')}</label>
          <input type="password" value={pwd.new_password}
            onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} required minLength={8} />
          <div style={{ marginTop: '1rem' }}>
            <button type="submit"><Lock size={14} /> {t('profile.changePassword')}</button>
          </div>
        </form>

        <div>
          <h2><Smartphone size={20} style={{ verticalAlign: '-3px' }} /> {t('profile.calendarSync')}</h2>
          <p className="muted">{t('profile.calendarHint')}</p>

          <CalendarFeed
            label={t('profile.feedAll')}
            icon={Smartphone}
            url={allUrl}
            color="#6366f1"
          />

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>{t('profile.howToSubscribe')}</h3>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              <Trans i18nKey="profile.iphoneTip" components={{ strong: <strong /> }} />
            </p>
            <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <Trans i18nKey="profile.androidTip" components={{ strong: <strong /> }} />
            </p>
            <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <Trans i18nKey="profile.subscribedTip" components={{ strong: <strong /> }} />
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
