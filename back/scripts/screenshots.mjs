#!/usr/bin/env node
/**
 * Captures d'écran RestoTask. Réutilise des contextes par-user pour
 * éviter les ré-authentifications + rate-limiting Fly/Vercel.
 *
 * Usage : node scripts/screenshots-resto.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../annexes/screenshots');
const APP = process.env.APP_URL || 'https://restotask.vercel.app';
const API_BASE = APP.includes('localhost')
  ? 'http://localhost:3000/api'
  : 'https://reminder-famille-back.fly.dev/api';

await mkdir(OUT, { recursive: true });

const VP_DESKTOP = { width: 1440, height: 900 };
const VP_MOBILE  = { width: 390,  height: 844 };

const JULIEN = { email: 'julien.patron@bistrot.fr',  password: 'motdepasse123' };
const AHMED  = { email: 'ahmed.chef@bistrot.fr',     password: 'motdepasse123' };
const LUCAS  = { email: 'lucas.serveur@bistrot.fr',  password: 'motdepasse123' };

const browser = await chromium.launch();
console.log(`[screenshots-resto] cible : ${APP}`);

async function ctxNew(viewport = VP_DESKTOP, locale = 'fr-FR') {
  return browser.newContext({ viewport, locale, timezoneId: 'Europe/Paris' });
}

async function login(page, user) {
  await page.goto(`${APP}/login`);
  await page.waitForSelector('input[type=email]', { timeout: 20000 });
  await page.fill('input[type=email]', user.email);
  await page.fill('input[type=password]', user.password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|families)/, { timeout: 25000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
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
  return await page.evaluate(async (apiBase) => {
    const token = localStorage.getItem('reminder_token');
    const r = await fetch(`${apiBase}/families`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    return j[0]?.id;
  }, API_BASE);
}

// ──── Pas auth ─────────────────────────────────────────────────────

await safe('01-login-clair', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`);
  await page.waitForSelector('input[type=email]', { timeout: 20000 });
  await page.waitForTimeout(1000);
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
  await page.waitForTimeout(1000);
  await shoot(page, '02-login-sombre.png');
  await ctx.close();
});

// ──── Suite Julien : login une fois, naviguer partout ──────────────

await safe('Julien-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, JULIEN);

  await safe('03-dashboard-patron', async () => {
    await page.goto(`${APP}/dashboard`);
    await page.waitForTimeout(3000);
    await shoot(page, '03-dashboard-patron.png', { full: true });
  });

  await safe('05-tasks-list', async () => {
    await page.goto(`${APP}/tasks`);
    await page.waitForSelector('.task-card', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await shoot(page, '05-tasks-list.png');
  });

  await safe('07-establishment-detail', async () => {
    const id = await getFamilyId(page);
    await page.goto(`${APP}/families/${id}`);
    await page.waitForSelector('.member-list', { timeout: 30000 });
    await page.waitForTimeout(1200);
    await shoot(page, '07-establishment-detail.png', { full: true });
  });

  await safe('08-reset-password-modal', async () => {
    const id = await getFamilyId(page);
    await page.goto(`${APP}/families/${id}`);
    await page.waitForSelector('button[title*="éinitialiser"], button[title*="ot de passe"]', { timeout: 30000 });
    await page.locator('button[title*="éinitialiser"], button[title*="ot de passe"]').first().click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await page.waitForTimeout(500);
    try {
      await page.locator('.modal button').filter({ hasText: /Réinitialiser|Reset/i }).first().click();
      await page.waitForSelector('.modal h3:has-text("Mot de passe"), .modal h3:has-text("Password")', { timeout: 5000 });
      await page.waitForTimeout(500);
    } catch { /* skip */ }
    await shoot(page, '08-reset-password-modal.png');
  });

  await safe('09-profile-ical', async () => {
    await page.goto(`${APP}/profile`);
    await page.waitForSelector('canvas', { timeout: 20000 });
    await page.waitForTimeout(1500);
    await shoot(page, '09-profile-ical.png', { full: true });
  });

  await safe('11-confirm-modal', async () => {
    await page.goto(`${APP}/tasks`);
    await page.waitForSelector('.task-card', { timeout: 30000 });
    await page.locator('.task-card button.ghost.icon-only').first().click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await page.waitForTimeout(300);
    await shoot(page, '11-confirm-modal.png');
    // Close the modal so next nav works
    await page.locator('.modal button.secondary, .modal button.ghost.icon-only').first().click().catch(() => {});
  });

  await safe('14-establishments-list', async () => {
    await page.goto(`${APP}/families`);
    await page.waitForSelector('.family-list', { timeout: 30000 });
    await page.waitForTimeout(800);
    await shoot(page, '14-establishments-list.png');
  });

  await safe('15-calendar-view', async () => {
    await page.goto(`${APP}/calendar`);
    await page.waitForSelector('.calendar-grid', { timeout: 30000 });
    await page.waitForTimeout(1200);
    await shoot(page, '15-calendar-view.png', { full: true });
  });

  await safe('16-stats-charts', async () => {
    await page.goto(`${APP}/stats`);
    await page.waitForSelector('.stats-charts', { timeout: 30000 });
    await page.waitForTimeout(2500);
    await shoot(page, '16-stats-charts.png', { full: true });
  });

  await safe('18-planning-grid', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.planning-grid', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shoot(page, '18-planning-grid.png', { full: true });
  });

  await safe('20-shift-form-modal', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.shift-pill', { timeout: 30000 });
    await page.waitForTimeout(700);
    await page.locator('.shift-pill').first().click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    await page.waitForTimeout(500);
    await shoot(page, '20-shift-form-modal.png');
  });

  await ctx.close();
});

// ──── Task form + toast (with fresh Julien session) ───────────────

await safe('TaskForm-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, JULIEN);

  await safe('06-task-form', async () => {
    await page.goto(`${APP}/tasks/new`);
    await page.waitForSelector('form input[type=text], form input:not([type])', { timeout: 30000 });
    const titleInput = page.locator('form input').first();
    await titleInput.fill('Commande boucher — agneau pour service de samedi');
    await page.locator('form textarea').first().fill('Voir avec Boucherie Romano : 8 kg gigot + 4 kg côtelettes.');
    await page.waitForTimeout(800);
    await shoot(page, '06-task-form.png', { full: true });
  });

  await safe('10-toast', async () => {
    await page.goto(`${APP}/tasks/new`);
    await page.waitForSelector('form input', { timeout: 30000 });
    await page.locator('form input').first().fill('Inventaire stock cave');
    const future = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    await page.locator('input[type=date]').fill(future);
    await page.waitForTimeout(300);
    await page.locator('button[type=submit]').first().click();
    await page.waitForSelector('.toast', { timeout: 8000 });
    await page.waitForTimeout(400);
    await shoot(page, '10-toast.png');
  });

  await ctx.close();
});

// ──── Suite Lucas (équipier) ───────────────────────────────────────

await safe('Lucas-suite', async () => {
  const ctx = await ctxNew();
  const page = await ctx.newPage();
  await login(page, LUCAS);

  await safe('04-dashboard-equipier', async () => {
    await page.goto(`${APP}/dashboard`);
    await page.waitForTimeout(2500);
    await shoot(page, '04-dashboard-equipier.png', { full: true });
  });

  await safe('19-planning-equipier', async () => {
    await page.goto(`${APP}/planning`);
    await page.waitForSelector('.planning-grid', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shoot(page, '19-planning-equipier.png', { full: true });
  });

  await ctx.close();
});

// ──── Suite mobile + EN ────────────────────────────────────────────

await safe('12-mobile', async () => {
  const ctx = await ctxNew(VP_MOBILE);
  const page = await ctx.newPage();
  await login(page, JULIEN);
  await page.goto(`${APP}/tasks`);
  await page.waitForSelector('.task-card', { timeout: 30000 });
  await page.waitForTimeout(1000);
  await shoot(page, '12-mobile.png', { full: true });
  await ctx.close();
});

await safe('13-mobile-dashboard', async () => {
  const ctx = await ctxNew(VP_MOBILE);
  const page = await ctx.newPage();
  await login(page, JULIEN);
  await page.goto(`${APP}/dashboard`);
  await page.waitForTimeout(2500);
  await shoot(page, '13-mobile-dashboard.png');
  await ctx.close();
});

await safe('17-english-dashboard', async () => {
  const ctx = await ctxNew(VP_DESKTOP, 'en-US');
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`);
  await page.evaluate(() => localStorage.setItem('reminder_lang', 'en'));
  await page.reload();
  await page.fill('input[type=email]', JULIEN.email);
  await page.fill('input[type=password]', JULIEN.password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|families)/, { timeout: 25000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.goto(`${APP}/dashboard`);
  await page.waitForTimeout(2500);
  await shoot(page, '17-english-dashboard.png', { full: true });
  await ctx.close();
});

await browser.close();
console.log(`\n[screenshots-resto] Tout est dans ${OUT}`);
