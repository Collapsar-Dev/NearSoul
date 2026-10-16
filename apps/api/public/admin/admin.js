// NearSoul admin client. Talks to /admin/v1 with a short-lived admin token kept in sessionStorage only.
const api = (path, opts = {}) => {
  const token = sessionStorage.getItem('ns_admin');
  return fetch(`/admin/v1${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  }).then(async (r) => {
    const body = r.status === 204 ? null : await r.json().catch(() => null);
    if (r.status === 401) { sessionStorage.removeItem('ns_admin'); show(); }
    if (!r.ok) throw new Error(body?.error?.message || `HTTP ${r.status}`);
    return body;
  });
};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const view = $('#view');

function show() {
  const authed = !!sessionStorage.getItem('ns_admin');
  $('#login').hidden = authed;
  $('#nav').hidden = !authed;
  view.hidden = !authed;
  if (authed) tabs.queue();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    const r = await api('/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(f)) });
    sessionStorage.setItem('ns_admin', r.token);
    show();
  } catch (err) { $('#login-error').textContent = err.message; }
});
$('#logout').addEventListener('click', () => { sessionStorage.removeItem('ns_admin'); show(); });
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => tabs[b.dataset.tab]()));

const tabs = {
  async queue(status = 'open') {
    const rows = await api(`/queue?status=${status}`);
    view.innerHTML = `<h1>Reports</h1>
      <p><select id="qs">${['open', 'in_review', 'actioned', 'dismissed', 'all'].map((s) => `<option ${s === status ? 'selected' : ''}>${s}</option>`).join('')}</select></p>
      <table><tr><th>When</th><th>Category</th><th>Status</th><th></th></tr>
      ${rows.map((r) => `<tr><td>${new Date(r.createdAt).toLocaleString()}</td><td>${r.urgent ? '<span class="badge urgent">URGENT</span> ' : ''}${esc(r.category)}${r.hasChat ? ' <span class="badge">chat</span>' : ''}</td><td>${esc(r.status)}</td><td><button data-case="${r.id}">Open</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nothing here.</td></tr>'}
      </table>`;
    $('#qs').onchange = (e) => tabs.queue(e.target.value);
    view.querySelectorAll('[data-case]').forEach((b) => (b.onclick = () => tabs.case(b.dataset.case)));
  },
  async case(id) {
    const c = await api(`/cases/${id}`);
    const u = c.reported || {};
    view.innerHTML = `<p><button id="back">← Back</button></p>
      <div class="card"><h2>${esc(c.report.category)} ${c.report.urgent ? '<span class="badge urgent">URGENT</span>' : ''}</h2>
        <p>${esc(c.report.comment) || '<span class="muted">No comment</span>'}</p><p class="muted">Status: ${esc(c.report.status)} · ${new Date(c.report.createdAt).toLocaleString()}</p></div>
      <div class="card"><h3>Reported: ${esc(u.firstName)} <span class="badge">${esc(u.status)}</span> ${u.hidden ? '<span class="badge">hidden</span>' : ''}</h3>
        <p>${esc(u.bio)}</p><p class="muted">Prior reports: ${u.priorReports} · Joined ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</p>
        <div class="photos">${(u.photos || []).map((p) => `<label style="display:inline-block"><img src="${esc(p.url)}" alt=""><br><input type="radio" name="photo" value="${p.id}"> select</label>`).join('')}</div></div>
      ${c.messages.length ? `<div class="card"><h3>Last messages (access is logged)</h3>${c.messages.map((m) => `<div class="msg ${m.from}">${esc(m.body)}</div>`).join('')}</div>` : ''}
      <div class="card"><h3>Action</h3>
        <select id="act">${['warn', 'hide', 'restore', 'remove_photo', 'suspend', 'dismiss'].map((a) => `<option>${a}</option>`).join('')}</select>
        <label>Reason (required) <textarea id="reason" rows="2"></textarea></label>
        <button class="primary" id="assign">Assign to me</button> <button class="danger" id="resolve">Apply</button> <span class="error" id="err"></span></div>`;
    $('#back').onclick = () => tabs.queue();
    $('#assign').onclick = () => api(`/cases/${id}/assign`, { method: 'POST' }).then(() => tabs.case(id));
    $('#resolve').onclick = async () => {
      const photo = view.querySelector('input[name=photo]:checked')?.value;
      try {
        await api(`/cases/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action: $('#act').value, reason: $('#reason').value, ...(photo ? { photoId: photo } : {}) }) });
        tabs.queue();
      } catch (e) { $('#err').textContent = e.message; }
    };
  },
  async metrics() {
    const m = await api('/metrics');
    const stat = (k, v) => `<div class="card"><div class="muted">${k}</div><div class="stat">${v ?? 0}</div></div>`;
    view.innerHTML = `<h1>Metrics</h1><div class="grid">${stat('Users', m.users)}${stat('Active', m.active)}${stat('Testers', m.testers)}${stat('Matches', m.matches)}${stat('Messages', m.messages)}${stat('Open reports', m.openReports)}${stat('Urgent', m.urgentReports)}${stat('New feedback', m.newFeedback)}</div>
      <div class="card"><h3>Accuracy ratings</h3>${m.ratings.map((r) => `<p>${esc(r.kind)}: <strong>${(r.avg ?? 0).toFixed(2)}</strong> / 5 (${r.count})</p>`).join('') || '<p class="muted">No ratings yet.</p>'}</div>
      <div class="card"><h3>Archetypes</h3>${m.archetypes.map((a) => `<span class="badge">${esc(a.archetype)}: ${a.count}</span> `).join('')}</div>`;
  },
  async feedback(status = 'new') {
    const rows = await api(`/feedback?status=${status}`);
    view.innerHTML = `<h1>Feedback</h1><p><select id="fs">${['new', 'triaged', 'done', 'all'].map((s) => `<option ${s === status ? 'selected' : ''}>${s}</option>`).join('')}</select></p>
      <table><tr><th>When</th><th>Category</th><th>Text</th><th>Where</th><th></th></tr>
      ${rows.map((f) => `<tr><td>${new Date(f.createdAt).toLocaleString()}</td><td>${esc(f.category)}</td><td>${esc(f.text)}</td><td class="muted">${esc(f.platform)} ${esc(f.screen)} ${esc(f.appVersion)}</td>
        <td><select data-fb="${f.id}">${['new', 'triaged', 'done'].map((s) => `<option ${s === f.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nothing here.</td></tr>'}</table>`;
    $('#fs').onchange = (e) => tabs.feedback(e.target.value);
    view.querySelectorAll('[data-fb]').forEach((s) => (s.onchange = () => api(`/feedback/${s.dataset.fb}`, { method: 'PATCH', body: JSON.stringify({ status: s.value }) })));
  },
  async invites() {
    const rows = await api('/invites').catch((e) => { view.innerHTML = `<p class="error">${esc(e.message)}</p>`; return null; });
    if (!rows) return;
    view.innerHTML = `<h1>Invites</h1><div class="card"><label>How many codes <input id="n" type="number" value="5" min="1" max="100"></label><label>Uses per code <input id="u" type="number" value="1" min="1" max="500"></label><button class="primary" id="gen">Create</button><pre id="out"></pre></div>
      <table><tr><th>Code</th><th>Uses</th><th>By</th><th>Created</th></tr>${rows.map((i) => `<tr><td><code>${esc(i.code)}</code></td><td>${i.uses}/${i.maxUses}</td><td>${i.byAdmin ? 'admin' : 'tester'}</td><td>${new Date(i.createdAt).toLocaleDateString()}</td></tr>`).join('')}</table>`;
    $('#gen').onclick = async () => {
      const r = await api('/invites', { method: 'POST', body: JSON.stringify({ count: Number($('#n').value), maxUses: Number($('#u').value) }) });
      $('#out').textContent = r.links.join('\n');
    };
  },
  async users() {
    view.innerHTML = `<h1>Users</h1><div class="card"><label>Find by email <input id="em" type="email"></label><button class="primary" id="find">Find</button><div id="res"></div></div>`;
    $('#find').onclick = async () => {
      try {
        const u = await api(`/users?email=${encodeURIComponent($('#em').value)}`);
        $('#res').innerHTML = `<p><strong>${esc(u.firstName)}</strong> · ${esc(u.status)} · ${esc(u.role)} ${u.hidden ? '· hidden' : ''}</p><p class="muted">id ${esc(u.id)} · joined ${new Date(u.createdAt).toLocaleDateString()} · last active ${new Date(u.lastActiveAt).toLocaleString()}</p>`;
      } catch (e) { $('#res').innerHTML = `<p class="error">${esc(e.message)}</p>`; }
    };
  },
};

show();
