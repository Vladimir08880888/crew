import { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { POSTES, SHIFTS, FAMILY_ROLES } from '../../utils/enums.js';

/**
 * Modal d'édition d'un membre d'équipe.
 *
 * Si le membre n'a pas encore été configuré (pas de poste ou pas
 * d'heures cibles), un bandeau « setup wizard » apparaît en haut
 * et propose des heures par défaut (35h temps plein, 24h temps
 * partiel) pour guider l'administrateur. C'est l'expérience
 * onboarding demandée : chaque équipier doit avoir ses caractéristiques
 * définies AVANT d'apparaître dans le solver.
 */
export function MemberEditModal({ member, onClose, onSave, canChangeRole = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    role: member.role,
    is_admin: !!member.is_admin,
    poste: member.poste || '',
    shift_default: member.shift_default || '',
    weekly_hours_target: member.weekly_hours_target ?? '',
    level: member.level || 'confirme',
    coef_override: member.coef_override ?? '',
  });

  const isFirstSetup = !member.poste || member.weekly_hours_target == null;

  function setHoursPreset(h) {
    setForm({ ...form, weekly_hours_target: h });
  }

  function submit(e) {
    e.preventDefault();
    onSave({
      ...form,
      poste: form.poste || null,
      shift_default: form.shift_default || null,
      weekly_hours_target: form.weekly_hours_target === '' ? null : Number(form.weekly_hours_target),
      level: form.level || 'confirme',
      coef_override: form.coef_override === '' ? null : Number(form.coef_override),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>
            {isFirstSetup && <Sparkles size={16} style={{ verticalAlign: '-2px', color: 'var(--primary)' }} />}{' '}
            {t('memberEdit.title', { name: `${member.first_name} ${member.last_name}` })}
          </h3>
          <button className="ghost icon-only" onClick={onClose}><X size={18} /></button>
        </div>

        {isFirstSetup && (
          <div className="setup-banner">
            <strong>{t('memberEdit.setupBannerTitle')}</strong>
            <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              {t('memberEdit.setupBannerHint')}
            </p>
          </div>
        )}

        <form onSubmit={submit}>
          <fieldset className="setup-step">
            <legend>1. {t('memberEdit.stepHours')}</legend>
            <label>{t('memberEdit.weeklyHours')}</label>
            <input
              type="number"
              min={0}
              max={80}
              value={form.weekly_hours_target}
              placeholder={t('memberEdit.weeklyHoursPlaceholder')}
              onChange={(e) => setForm({ ...form, weekly_hours_target: e.target.value })}
            />
            <div className="row" style={{ gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <button type="button" className="secondary preset-btn" onClick={() => setHoursPreset(35)}>35h</button>
              <button type="button" className="secondary preset-btn" onClick={() => setHoursPreset(24)}>24h</button>
              <button type="button" className="secondary preset-btn" onClick={() => setHoursPreset(20)}>20h</button>
              <button type="button" className="secondary preset-btn" onClick={() => setHoursPreset(0)}>{t('memberEdit.presetExclude')}</button>
            </div>
            <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('memberEdit.weeklyHoursHint')}</p>
          </fieldset>

          <fieldset className="setup-step">
            <legend>2. {t('memberEdit.stepRole')}</legend>
            <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label>{t('memberEdit.poste')}</label>
                <select value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })}>
                  <option value="">{t('memberEdit.posteAny')}</option>
                  {POSTES.map((p) => <option key={p} value={p}>{t(`postes.${p}`, p)}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label>{t('memberEdit.shiftDefault')}</label>
                <select value={form.shift_default} onChange={(e) => setForm({ ...form, shift_default: e.target.value })}>
                  <option value="">{t('memberEdit.shiftAny')}</option>
                  {SHIFTS.map((s) => <option key={s} value={s}>{t(`shifts.${s}`, s)}</option>)}
                </select>
              </div>
            </div>

            <label style={{ marginTop: '0.6rem' }}>{t('memberEdit.profile', 'Profil')}</label>
            <div className="row" style={{ gap: '0.3rem', flexWrap: 'wrap' }}>
              {[
                { key: 'apprenti', level: 'junior',   coef: 15, icon: '🌱', label: t('profiles.apprenti', 'Apprenti'),  desc: t('profiles.apprentiDesc', 'En formation') },
                { key: 'debutant', level: 'junior',   coef: 25, icon: '🌿', label: t('profiles.debutant', 'Débutant'),  desc: t('profiles.debutantDesc', 'Fin d\'essai')   },
                { key: 'autonome', level: 'confirme', coef: 40, icon: '🌳', label: t('profiles.autonome', 'Autonome'),  desc: t('profiles.autonomeDesc', 'Référence')     },
                { key: 'pilier',   level: 'confirme', coef: 50, icon: '⭐', label: t('profiles.pilier',   'Pilier'),    desc: t('profiles.pilierDesc',   'Polyvalent')    },
                { key: 'referent', level: 'chef',     coef: 60, icon: '👑', label: t('profiles.referent', 'Référent'),  desc: t('profiles.referentDesc', 'Lead service') },
              ].map(({ key, level, coef, icon, label, desc }) => {
                const currentCoef = form.coef_override !== '' && form.coef_override != null
                  ? Number(form.coef_override)
                  : (form.level === 'junior' ? 15 : form.level === 'chef' ? 60 : 40);
                const active = form.level === level && currentCoef === coef;
                return (
                  <button
                    key={key}
                    type="button"
                    className={active ? '' : 'secondary'}
                    onClick={() => setForm({ ...form, level, coef_override: coef })}
                    style={{ flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', gap: '0.05rem', padding: '0.4rem 0.3rem', fontSize: '0.8rem' }}
                    title={`${label} — apporte ${(coef / 100).toFixed(2)} sur 1,00 par poste`}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span><b>{label}</b></span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{desc}</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>{(coef / 100).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
              {t('memberEdit.profileHint', 'Cinq profils qui pondèrent la couverture du service. Apprenti = demi-puissance, Référent = lead.')}
            </p>
          </fieldset>

          {canChangeRole && (
            <fieldset className="setup-step">
              <legend>3. {t('memberEdit.stepPermissions')}</legend>
              <label>{t('memberEdit.role')}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {FAMILY_ROLES.map((r) => (
                  <option key={r} value={r}>{t(`roles.${r}`)}</option>
                ))}
              </select>

              <label style={{ marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                /> {t('memberEdit.isAdmin')}
              </label>
            </fieldset>
          )}

          <div className="row" style={{ marginTop: '1.25rem' }}>
            <button type="submit"><Save size={14} /> {t('common.save')}</button>
            <button type="button" className="secondary" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
