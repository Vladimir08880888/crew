export function formatDateFr(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

export function relativeDateLabel(date) {
  const n = daysUntil(date);
  if (n === 0)  return "aujourd'hui";
  if (n === 1)  return 'demain';
  if (n === -1) return 'hier';
  if (n < 0)    return `il y a ${Math.abs(n)} jours`;
  return `dans ${n} jours`;
}
