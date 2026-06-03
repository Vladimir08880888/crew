import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft } from 'lucide-react';
import { familiesApi } from '../api/families.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useFamily } from '../context/FamilyContext.jsx';

/**
 * Page de configuration de l'équipe (manager only).
 * Trois blocs : coefficients par niveau, capacité de référence,
 * répartition idéale par service et par poste.
 */
export default function FamilySettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { active } = useFamily();
  const { t } = useTranslation();
  const familyId = Number(id);
  const isManager = active?.id === familyId && active?.role === 'parent';

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    familiesApi.getSettings(familyId)
      .then((data) => { if (!cancelled) setForm(data); })
      .catch((err) => toast.fromError(err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [familyId]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value === '' ? '' : Number(value) }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await familiesApi.updateSettings(familyId, form);
      toast.success(t('settings.saved', 'Configuration enregistrée'));
    } catch (err) {
      toast.fromError(err);
    } finally {
      setSaving(false);
    }
  }

  if (!isManager) {
    return <div className="card"><p>{t('settings.managerOnly', 'Seul un manager peut configurer l\'équipe.')}</p></div>;
  }

  if (loading || !form) return <div className="card"><p>{t('common.loading')}</p></div>;

  return (
    <>
      <div className="page-header">
        <button className="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> {t('common.back', 'Retour')}
        </button>
        <h1>{t('settings.title', "Configuration de l'équipe")}</h1>
      </div>

      <form onSubmit={save}>
        {/* Bloc 1 : coefficients par niveau */}
        <fieldset className="setup-step">
          <legend>1. {t('settings.coefsTitle', 'Coefficients par niveau d\'équipier')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.coefsHint', 'Contribution de chaque équipier à la couverture du service. Référence : Confirmé = 100.')}
          </p>
          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.junior', 'Junior')}</label>
              <input type="number" min={0} max={500} value={form.junior_coef}
                     onChange={(e) => setField('junior_coef', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.confirme', 'Confirmé')}</label>
              <input type="number" min={0} max={500} value={form.confirme_coef}
                     onChange={(e) => setField('confirme_coef', e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.chef', 'Chef')}</label>
              <input type="number" min={0} max={500} value={form.chef_coef}
                     onChange={(e) => setField('chef_coef', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* Bloc 2 : capacité de référence */}
        <fieldset className="setup-step">
          <legend>2. {t('settings.capacityTitle', 'Capacité de service (référence 100 %)')}</legend>
          <label>{t('settings.maxCouverts', 'Couverts servis à pleine capacité')}</label>
          <input type="number" min={1} max={1000} value={form.max_couverts}
                 onChange={(e) => setField('max_couverts', e.target.value)} />
          <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {t('settings.maxCouvertsHint', 'Ex : 100 couverts/service un jour plein. Sur les jours calmes, indiquez une capacité réduite (50 %) depuis la page Planning — la cible est divisée automatiquement.')}
          </p>
        </fieldset>

        {/* Bloc 3 : staffing idéal par service par poste */}
        <fieldset className="setup-step">
          <legend>3. {t('settings.idealsTitle', 'Configuration idéale par service (= 100 % à pleine capacité)')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.idealsHint', 'Somme de coefficients visée par le solver pour chaque (service, poste). Plonge est intégrée à la cuisine.')}
          </p>
          <table className="planning-grid" style={{ width: '100%', marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>{t('settings.service', 'Service')}</th>
                <th>{t('postes.cuisine', 'Cuisine')}</th>
                <th>{t('postes.salle', 'Salle')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>{t('shifts.midi', 'Midi')}</b></td>
                <td><input type="number" min={0} max={5000}
                           value={form.midi_cuisine_ideal}
                           onChange={(e) => setField('midi_cuisine_ideal', e.target.value)} /></td>
                <td><input type="number" min={0} max={5000}
                           value={form.midi_salle_ideal}
                           onChange={(e) => setField('midi_salle_ideal', e.target.value)} /></td>
              </tr>
              <tr>
                <td><b>{t('shifts.soir', 'Soir')}</b></td>
                <td><input type="number" min={0} max={5000}
                           value={form.soir_cuisine_ideal}
                           onChange={(e) => setField('soir_cuisine_ideal', e.target.value)} /></td>
                <td><input type="number" min={0} max={5000}
                           value={form.soir_salle_ideal}
                           onChange={(e) => setField('soir_salle_ideal', e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
        </fieldset>

        <div className="row" style={{ marginTop: '1.25rem' }}>
          <button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </>
  );
}
