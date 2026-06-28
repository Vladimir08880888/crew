import { Navigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  HelpCircle, Users, Layers, Sparkles, Activity, ShieldCheck,
  AlertTriangle, Move, Calendar as CalendarIcon, Euro, FunctionSquare,
} from 'lucide-react';
import { useFamily } from '../context/FamilyContext.jsx';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                   marginTop: 0, marginBottom: '0.75rem' }}>
        <Icon size={20} /> {title}
      </h2>
      <div className="muted" style={{ lineHeight: 1.6 }}>
        {children}
      </div>
    </section>
  );
}

export default function ManagerHelp() {
  const { t } = useTranslation();
  const { families, loading } = useFamily();

  if (loading) {
    return <div className="card"><p>{t('common.loading')}</p></div>;
  }

  const isManagerSomewhere = families.some(
    (f) => f.role === 'manager' && f.status === 'active',
  );
  if (!isManagerSomewhere) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="page-header">
        <h1>
          <HelpCircle size={22} style={{ verticalAlign: '-3px',
                                          marginRight: '0.4rem' }} />
          {t('managerHelp.title')}
        </h1>
        <p className="muted">{t('managerHelp.intro')}</p>
      </div>

      <div className="stack" style={{ maxWidth: 900 }}>

        <Section icon={Users} title={t('managerHelp.profiles.title')}>
          <p>{t('managerHelp.profiles.lead')}</p>
          <ul>
            <li><strong>Apprenti</strong> — 0,15 — {t('managerHelp.profiles.apprenti')}</li>
            <li><strong>Débutant</strong> — 0,25 — {t('managerHelp.profiles.debutant')}</li>
            <li><strong>Autonome</strong> — 0,40 — {t('managerHelp.profiles.autonome')}</li>
            <li><strong>Pilier</strong> — 0,50 — {t('managerHelp.profiles.pilier')}</li>
            <li><strong>Référent</strong> — 0,60 — {t('managerHelp.profiles.referent')}</li>
          </ul>
          <p>
            <Trans i18nKey="managerHelp.profiles.example"
                   components={{ strong: <strong /> }} />
          </p>
        </Section>

        <Section icon={Layers} title={t('managerHelp.polyvalence.title')}>
          <p>{t('managerHelp.polyvalence.lead')}</p>
          <p>{t('managerHelp.polyvalence.detail')}</p>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            <em>{t('managerHelp.polyvalence.source')}</em>
          </p>
        </Section>

        <Section icon={Sparkles} title={t('managerHelp.smartPlanner.title')}>
          <p>{t('managerHelp.smartPlanner.lead')}</p>
          <ol>
            <li>{t('managerHelp.smartPlanner.step1')}</li>
            <li>{t('managerHelp.smartPlanner.step2')}</li>
            <li>{t('managerHelp.smartPlanner.step3')}</li>
            <li>{t('managerHelp.smartPlanner.step4')}</li>
          </ol>
          <p>{t('managerHelp.smartPlanner.density')}</p>
          <ul>
            <li><strong>Calme</strong> — 0,5 — {t('managerHelp.smartPlanner.calme')}</li>
            <li><strong>Normal</strong> — 1,0 — {t('managerHelp.smartPlanner.normal')}</li>
            <li><strong>Chargé</strong> — 1,3 — {t('managerHelp.smartPlanner.charge')}</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title={t('managerHelp.hcr.title')}>
          <p>{t('managerHelp.hcr.lead')}</p>
          <ul>
            <li>{t('managerHelp.hcr.weekly')}</li>
            <li>{t('managerHelp.hcr.dailyKitchen')}</li>
            <li>{t('managerHelp.hcr.dailyOthers')}</li>
            <li>{t('managerHelp.hcr.rest')}</li>
            <li>{t('managerHelp.hcr.juniorAlone')}</li>
          </ul>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            <em>{t('managerHelp.hcr.source')}</em>
          </p>
        </Section>

        <Section icon={AlertTriangle} title={t('managerHelp.alerts.title')}>
          <p>{t('managerHelp.alerts.lead')}</p>
          <ul>
            <li>
              <strong>{t('managerHelp.alerts.hcrLabel')}</strong>
              {' — '}{t('managerHelp.alerts.hcr')}
            </li>
            <li>
              <strong>{t('managerHelp.alerts.fatigueLabel')}</strong>
              {' — '}{t('managerHelp.alerts.fatigue')}
            </li>
            <li>
              <strong>{t('managerHelp.alerts.coverageLabel')}</strong>
              {' — '}{t('managerHelp.alerts.coverage')}
            </li>
          </ul>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            <em>{t('managerHelp.alerts.source')}</em>
          </p>
        </Section>

        <Section icon={FunctionSquare} title={t('managerHelp.algo.title')}>
          <p>{t('managerHelp.algo.lead')}</p>

          <h4 style={{ marginTop: '1rem' }}>1. {t('managerHelp.algo.coverageTitle')}</h4>
          <p>{t('managerHelp.algo.coverageIntro')}</p>
          <pre style={{ background: 'var(--glass)', padding: '0.5rem',
                        borderRadius: '6px', fontSize: '0.78rem',
                        overflowX: 'auto', whiteSpace: 'pre' }}>
{`couverture(poste, service) = Σ niveau_i  (i ∈ équipiers présents)
idéal_visé(poste, service)  = idéal_poste × densité_service`}
          </pre>
          <p>{t('managerHelp.algo.coverageDetail')}</p>

          <h4 style={{ marginTop: '1rem' }}>2. {t('managerHelp.algo.scoringTitle')}</h4>
          <p>{t('managerHelp.algo.scoringIntro')}</p>
          <pre style={{ background: 'var(--glass)', padding: '0.5rem',
                        borderRadius: '6px', fontSize: '0.78rem',
                        overflowX: 'auto', whiteSpace: 'pre' }}>
{`score(m, slot) =
    10 × (cible_m − heures_planifiées_m)   // déficit horaire (priorité)
  +  5 × 1[shift_default_m == service]      // service préféré
  +  3 × 1[poste_m == poste_slot]           // poste exact
  +  2 × 1[level_m == 'chef']               // léger bonus chef
  −  λ × coût_horaire(m) × durée(service)   // pénalité cost-aware (λ=0,5)`}
          </pre>
          <p>{t('managerHelp.algo.scoringDetail')}</p>

          <h4 style={{ marginTop: '1rem' }}>3. {t('managerHelp.algo.iterationTitle')}</h4>
          <p>{t('managerHelp.algo.iterationIntro')}</p>
          <pre style={{ background: 'var(--glass)', padding: '0.5rem',
                        borderRadius: '6px', fontSize: '0.78rem',
                        overflowX: 'auto', whiteSpace: 'pre' }}>
{`tant qu'au moins un slot progresse :
  pour chaque slot ouvert trié par déficit décroissant :
    si couverture(slot) ≥ idéal(slot) : passer
    candidats ← équipiers tels que :
        canFill(m, poste)                   ∧
        ¬ déjà_affecté(m, jour, service)    ∧
        heures(m) + durée ≤ cible(m) + 2    ∧
        heures(m) + durée ≤ 48              ∧  // HCR L3121-20
        durée_journée(m) ≤ plafond_HCR(poste) ∧
        repos_hebdo(m) ≥ 2 jours            ∧
        consécutifs(m) ≤ 6 jours            ∧
        ¬ junior_seul(slot, m)
    chosen ← argmax(score(m, slot))
    affecter(chosen, slot)`}
          </pre>
          <p>{t('managerHelp.algo.iterationDetail')}</p>

          <h4 style={{ marginTop: '1rem' }}>4. {t('managerHelp.algo.healthTitle')}</h4>
          <pre style={{ background: 'var(--glass)', padding: '0.5rem',
                        borderRadius: '6px', fontSize: '0.78rem',
                        overflowX: 'auto', whiteSpace: 'pre' }}>
{`Service Health Score (0..100) :
  pour chaque (jour, service, poste) :
    pct = 100 × couverture / idéal
    si pct ≥ 100 → +0   (sain)
    si 50 ≤ pct < 100 → −15 (sous-effectif modéré)
    si pct < 50  → −40 (sous-effectif sévère)
    si pct > 150 → −25 (surcharge)
  Score final = max(0, 100 + Σ pénalités) / nombre_de_slots`}
          </pre>
          <p>{t('managerHelp.algo.healthDetail')}</p>

          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            <em>{t('managerHelp.algo.source')}</em>
          </p>
        </Section>

        <Section icon={Euro} title={t('managerHelp.cost.title')}>
          <p>{t('managerHelp.cost.lead')}</p>
          <p>{t('managerHelp.cost.detail')}</p>
        </Section>

        <Section icon={Move} title={t('managerHelp.dnd.title')}>
          <p>{t('managerHelp.dnd.lead')}</p>
          <ol>
            <li>{t('managerHelp.dnd.step1')}</li>
            <li>{t('managerHelp.dnd.step2')}</li>
            <li>{t('managerHelp.dnd.step3')}</li>
          </ol>
        </Section>

        <Section icon={CalendarIcon} title={t('managerHelp.ical.title')}>
          <p>{t('managerHelp.ical.lead')}</p>
          <p>{t('managerHelp.ical.detail')}</p>
        </Section>

        <Section icon={Activity} title={t('managerHelp.workflow.title')}>
          <p>{t('managerHelp.workflow.lead')}</p>
          <ol>
            <li>{t('managerHelp.workflow.step1')}</li>
            <li>{t('managerHelp.workflow.step2')}</li>
            <li>{t('managerHelp.workflow.step3')}</li>
            <li>{t('managerHelp.workflow.step4')}</li>
            <li>{t('managerHelp.workflow.step5')}</li>
          </ol>
        </Section>

      </div>
    </>
  );
}
