const INTERVALS = {
  daily: { unit: 'DAY', n: 1 },
  weekly: { unit: 'DAY', n: 7 },
  monthly: { unit: 'MONTH', n: 1 },
  yearly: { unit: 'YEAR', n: 1 },
};

export function nextDueDateExpr(frequency) {
  const cfg = INTERVALS[frequency];
  if (!cfg) return null;
  return { sql: `DATE_ADD(due_date, INTERVAL ? ${cfg.unit})`, value: cfg.n };
}

export function advanceDate(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1); break;
    case 'weekly':  d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString().slice(0, 10);
}
