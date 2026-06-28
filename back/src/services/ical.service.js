import ical from 'ical-generator';

const FREQ_LABEL = {
  once: 'Unique',
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  yearly: 'Annuelle',
};

const PRIORITY_LABEL = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

const CATEGORY_COLOR = {
  'Santé':         '#ec4899',
  'Finances':      '#f59e0b',
  'Administratif': '#6366f1',
  'Véhicule':      '#10b981',
  'Logement':      '#8b5cf6',
  'Corvée':        '#06b6d4',
  'Autre':         '#6b7280',
};

function statusEmoji(task) {
  if (task.status === 'pending_review') return '⏳';
  if (task.priority === 'high') return '🔴';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date); due.setHours(0, 0, 0, 0);
  if (due < today) return '⚠️';
  return '📌';
}

function generateOccurrences(startDate, frequency, count) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    switch (frequency) {
      case 'daily':   d.setDate(start.getDate() + i); break;
      case 'weekly':  d.setDate(start.getDate() + i * 7); break;
      case 'monthly': d.setMonth(start.getMonth() + i); break;
      case 'yearly':  d.setFullYear(start.getFullYear() + i); break;
      default: if (i > 0) return dates;
    }
    dates.push(d);
  }
  return dates;
}

function occurrenceCount(frequency) {
  switch (frequency) {
    case 'daily':   return 14;
    case 'weekly':  return 8;
    case 'monthly': return 6;
    case 'yearly':  return 3;
    default:        return 1;
  }
}

function buildDescription(t) {
  const parts = [];
  if (t.description) parts.push(t.description, '');
  parts.push(`Catégorie : ${t.category}`);
  parts.push(`Priorité : ${PRIORITY_LABEL[t.priority] || t.priority}`);
  parts.push(`Fréquence : ${FREQ_LABEL[t.frequency] || t.frequency}`);
  if (t.assigned_first_name) {
    parts.push(`Assigné à : ${t.assigned_first_name} ${t.assigned_last_name || ''}`.trim());
  }
  if (t.status === 'pending_review') {
    parts.push('', '⚠️ En attente de validation par un manager');
  }
  return parts.join('\n');
}

// ────────────────────────────────────────────────────────────────────
// Shifts (planning de service) — chaque shift devient un VEVENT
// supplémentaire dans le flux iCal. Affiché dans Calendrier comme
// « 🍴 Service midi — Salle (Bistrot du Vieux Port) » de 11h à 15h.
// ────────────────────────────────────────────────────────────────────

const SHIFT_DEFAULT_TIMES = {
  matin:   ['07:00', '11:00'],
  midi:    ['11:00', '15:30'],
  coupure: ['15:30', '18:00'],
  soir:    ['18:00', '23:30'],
  nuit:    ['22:00', '02:00'],
};

const POSTE_EMOJI = {
  cuisine:        '🍳',
  salle:          '🍽️',
  bar:            '🍷',
  plonge:         '🧽',
  administration: '📋',
};

function shiftRange(shift) {
  const [defStart, defEnd] = SHIFT_DEFAULT_TIMES[shift.shift_type] || ['09:00', '17:00'];
  const start = shift.start_time || defStart;
  const end   = shift.end_time   || defEnd;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const startDate = new Date(`${shift.date}T${start}:00`);
  const endDate = new Date(`${shift.date}T${end}:00`);
  // Si end < start, c'est un shift de nuit qui passe minuit
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  return { startDate, endDate };
}

function addShiftEvents(cal, shifts) {
  for (const s of shifts) {
    const { startDate, endDate } = shiftRange(s);
    const emoji = POSTE_EMOJI[s.poste] || '🍴';
    const teamSuffix = s.team_name ? ` — ${s.team_name}` : '';
    const event = cal.createEvent({
      id: `shift-${s.id}@reminder`,
      start: startDate,
      end:   endDate,
      summary: `${emoji} Service ${s.shift_type} — ${s.poste}${teamSuffix}`,
      description: [
        `Poste : ${s.poste}`,
        `Shift : ${s.shift_type}`,
        s.note ? `\n${s.note}` : '',
      ].filter(Boolean).join('\n'),
      categories: [{ name: 'Planning service' }],
    });
    try { event.color = '#c3553a'; } catch { /* selon version */ }
    // Rappel 2 heures avant
    event.createAlarm({
      type: 'display',
      trigger: 2 * 60 * 60,
      description: `Service ${s.shift_type} dans 2 h`,
    });
  }
}

export function buildIcal({ ownerName, tasks, shifts = [], calendarName, calendarColor }) {
  const cal = ical({
    name: calendarName || `Reminder — ${ownerName}`,
    prodId: { company: 'reminder', product: 'reminder-app', language: 'FR' },
    timezone: 'Europe/Paris',
    ttl: 60 * 60,
  });

  // Couleur globale du calendrier (X-APPLE-CALENDAR-COLOR honoré par iOS)
  if (calendarColor) {
    cal.color = calendarColor;
  }

  // Shifts d'abord (impactent l'agenda quotidien immédiat)
  addShiftEvents(cal, shifts);

  for (const t of tasks) {
    const occurrences = generateOccurrences(t.due_date, t.frequency, occurrenceCount(t.frequency));
    const description = buildDescription(t);
    const color = CATEGORY_COLOR[t.category] || CATEGORY_COLOR.Autre;
    const titleWithEmoji = `${statusEmoji(t)} ${t.title}`;

    for (let i = 0; i < occurrences.length; i++) {
      const date = occurrences[i];
      const isoDate = date.toISOString().slice(0, 10);

      const event = cal.createEvent({
        id: `task-${t.id}-${isoDate}@reminder`,
        start: date,
        allDay: true,
        summary: titleWithEmoji,
        description,
        categories: [{ name: t.category }],
      });

      // Couleur par catégorie (iOS Calendar respecte X-APPLE-CALENDAR-COLOR)
      try { event.color = color; } catch { /* selon version */ }

      event.createAlarm({
        type: 'display',
        trigger: 24 * 60 * 60,
        description: `Rappel : ${t.title} demain`,
      });
      if (t.priority === 'high') {
        event.createAlarm({
          type: 'display',
          trigger: 60 * 60,
          description: `${t.title} — priorité haute`,
        });
      }
    }
  }

  return cal.toString();
}
