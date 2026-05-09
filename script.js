'use strict';

/* ════════════════════════════════════════
   SUPABASE CONFIG
════════════════════════════════════════ */
const SUPA_URL    = 'https://oujdbevbgqntkousvsms.supabase.co';
const SUPA_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91amRiZXZiZ3FudGtvdXN2c21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTg3NTYsImV4cCI6MjA5MzMzNDc1Nn0.fKAlZbRI-L10rTmWwjLPIWXTYiEY9UVhNkLS_Q4sleE';
const SUPA_BUCKET = 'pdfs';

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
const state = {
  step: 1,
  estimatedSubscriptions: 0,
  choiceLabel: '',
  estimatedUnused: 0,
  hikesCost: 0,
  monthlyLoss: 0,
  annualLoss: 0,
  leadId: null
};

/* ════════════════════════════════════════
   SIM TABLES
════════════════════════════════════════ */
const SIM = {
  2: { unused:1, hikesCost:6,  monthlyLoss:17,  annualLoss:208,  label:'0–3 abonnements estimés' },
  5: { unused:2, hikesCost:11, monthlyLoss:34,  annualLoss:406,  label:'4–6 abonnements estimés' },
  9: { unused:3, hikesCost:16, monthlyLoss:51,  annualLoss:612,  label:'7+ abonnements estimés'  }
};

/* ════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════ */
function goTo(n) {
  if (n < 1 || n > 5) return;
  if (n === 3 && state.estimatedSubscriptions === 0) return;
  const curr = document.getElementById('screen-' + state.step);
  const next = document.getElementById('screen-' + n);
  if (!curr || !next) return;
  curr.classList.remove('active');
  if (n === 3) buildSim();
  if (n === 5) buildFinal();
  void next.offsetWidth;
  next.classList.add('active');
  const body = next.querySelector('.screen-body');
  if (body) {
    body.classList.remove('entering');
    void body.offsetWidth;
    body.classList.add('entering');
    setTimeout(() => body.classList.remove('entering'), 900);
  }
  state.step = n;
  updateChrome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (state.step > 1) goTo(state.step - 1);
}

/* ════════════════════════════════════════
   CHROME
════════════════════════════════════════ */
function updateChrome() {
  const n = state.step;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = ((n - 1) / 4 * 100) + '%';
  const stepEl = document.getElementById('topbar-step');
  if (stepEl) stepEl.textContent = 'Étape ' + n + ' / 5';
  const back = document.getElementById('back-btn');
  if (back) back.classList.toggle('hidden', n === 1);
  updateSticky();
}

function updateSticky() {
  const map = {
    1: 'Découvrir ce que je perds →',
    2: state.estimatedSubscriptions > 0 ? 'Voir mon estimation →' : 'Choisissez une option',
    3: 'Reprendre le contrôle →',
    4: "J'ai compris, je continue →",
    5: 'Commencer mon analyse →'
  };
  const el = document.getElementById('sticky-text');
  if (el) el.textContent = map[state.step] || 'Continuer →';
}

function stickyAction() {
  if (state.step === 2 && state.estimatedSubscriptions === 0) {
    const choices = document.getElementById('choices');
    if (choices) {
      choices.style.animation = 'shake .35s ease';
      setTimeout(() => choices.style.animation = '', 400);
    }
    return;
  }
  goTo(state.step < 5 ? state.step + 1 : 5);
}

/* ════════════════════════════════════════
   CHOICE
════════════════════════════════════════ */
function selectChoice(el, count, label) {
  document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.estimatedSubscriptions = count;
  state.choiceLabel = label;
  const btn = document.getElementById('btn-step2');
  if (btn) {
    btn.classList.remove('btn-disabled');
    btn.classList.add('btn-primary');
    btn.style.pointerEvents = 'auto';
  }
  updateSticky();
}

/* ════════════════════════════════════════
   BUILD SIMULATION
════════════════════════════════════════ */
function buildSim() {
  const d = SIM[state.estimatedSubscriptions] || SIM[5];
  state.estimatedUnused = d.unused;
  state.hikesCost       = d.hikesCost;
  state.monthlyLoss     = d.monthlyLoss;
  state.annualLoss      = d.annualLoss;
  setText('sim-context-text',
    'Vous avez indiqué environ <strong>' + state.choiceLabel + '</strong>. ' +
    "Voici l'estimation Serein basée sur les moyennes françaises."
  );
  setText('sim-total',        state.estimatedSubscriptions + ' abonnements');
  setText('sim-unused',       d.unused + ' abonnement' + (d.unused > 1 ? 's' : ''));
  setText('sim-unused-badge', d.unused + ' oublié'     + (d.unused > 1 ? 's' : ''));
  setText('sim-hikes',        '+' + d.hikesCost + ' €/mois');
  const annualEl = document.getElementById('loss-annual');
  if (annualEl) animateCount(annualEl, d.annualLoss, ' € / an', 45, 28);
  setText('loss-detail', '≈ ' + d.monthlyLoss + ' € / mois  ·  ' + d.annualLoss + ' € / an');
}

/* ════════════════════════════════════════
   BUILD FINAL
════════════════════════════════════════ */
function buildFinal() {
  const el = document.getElementById('final-saving');
  if (el) animateCount(el, state.annualLoss, ' €', 40, 28);
}

/* ════════════════════════════════════════
   EMAIL
════════════════════════════════════════ */
function getEmail() {
  const el = document.getElementById('email-input');
  return el ? el.value.trim() : '';
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function shakeEmail() {
  const el = document.getElementById('email-input');
  if (!el) return;
  el.classList.add('invalid');
  el.focus();
  setTimeout(() => el.classList.remove('invalid'), 600);
}

/* ════════════════════════════════════════
   SUPABASE — INSERT LEAD
   Prefer: return=minimal évite le SELECT
   qui était bloqué par RLS
════════════════════════════════════════ */
async function supaInsertLead(email, choice) {
  const res = await fetch(SUPA_URL + '/rest/v1/leads', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Prefer':        'return=minimal'
    },
    body: JSON.stringify({
      email:                   email,
      choice:                  choice,
      estimated_subscriptions: state.estimatedSubscriptions,
      monthly_loss:            state.monthlyLoss,
      annual_loss:             state.annualLoss
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('leads insert: ' + err);
  }

  /* Avec return=minimal Supabase retourne 201 sans body.
     On génère un ID temporaire côté client pour lier le PDF. */
  const locationHeader = res.headers.get('location') || '';
  const match = locationHeader.match(/id=eq\.([^&]+)/);
  if (match) return { id: match[1] };

  /* Fallback : ID pseudo-unique pour la session */
  return { id: 'tmp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) };
}

/* ════════════════════════════════════════
   SUPABASE — INSERT PDF SCAN
════════════════════════════════════════ */
async function supaInsertScan(leadId, filePath) {
  const res = await fetch(SUPA_URL + '/rest/v1/pdf_scans', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Prefer':        'return=minimal'
    },
    body: JSON.stringify({
      lead_id:   leadId.startsWith('tmp_') ? null : leadId,
      file_path: filePath,
      status:    'pending'
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('pdf_scans insert: ' + err);
  }
}

/* ════════════════════════════════════════
   SUPABASE — UPLOAD PDF
════════════════════════════════════════ */
async function supaUploadPdf(leadId, file) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = leadId + '/' + Date.now() + '_' + safe;
  const res = await fetch(
    SUPA_URL + '/storage/v1/object/' + SUPA_BUCKET + '/' + path, {
    method: 'POST',
    headers: {
      'apikey':        SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type':  'application/pdf',
      'x-upsert':      'false'
    },
    body: file
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('storage upload: ' + err);
  }
  return path;
}

/* ════════════════════════════════════════
   CONVERSION
════════════════════════════════════════ */
async function handleConversion(event, type) {
  const email = getEmail();
  if (!isValidEmail(email)) {
    shakeEmail();
    showToast('✉️ Entrez votre adresse e-mail pour continuer');
    return;
  }
  const btn = event.currentTarget;
  const origHTML = btn.innerHTML;
  setLoading(btn, true);
  try {
    if (!state.leadId) {
      const lead = await supaInsertLead(email, type);
      state.leadId = lead.id;
    }
    if (type === 'bank') {
      setLoading(btn, false, origHTML);
      showToast('🏦 Inscription confirmée ! Connexion bancaire bientôt disponible.');
    } else {
      setLoading(btn, false, origHTML);
      showPdfZone();
    }
  } catch (err) {
    console.error('Serein error:', err);
    setLoading(btn, false, origHTML);
    showToast('⚠️ Une erreur est survenue. Réessayez dans un instant.');
  }
}

function setLoading(btn, on, origHTML) {
  if (on) {
    btn.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    btn.style.pointerEvents = 'none';
  } else {
    if (origHTML) btn.innerHTML = origHTML;
    btn.style.pointerEvents = 'auto';
  }
}

/* ════════════════════════════════════════
   PDF ZONE
════════════════════════════════════════ */
function showPdfZone() {
  const zone = document.getElementById('pdf-upload-zone');
  if (!zone) return;
  zone.classList.remove('hidden');
  setTimeout(() => zone.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  const input = document.getElementById('pdf-file-input');
  if (input && !input._bound) {
    input._bound = true;
    input.addEventListener('change', () => {
      if (input.files && input.files[0]) handlePdfFile(input.files[0]);
    });
  }
  if (!zone._ddBound) {
    zone._ddBound = true;
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const f = e.dataTransfer.files[0];
      if (f && f.type === 'application/pdf') handlePdfFile(f);
      else showToast('⚠️ Fichier PDF uniquement');
    });
  }
}

async function handlePdfFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    setUploadStatus('Fichier trop lourd (max 10 Mo).', 'err');
    return;
  }
  setUploadStatus('Envoi en cours…', '');
  try {
    if (!state.leadId) {
      const email = getEmail();
      if (!isValidEmail(email)) { shakeEmail(); return; }
      const lead = await supaInsertLead(email, 'pdf');
      state.leadId = lead.id;
    }
    const path = await supaUploadPdf(state.leadId, file);
    await supaInsertScan(state.leadId, path);
    setUploadStatus('✓ ' + file.name + ' reçu — analyse en cours…', 'ok');
    showToast('📄 Relevé reçu ! Vous recevrez votre analyse par email.');
  } catch (err) {
    console.error('PDF upload error:', err);
    setUploadStatus('Échec envoi. Vérifiez votre connexion.', 'err');
  }
}

function setUploadStatus(msg, cls) {
  const el = document.getElementById('upload-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'upload-status' + (cls ? ' ' + cls : '');
}

/* ════════════════════════════════════════
   UTILS
════════════════════════════════════════ */
function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function animateCount(el, target, suffix, steps, ms) {
  if (!el) return;
  let cur = 0;
  const step = Math.ceil(target / steps);
  clearInterval(el._iv);
  el._iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur + suffix;
    if (cur >= target) clearInterval(el._iv);
  }, ms);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateChrome();
  const s1 = document.querySelector('#screen-1 .screen-body');
  if (s1) {
    s1.classList.add('entering');
    setTimeout(() => s1.classList.remove('entering'), 1200);
  }
});
