/* ============================================================
   CALLCENTER PRO - API Client & App Core
   ============================================================ */

const API_BASE = 'https://callcenter-api.onrender.com';

// ── Token Management ──────────────────────────────────────────
const Auth = {
  getToken: () => sessionStorage.getItem('cc_token'),
  getUser:  () => JSON.parse(sessionStorage.getItem('cc_user') || 'null'),
  setSession: (token, user) => {
    sessionStorage.setItem('cc_token', token);
    sessionStorage.setItem('cc_user', JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem('cc_token');
    sessionStorage.removeItem('cc_user');
  },
  isLoggedIn: () => !!sessionStorage.getItem('cc_token'),
};

// ── API Client ────────────────────────────────────────────────
const api = {
  async request(method, path, body = null, isForm = false) {
    const headers = {};
    if (!isForm) headers['Content-Type'] = 'application/json';
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    if (res.status === 401) {
      Auth.clear();
      window.location.href = '/pages/login.html';
      return;
    }

    // Binary response (PDF/Excel)
    const ct = res.headers.get('Content-Type') || '';
    if (ct.includes('application/pdf') || ct.includes('spreadsheetml')) {
      return res.blob();
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
    return data;
  },
  get:    (path)         => api.request('GET', path),
  post:   (path, body)   => api.request('POST', path, body),
  put:    (path, body)   => api.request('PUT', path, body),
  patch:  (path, body)   => api.request('PATCH', path, body),
  delete: (path)         => api.request('DELETE', path),
  upload: (path, form)   => api.request('POST', path, form, true),
};

// ── Toast Notifications ───────────────────────────────────────
const Toast = (() => {
  let container;
  const init = () => {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  };
  const show = (title, msg, type = 'info', duration = 4000) => {
    init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  };
  return {
    success: (t, m) => show(t, m, 'success'),
    error:   (t, m) => show(t, m, 'error'),
    info:    (t, m) => show(t, m, 'info'),
  };
})();

// ── Modal Helper ──────────────────────────────────────────────
const Modal = {
  open(id) {
    document.getElementById(id)?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    document.getElementById(id)?.classList.remove('open');
    document.body.style.overflow = '';
  },
};

// ── Badge Renderer ─────────────────────────────────────────────
const badge = (val, label = null) => {
  const text = label || val || '-';
  return `<span class="badge badge-${(val||'').toLowerCase()}">${text}</span>`;
};

// ── Initials ───────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || '?';

// ── Date Format ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }) : '-';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-PE') : '-';
const fmtDuration = (s) => {
  if (!s) return '-';
  const m = Math.floor(s / 60), sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Download Blob ──────────────────────────────────────────────
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Nav / Sidebar Active ───────────────────────────────────────
const setNavActive = (page) => {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
};

// ── Role Guard ─────────────────────────────────────────────────
const requireAuth = () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
};

const canAccess = (...roles) => roles.includes(Auth.getUser()?.role);

// ── Populate User Sidebar ──────────────────────────────────────
const populateUserSidebar = () => {
  const user = Auth.getUser();
  if (!user) return;
  const el = document.getElementById('sidebar-user');
  if (!el) return;
  el.innerHTML = `
    <div class="user-card">
      <div class="user-avatar">${initials(user.name)}</div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-role">${user.role}</div>
      </div>
      <button class="logout-btn" onclick="logout()" title="Cerrar sesión">⏻</button>
    </div>
  `;
};

const logout = () => {
  Auth.clear();
  window.location.href = '/pages/login.html';
};

// ── Hide elements by role ──────────────────────────────────────
const applyRoleVisibility = () => {
  const user = Auth.getUser();
  if (!user) return;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(',').map(r => r.trim());
    if (!roles.includes(user.role)) el.classList.add('hidden');
  });
};
