#!/usr/bin/env node
/**
 * Captures d'écran Crew pour le dossier projet AFPA.
 *
 * Usage : APP_URL=http://localhost:5173 node scripts/screenshots.mjs
 *         (par défaut : la prod Vercel)
 *
 * Chaque scénario utilise un contexte navigateur isolé pour éviter
 * les interférences (cookies, localStorage, etc.). Les erreurs ne
 * sont pas fatales : si un screenshot échoue, on continue.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT  = path.resolve(__dirname, '../../annexes/screenshots');
const APP  = process.env.APP_URL || 'https://crew-planner-hazel.vercel.app';
const API  = APP.includes('localhost')
  ? 'http://localhost:3000/api'
  : 'https://crew-back.fly.dev/api';

await mkdir(OUT, { recursive: true });

const VP_DESKTOP = { width: 1440, height: 900 };
const VP_MOBILE  = { width: 390,  height: 844 };

const SOPHIE = { email: 'sophie.manager@bistrot.fr', password: 'motdepasse123' };
const JULIEN = { email: 'julien.patron@bistrot.fr',  password: 'motdepasse123' };
const LUCAS  = { email: 'lucas.serveur@bistrot.fr',  password: 'motdepasse123' };

const browser = await chromium.launch();
console.log(`[screenshots] cible : ${APP}`);

async function ctxNew(viewport = VP_DESKTOP, locale = 'fr-FR') {
  return browser.newContext({ viewport, locale, timezoneId: 'Europe/Paris' });
}

async function login(page, user) {
  await page.goto(`${APP}/login`);
  await page.waitForSelector('input[type=email]', { timeout: 25000 });
  await page.fill('input[type=email]', user.email);
  await page.fill('input[type=password]', user.password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|teams)/, { timeout: 25000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function shoot(page, name, opts = {}) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: opts.full ?? false });
  console.log(`  ✓ ${name}`);
}

async function safe(name, fn) {
  try {
    await fn();
  } catch (err) {
    console.log(`  ✗ ${name} — ${err.message.split('\n')[0].slice(0, 120)}`);
  }
}

async function getFamilyId(page) {
  return await page.evaluate(async (api) => {
    const token = localStorage.getItem('reminder_token');
    const r = await fetch(`${api}/families`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    return j[0]?.id;
  }, API);
}

// ──── Public (pas auth) ────────────────────────────────────────────

await safe('01-login-clair', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`);
  await page.waitForSelector('input[type=email]', { timeout: 20000 });
  await page.waitForTimeout(800);
  await shoot(page, '01-login-clair.png');
  await ctx.close();
});

await safe('02-login-sombre', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`);
  await page.evaluate(() => {
    localStorage.setItem('reminder_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.reload();
  await page.waitForSelector('input[type=email]');
  await page.waitForTimeout(800);
  await shoot(page, '02-login-sombre.png');
  await ctx.close();
});

await safe('03-register', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await page.goto(`${APP}/register`);
  await page.waitForSelector('input[name=firstName], form input', { timeout: 20000 });
  await page.waitForTimeout(800);
  await shoot(page, '03-register.png');
  await ctx.close();
});

// ──── Sophie (manager) — parcours complet ─────────────────────────

await safe('Sophie-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, SOPHIE);

  await safe('04-dashboard-manager', async () => {
    await page.goto(`${APP}/dashboard`);
    await page.waitForTimeout(3000);
    await shoot(page, '04-dashboard-manager.png', { full: true });
  });

  await safe('05-team-detail', async () => {
    const id = await getFamilyId(page);
    await page.goto(`${APP}/teams/${id}`);
    await page.waitForSelector('.member-list', { timeout: 30000 });
    await page.waitForTimeout(1200);
    await shoot(page, '05-team-detail.png', { full: true });
  });

  await safe('06-member-setup-wizard', async () => {
    const id = await getFamilyId(page);
    await page.goto(`${APP}/teams/${id}`);
    await page.waitForSelector('.member-list', { timeout: 30000 });
    // Open edit modal on the first non-self member
    const editBtn = page.locator('.member-list li button[title*="odifier"], .member-list li button[title*="dit"]').first();
    await editBtn.click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await page.waitForTimeout(600);
    await shoot(page, '06-member-setup-wizard.png');
  });

  await safe('07-planning-grid', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.planning-grid', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shoot(page, '07-planning-grid.png', { full: true });
  });

  await safe('08-smart-planner-modal', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.planning-grid', { timeout: 30000 });
    await page.waitForTimeout(1200);
    // Click "Generate" / "Smart Planner" button
    const btn = page.locator('button').filter({ hasText: /Générer|Generate|planificateur/i }).first();
    await btn.click();
    await page.waitForSelector('.modal', { timeout: 8000 });
    await page.waitForTimeout(1500);
    await shoot(page, '08-smart-planner-modal.png');
  });

  await safe('09-stats-charts', async () => {
    await page.goto(`${APP}/stats`);
    await page.waitForSelector('.stats-charts', { timeout: 30000 });
    await page.waitForTimeout(2500);
    await shoot(page, '09-stats-charts.png', { full: true });
  });

  await safe('10-profile-ical', async () => {
    await page.goto(`${APP}/profile`);
    await page.waitForSelector('canvas', { timeout: 20000 });
    await page.waitForTimeout(1500);
    await shoot(page, '10-profile-ical.png', { full: true });
  });

  await ctx.close();
});

// ──── Lucas (équipier) — vue limitée ───────────────────────────────

await safe('Lucas-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, LUCAS);

  await safe('11-dashboard-equipier', async () => {
    await page.goto(`${APP}/dashboard`);
    await page.waitForTimeout(2500);
    await shoot(page, '11-dashboard-equipier.png', { full: true });
  });

  await safe('12-planning-equipier', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.planning-grid', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shoot(page, '12-planning-equipier.png', { full: true });
  });

  await ctx.close();
});

// ──── Julien (patron) — admin team detail ──────────────────────────

await safe('Julien-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, JULIEN);

  await safe('13-teams-list', async () => {
    await page.goto(`${APP}/teams`);
    await page.waitForSelector('.family-list', { timeout: 30000 });
    await page.waitForTimeout(800);
    await shoot(page, '13-teams-list.png');
  });

  await safe('14-reset-password-modal', async () => {
    const id = await getFamilyId(page);
    await page.goto(`${APP}/teams/${id}`);
    await page.waitForSelector('.member-list', { timeout: 30000 });
    const btn = page.locator('button[title*="éinitialiser"], button[title*="Reset"]').first();
    await btn.click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await page.waitForTimeout(400);
    try {
      await page.locator('.modal button').filter({ hasText: /Réinitialiser|Reset/i }).first().click();
      await page.waitForSelector('.modal h3', { timeout: 5000 });
      await page.waitForTimeout(500);
    } catch { /* skip */ }
    await shoot(page, '14-reset-password-modal.png');
  });

  await ctx.close();
});

// ──── Mobile ───────────────────────────────────────────────────────

await safe('15-mobile-dashboard', async () => {
  const ctx = await ctxNew(VP_MOBILE);
  const page = await ctx.newPage();
  await login(page, SOPHIE);
  await page.goto(`${APP}/dashboard`);
  await page.waitForTimeout(2500);
  await shoot(page, '15-mobile-dashboard.png', { full: true });
  await ctx.close();
});

await safe('16-mobile-planning', async () => {
  const ctx = await ctxNew(VP_MOBILE);
  const page = await ctx.newPage();
  await login(page, SOPHIE);
  await page.goto(`${APP}/planning`);
  await page.waitForTimeout(2500);
  await shoot(page, '16-mobile-planning.png', { full: true });
  await ctx.close();
});

// ──── Langue EN ────────────────────────────────────────────────────

await safe('17-english-dashboard', async () => {
  const ctx = await ctxNew(VP_DESKTOP, 'en-US');
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`);
  await page.evaluate(() => localStorage.setItem('reminder_lang', 'en'));
  await page.reload();
  await page.fill('input[type=email]', SOPHIE.email);
  await page.fill('input[type=password]', SOPHIE.password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|teams)/, { timeout: 25000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.goto(`${APP}/dashboard`);
  await page.waitForTimeout(2500);
  await shoot(page, '17-english-dashboard.png', { full: true });
  await ctx.close();
});

await browser.close();
console.log(`\n[screenshots] Terminé. Fichiers : ${OUT}`);
