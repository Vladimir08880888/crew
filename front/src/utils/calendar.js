// Mois calendaire commençant le lundi (style FR)
const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function weekdayLabels() { return WEEKDAYS_FR; }
export function monthLabel(year, month) { return `${MONTHS_FR[month]} ${year}`; }

export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

/**
 * Retourne une grille 6×7 (42 dates) pour le mois donné,
 * en commençant par le lundi de la semaine contenant le 1er du mois.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  // En JS: 0 = dimanche, 1 = lundi, ..., 6 = samedi
  // On veut un calendrier qui commence le lundi → offset = (day + 6) % 7
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export function startOfMonthIso(year, month) {
  // 6 lignes en arrière pour couvrir le premier jour visible du mois
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return isoDate(start);
}

export function endOfMonthIso(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  return isoDate(end);
}
