import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { POSTES, SHIFTS } from '../../utils/enums.js';

export function ShiftFormModal({ initial, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    id:         initial.id,
    team_id:  initial.team_id,
    user_id:    initial.user_id,
    date:       initial.date,
    shift_type: initial.shift_type,
    poste:      initial.poste,
    start_time: initial.start_time || '',
    end_time:   initial.end_time   || '',
    note:       initial.note       || '',
  });

  const isEdit = !!initial.id;

  function submit(e) {
    e.preventDefault();
    onSave({
      ...form,
      start_time: form.start_time || null,
      end_time:   form.end_time   || null,
      note:       form.note || null,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? t('planning.editShift') : t('planning.addShift')}</h3>
          <button className="ghost icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          <p className="muted">
            <b>{initial.memberName}</b> — {new Date(initial.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>{t('planning.shiftType')}</label>
              <select value={form.shift_type} onChange={(e) => setForm({ ...form, shift_type: e.target.value })} required>
                {SHIFTS.map((s) => <option key={s} value={s}>{t(`shifts.${s}`, s)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>{t('planning.poste')}</label>
              <select value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} required>
                {POSTES.map((p) => <option key={p} value={p}>{t(`postes.${p}`, p)}</option>)}
              </select>
            </div>
          </div>

          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label>{t('planning.startTime')} <span className="muted">({t('planning.optional')})</span></label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label>{t('planning.endTime')} <span className="muted">({t('planning.optional')})</span></label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <label style={{ marginTop: '0.5rem' }}>{t('planning.note')} <span className="muted">({t('planning.optional')})</span></label>
          <textarea
            rows={2}
            placeholder={t('planning.notePlaceholder')}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            maxLength={500}
          />

          <div className="row" style={{ marginTop: '1.25rem' }}>
            <button type="submit">{isEdit ? t('common.save') : t('common.create')}</button>
            <button type="button" className="secondary" onClick={onClose}>{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
