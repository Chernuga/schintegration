// app.js — shared auth, api, sidebar, theme.
// Depends on: config.js (window.API_BASE, window.BASE) and tools.js (window.TOOLS).

(function(){
  const KEY = 'school.auth';

  /* ---------------- auth storage ---------------- */
  window.getAuth = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  };
  window.setAuth = (a) => localStorage.setItem(KEY, JSON.stringify(a));
  window.clearAuth = () => localStorage.removeItem(KEY);

  /* ---------------- api helper ---------------- */
  window.api = async (path, opts = {}) => {
    const auth = getAuth();
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

    let r;
    try {
      r = await fetch(`${window.API_BASE}${path}`, { ...opts, headers });
    } catch {
      throw new Error('Cannot reach the server. Check API_BASE in config.js.');
    }

    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch {
      throw new Error(`Server replied with non-JSON (HTTP ${r.status}). Check API_BASE in config.js.`);
    }
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: r.status });
    return data;
  };

  /* ---------------- auth guards ---------------- */
  window.requireAuth = async (opts = {}) => {
    const auth = getAuth();
    if (!auth) { location.replace(window.BASE + 'login.html'); return null; }
    try {
      const me = await api('/me');
      setAuth({ ...auth, ...me });
      if (opts.admin && !me.isAdmin) { location.replace(window.BASE + 'index.html'); return null; }
      return me;
    } catch {
      clearAuth();
      location.replace(window.BASE + 'login.html');
      return null;
    }
  };

  window.logout = async () => {
    try { await api('/logout', { method: 'POST' }); } catch {}
    clearAuth();
    location.replace(window.BASE + 'login.html');
  };

  /* ---------------- theme ---------------- */
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = savedTheme;
  window.toggleTheme = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
  };

  /* ---------------- sidebar ---------------- */
  window.renderSidebar = async function(me) {
    const host = document.getElementById('sidebar');
    if (!host) return;

    let ctx = { permissions: [], userMap: {}, me: me.id };
    try { ctx = await api('/my-context'); } catch {}

    const byTool = {};
    for (const p of ctx.permissions) (byTool[p.path] ||= []).push(p.target_id);

    const tools = window.TOOLS || [];
    // Which tool is currently active? Look for /{user}/{tool}/ in the path.
    const prefix = window.BASE.replace(/\/$/, '');
    const raw = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : location.pathname;
    const segs = raw.split('/').filter(Boolean);
    const activeTool = segs[1] || '';

    let html = `
      <div class="brand">
        <span>🎒 School Hub</span>
        <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌓</button>
      </div>
    `;

    for (const t of tools) {
      const targets = byTool[t.path] || [];
      if (!targets.length) continue;
      const open = (activeTool === t.path) ? ' open' : '';
      html += `<div class="tool${open}">`;
      html += `<button class="tool-btn" onclick="this.parentElement.classList.toggle('open')">
                 <span>${t.icon}</span><span>${t.name}</span>
               </button>`;
      html += `<div class="sub">`;
      for (const target of targets) {
        const label = target === ctx.me ? 'Me' : (ctx.userMap[target] || target);
        html += `<a href="${window.BASE}${target}/${t.path}/">${label}</a>`;
      }
      html += `</div></div>`;
    }

    html += `<div class="foot">
      <div class="muted" style="font-size:13px;padding:0 10px">
        Logged in as <b>${me.display_name || me.username}</b>
      </div>
      ${me.isAdmin ? `<a class="tool-btn" href="${window.BASE}admin.html">🛠 Admin</a>` : ''}
      <button class="tool-btn" onclick="logout()">↩ Log out</button>
    </div>`;

    host.innerHTML = html;
  };

  window.mountLayout = async function(opts = {}) {
    const me = await requireAuth(opts);
    if (!me) return null;
    await renderSidebar(me);
    return me;
  };
})();
