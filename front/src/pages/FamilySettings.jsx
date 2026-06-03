import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft } from 'lucide-react';
import { familiesApi } from '../api/families.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Page de configuration de l'équipe (manager only).
 * Trois blocs : coefficients par niveau, capacité de référence,
 * répartition idéale par service et par poste.
 *
 * Le statut « manager » est dérivé du retour /families/:id (rôle effectif
 * dans cette équipe) plutôt que de l'état du sidebar, sinon un accès
 * direct par URL côté admin pouvait être bloqué à tort.
 */
export default function FamilySettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const familyId = Number(id);

  const [form, setForm] = useState(null);
  const [isManager, setIsManager] = useState(null);   // null = inconnu, true/false = chargé
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      familiesApi.getSettings(familyId),
      familiesApi.detail(familyId),
    ])
      .then(([settings, family]) => {
        if (cancelled) return;
        setForm(settings);
        const me = (family.members || []).find((m) => m.user_id === user?.id);
        setIsManager(!!me && me.role === 'parent' && me.status === 'active');
      })
      .catch((err) => { toast.fromError(err); setIsManager(false); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [familyId, user?.id]);

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

  if (loading || !form || isManager === null) return <div className="card"><p>{t('common.loading')}</p></div>;

  if (!isManager) {
    return <div className="card"><p>{t('settings.managerOnly', 'Seul un manager peut configurer l\'équipe.')}</p></div>;
  }

  return (
    <>
      <div className="page-header">
        <button className="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> {t('common.back', 'Retour')}
        </button>
        <h1>{t('settings.title', "Configuration de l'équipe")}</h1>
      </div>

      <form onSubmit={save}>
        {/* Aide générale — modèle mental */}
        <div className="card" style={{
          marginBottom: '0.75rem',
          borderLeft: '4px solid var(--primary)',
          background: 'var(--primary-light, rgba(99,102,241,0.08))',
          fontSize: '0.85rem',
        }}>
          <b>{t('settings.howTitle', 'Comment ça marche')}</b>
          <p style={{ margin: '0.35rem 0 0' }}>
            {t('settings.how1', 'Chaque équipier apporte un nombre de « points de couverture » selon son niveau. Le confirmé est la référence (100 points).')}
          </p>
          <p style={{ margin: '0.35rem 0 0' }}>
            {t('settings.how2', 'Sur chaque (service, poste) le solver vise un total de points = idéal. 100 % = idéal atteint ; en dessous = il manque du monde, au-dessus = renfort confortable.')}
          </p>
        </div>

        {/* Bloc 1 : coefficients par niveau */}
        <fieldset className="setup-step">
          <legend>1. {t('settings.coefsTitle', 'Points de couverture par niveau')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.coefsHint', 'Contribution d\'un équipier à un service. Référence : Confirmé = 100.')}
          </p>
          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.junior', 'Junior')}</label>
              <input type="number" min={0} max={500} value={form.junior_coef}
                     onChange={(e) => setField('junior_coef', e.target.value)} />
              <p className="muted" style={{ fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
                = {form.confirme_coef ? Math.round((form.junior_coef / form.confirme_coef) * 100) : 0}% {t('settings.ofConfirme', 'd\'un confirmé')}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.confirme', 'Confirmé')}</label>
              <input type="number" min={0} max={500} value={form.confirme_coef}
                     onChange={(e) => setField('confirme_coef', e.target.value)} />
              <p className="muted" style={{ fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
                = 100% {t('settings.reference', '(référence)')}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>{t('levels.chef', 'Chef')}</label>
              <input type="number" min={0} max={500} value={form.chef_coef}
                     onChange={(e) => setField('chef_coef', e.target.value)} />
              <p className="muted" style={{ fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
                = {form.confirme_coef ? Math.round((form.chef_coef / form.confirme_coef) * 100) : 0}% {t('settings.ofConfirme', 'd\'un confirmé')}
              </p>
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
            {t('settings.idealsHint', 'Total de points visé par le solver pour chaque (service, poste). Plonge est intégrée à la cuisine.')}
          </p>
          {(() => {
            const j = Number(form.junior_coef) || 1;
            const c = Number(form.confirme_coef) || 1;
            const ch = Number(form.chef_coef) || 1;
            const example = (target) => {
              const combos = [];
              // 2 confirmés ?
              if (Math.abs(2 * c - target) <= 10) combos.push(`2 ${t('levels.confirme', 'Confirmé')}`);
              // 1 chef + 1 confirmé ?
              if (Math.abs(ch + c - target) <= 10) combos.push(`1 ${t('levels.chef', 'Chef')} + 1 ${t('levels.confirme', 'Confirmé')}`);
              // 1 confirmé + 2 juniors ?
              if (Math.abs(c + 2 * j - target) <= 10) combos.push(`1 ${t('levels.confirme', 'Confirmé')} + 2 ${t('levels.junior', 'Junior')}`);
              // 1 chef + 1 junior ?
              if (Math.abs(ch + j - target) <= 10) combos.push(`1 ${t('levels.chef', 'Chef')} + 1 ${t('levels.junior', 'Junior')}`);
              return combos.slice(0, 3).join(' · ') || `≈ ${(target / c).toFixed(1)} ${t('levels.confirme', 'Confirmé')}`;
            };
            return (
              <div className="card" style={{ background: 'var(--bg-soft, rgba(0,0,0,0.04))', fontSize: '0.78rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
                <b>{t('settings.examplesTitle', 'Exemples d\'équipes à 100 %')}</b>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                  <li>midi cuisine ({form.midi_cuisine_ideal}) : {example(form.midi_cuisine_ideal)}</li>
                  <li>midi salle ({form.midi_salle_ideal}) : {example(form.midi_salle_ideal)}</li>
                  <li>soir cuisine ({form.soir_cuisine_ideal}) : {example(form.soir_cuisine_ideal)}</li>
                  <li>soir salle ({form.soir_salle_ideal}) : {example(form.soir_salle_ideal)}</li>
                </ul>
              </div>
            );
          })()}
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
