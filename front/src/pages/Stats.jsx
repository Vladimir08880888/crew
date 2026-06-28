import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Lock } from 'lucide-react';
import {
  Chart, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { statsApi } from '../api/stats.api.js';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';

Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Title, Tooltip, Legend, Filler,
);

const POSTE_COLORS = {
  cuisine:        '#ec4899',
  salle:          '#6366f1',
  bar:            '#f59e0b',
  plonge:         '#10b981',
  administration: '#8b5cf6',
};

export default function Stats() {
  const { active } = useFamily();
  const { theme } = useTheme();
  const toast = useToast();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isParent = active?.role === 'manager';

  const load = useCallback(() => {
    if (!active || !isParent) { setLoading(false); return; }
    setLoading(true);
    statsApi.charts(active.id)
      .then(setData)
      .catch(toast.fromError)
      .finally(() => setLoading(false));
  }, [active?.id, isParent]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  if (!active) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><BarChart3 size={48} /></div>
        <h3>{t('stats.title')}</h3>
        <p>{t('stats.selectTeam')}</p>
      </div>
    );
  }

  if (!isParent) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Lock size={48} style={{ color: 'var(--text-muted)' }} /></div>
        <h3>{t('stats.managersOnly')}</h3>
        <p>{t('stats.managersOnlyHint')}</p>
        <Link to="/dashboard"><button>{t('stats.backToDashboard')}</button></Link>
      </div>
    );
  }

  if (loading || !data) return <p className="muted">{t('common.loading')}</p>;

  const textColor = theme === 'dark' ? '#e6e6f0' : '#1e1b3a';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const commonOpts = {
    plugins: {
      legend: { labels: { color: textColor, font: { weight: 600 } } },
      tooltip: { titleColor: '#fff', bodyColor: '#fff' },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const pieData = {
    labels: data.byPoste.map((p) => t(`postes.${p.poste}`, p.poste)),
    datasets: [{
      data: data.byPoste.map((p) => p.n),
      backgroundColor: data.byPoste.map((p) => POSTE_COLORS[p.poste] || '#6b7280'),
      borderWidth: 2,
      borderColor: theme === 'dark' ? '#1e1e37' : '#fff',
    }],
  };

  const barData = {
    labels: data.byMember.map((m) => m.first_name),
    datasets: [{
      label: t('stats.shiftsCount'),
      data: data.byMember.map((m) => m.shifts_count),
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }],
  };

  const lineData = {
    labels: data.timeline.map((d) => d.day.slice(5)),
    datasets: [{
      label: t('stats.shiftsPerDay'),
      data: data.timeline.map((d) => d.n),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#6366f1',
    }],
  };

  return (
    <>
      <div className="page-header">
        <h1>{t('stats.pageTitle', { name: active.name })}</h1>
      </div>

      <div className="stats-charts">
        <div className="card chart-card">
          <h3>{t('stats.byPoste')}</h3>
          <div className="chart-wrap" style={{ height: 280 }}>
            {data.byPoste.length === 0
              ? <p className="muted center-text">{t('stats.byPosteEmpty')}</p>
              : <Pie data={pieData} options={{
                  ...commonOpts,
                  scales: undefined,
                  plugins: { ...commonOpts.plugins, legend: { position: 'right', labels: { color: textColor, font: { weight: 600 } } } },
                }} />}
          </div>
        </div>

        <div className="card chart-card">
          <h3>{t('stats.byMember')}</h3>
          <div className="chart-wrap" style={{ height: 280 }}>
            {data.byMember.length === 0
              ? <p className="muted center-text">{t('stats.byMemberEmpty')}</p>
              : <Bar data={barData} options={commonOpts} />}
          </div>
        </div>

        <div className="card chart-card chart-wide">
          <h3>{t('stats.timeline')}</h3>
          <div className="chart-wrap" style={{ height: 280 }}>
            <Line data={lineData} options={commonOpts} />
          </div>
        </div>
      </div>
    </>
  );
}
