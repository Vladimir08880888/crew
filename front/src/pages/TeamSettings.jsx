import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft } from 'lucide-react';
import { teamsApi } from '../api/teams.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Page de configuration de l'équipe (manager only).
 * Trois blocs : coefficients par niveau, capacité de référence,
 * répartition idéale par service et par poste.
 *
 * Le statut « manager » est dérivé du retour /teams/:id (rôle effectif
 * dans cette équipe) plutôt que de l'état du sidebar, sinon un accès
 * direct par URL côté admin pouvait être bloqué à tort.
 */
export default function TeamSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const teamId = Number(id);

  const [form, setForm] = useState(null);
  const [isManager, setIsManager] = useState(null);   // null = inconnu, true/false = chargé
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      teamsApi.getSettings(teamId),
      teamsApi.detail(teamId),
    ])
      .then(([settings, team]) => {
        if (cancelled) return;
        setForm(settings);
        const me = (team.members || []).find((m) => m.user_id === user?.id);
        setIsManager(!!me && me.role === 'manager' && me.status === 'active');
      })
      .catch((err) => { toast.fromError(err); setIsManager(false); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teamId, user?.id]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value === '' ? '' : Number(value) }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await teamsApi.updateSettings(teamId, form);
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
            {t('settings.how1', 'Chaque équipier apporte un poids strictement inférieur à 1. Chaque poste (cuisine, salle) vise une somme de 1,00 = 100 % de l\'équipe idéale.')}
          </p>
          <p style={{ margin: '0.35rem 0 0' }}>
            {t('settings.how2', 'La couverture globale d\'un service est la moyenne des couvertures de cuisine et salle. Au-dessous = il manque du monde, au-dessus = renfort confortable.')}
          </p>
        </div>

        {/* Bloc 1 : coefficients par niveau — saisie en centièmes, affichage en fraction */}
        <fieldset className="setup-step">
          <legend>1. {t('settings.coefsTitle', 'Poids par niveau (sur 1,00)')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.coefsHint', 'Combien chaque équipier apporte à la couverture d\'un poste. Tous les poids sont < 1.')}
          </p>
          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { key: 'junior_coef',   label: t('levels.junior',   'Junior') },
              { key: 'confirme_coef', label: t('levels.confirme', 'Confirmé') },
              { key: 'chef_coef',     label: t('levels.chef',     'Chef') },
            ].map(({ key, label }) => (
              <div key={key} style={{ flex: 1, minWidth: 130 }}>
                <label>{label}</label>
                <input
                  type="number" min={0} max={99} step={1}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
                <p className="muted" style={{ fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
                  = <b>{(form[key] / 100).toFixed(2)}</b> {t('settings.perPoste', 'sur 1,00 par poste')}
                </p>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Bloc 2 : jours d'ouverture */}
        <fieldset className="setup-step">
          <legend>2. {t('settings.openDaysTitle', "Jours d'ouverture")}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.openDaysHint', "Décochez les jours où l'établissement est fermé. Le solver ne proposera aucun shift ces jours-là.")}
          </p>
          <div className="row" style={{ gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].map((day, i) => {
              // dow = 0..6 où 0=dim ; map index 0..6 (Lun..Dim) → dow
              const dow = (i + 1) % 7;
              const mask = form.closed_days_mask ?? 2;
              const isClosed = (mask >> dow) & 1;
              return (
                <label key={day} style={{
                  flex: '1 1 100px', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.6rem',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--r-sm)',
                  background: isClosed ? 'rgba(239,68,68,0.08)' : 'transparent',
                  cursor: 'pointer',
                }}>
                  <input type="checkbox"
                         checked={!isClosed}
                         onChange={() => {
                           const m = isClosed ? (mask & ~(1 << dow)) : (mask | (1 << dow));
                           setField('closed_days_mask', m);
                         }} />
                  <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{day}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Bloc 3 : capacité de référence */}
        <fieldset className="setup-step">
          <legend>3. {t('settings.capacityTitle', 'Capacité de service (référence 100 %)')}</legend>
          <label>{t('settings.maxCouverts', 'Couverts servis à pleine capacité')}</label>
          <input type="number" min={1} max={1000} value={form.max_couverts}
                 onChange={(e) => setField('max_couverts', e.target.value)} />
          <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {t('settings.maxCouvertsHint', 'Ex : 100 couverts/service un jour plein. Sur les jours calmes, indiquez une capacité réduite (50 %) depuis la page Planning — la cible est divisée automatiquement.')}
          </p>
        </fieldset>

        {/* Bloc 4 : staffing idéal par service par poste */}
        <fieldset className="setup-step">
          <legend>4. {t('settings.idealsTitle', 'Configuration idéale par service (= 100 % à pleine capacité)')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.idealsHint', 'Total de points visé par le solver pour chaque (service, poste). Plonge est intégrée à la cuisine.')}
          </p>
          {(() => {
            const j = Number(form.junior_coef) || 1;
            const c = Number(form.confirme_coef) || 1;
            const ch = Number(form.chef_coef) || 1;
            const example = (target) => {
              const combos = [];
              if (Math.abs(2 * c - target) <= 5) combos.push(`2 ${t('levels.confirme', 'Confirmé')}`);
              if (Math.abs(ch + c - target) <= 5) combos.push(`1 ${t('levels.chef', 'Chef')} + 1 ${t('levels.confirme', 'Confirmé')}`);
              if (Math.abs(c + 2 * j - target) <= 5) combos.push(`1 ${t('levels.confirme', 'Confirmé')} + 2 ${t('levels.junior', 'Junior')}`);
              if (Math.abs(ch + j - target) <= 5) combos.push(`1 ${t('levels.chef', 'Chef')} + 1 ${t('levels.junior', 'Junior')}`);
              return combos.slice(0, 3).join(' · ') || `≈ ${(target / c).toFixed(1)} ${t('levels.confirme', 'Confirmé')}`;
            };
            return (
              <div className="card" style={{ background: 'var(--bg-soft, rgba(0,0,0,0.04))', fontSize: '0.78rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
                <b>{t('settings.examplesTitle', 'Exemples d\'équipes à 1,00 (= 100 %) sur chaque poste')}</b>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                  <li>midi cuisine ({(form.midi_cuisine_ideal/100).toFixed(2)}) : {example(form.midi_cuisine_ideal)}</li>
                  <li>midi salle ({(form.midi_salle_ideal/100).toFixed(2)}) : {example(form.midi_salle_ideal)}</li>
                  <li>soir cuisine ({(form.soir_cuisine_ideal/100).toFixed(2)}) : {example(form.soir_cuisine_ideal)}</li>
                  <li>soir salle ({(form.soir_salle_ideal/100).toFixed(2)}) : {example(form.soir_salle_ideal)}</li>
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

        {/* Bloc 5 : taux horaires par niveau (cost-aware) */}
        <fieldset className="setup-step">
          <legend>5. {t('settings.ratesTitle', 'Taux horaires (Convention HCR)')}</legend>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            {t('settings.ratesHint', 'Coût horaire brut par niveau. Le solver vise la couverture idéale tout en minimisant la masse salariale à compétence équivalente. Valeurs initiales : minima Convention HCR 2026.')}
          </p>
          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { key: 'junior_rate',   label: t('levels.junior',   'Junior') },
              { key: 'confirme_rate', label: t('levels.confirme', 'Confirmé') },
              { key: 'chef_rate',     label: t('levels.chef',     'Chef') },
            ].map(({ key, label }) => (
              <div key={key} style={{ flex: 1, minWidth: 130 }}>
                <label>{label} (€/h)</label>
                <input
                  type="number" min={0} max={10000} step={10}
                  value={form[key] ?? ''}
                  onChange={(e) => setField(key, e.target.value)}
                />
                <p className="muted" style={{ fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
                  = <b>{((form[key] ?? 0) / 100).toFixed(2)} €/h</b>
                </p>
              </div>
            ))}
          </div>
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
