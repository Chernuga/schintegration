// tools/grades.js — example tool. Copy this file as a template for others.
window.renderTool = async function({ userId, tool, rest, me, content }) {
  content.innerHTML = '<p class="muted">Loading grades…</p>';

  // TODO: replace this with a real API call, e.g. api(`/grades?user=${userId}`)
  // For now it just proves the routing works.
  const who = userId === me.id ? 'you' : (userId);

  content.innerHTML = `
    <h1>📊 Grades — ${who}</h1>
    <div class="card">
      <p class="muted">This is a demo. When you're ready, wire this to a real
      endpoint on the Worker that checks permissions for
      <code>${userId}/${tool}</code> before returning data.</p>
      <p class="muted">URL segments after the tool: <code>${JSON.stringify(rest)}</code></p>
    </div>
  `;
};
