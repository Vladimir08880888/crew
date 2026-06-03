import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { POSTES, SHIFTS, FAMILY_ROLES } from '../../utils/enums.js';

/**
 * Modal d'édition d'un membre de famille / établissement.
 * Permet au manager de régler : rôle, poste, shift habituel,
 * et heures hebdomadaires cibles (utilisées par le solver).
 */
export function MemberEditModal({ member, onClose, onSave, canChangeRole = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    role: member.role,
    is_admin: !!member.is_admin,
    poste: member.poste || '',
    shift_default: member.shift_default || '',
    weekly_hours_target: member.weekly_hours_target ?? '',
  });

  function submit(e) {
    e.preventDefault();
    onSave({
      ...form,
      poste: form.poste || null,
      shift_default: form.shift_default || null,
      weekly_hours_target: form.weekly_hours_target === '' ? null : Number(form.weekly_hours_target),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('memberEdit.title', { name: `${member.first_name} ${member.last_name}` })}</h3>
          <button className="ghost icon-only" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          {canChangeRole && (
            <>
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
            </>
          )}

          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
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

          <label style={{ marginTop: '0.5rem' }}>{t('memberEdit.weeklyHours')}</label>
          <input
            type="number"
            min={0}
            max={80}
            value={form.weekly_hours_target}
            placeholder={t('memberEdit.weeklyHoursPlaceholder')}
            onChange={(e) => setForm({ ...form, weekly_hours_target: e.target.value })}
          />
          <p className="muted" style={{ fontSize: '0.8rem' }}>{t('memberEdit.weeklyHoursHint')}</p>

          <div className="row" style={{ marginTop: '1.25rem' }}>
            <button type="submit"><Save size={14} /> {t('common.save')}</button>
            <button type="button" className="secondary" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
