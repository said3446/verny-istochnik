const listEl = document.getElementById('list');
const leadEl = document.getElementById('lead');
const updatedEl = document.getElementById('updatedAt');
const searchInput = document.getElementById('searchInput');
const chips = [...document.querySelectorAll('.chip')];

let state = { items: [], filtered: [], category: '', q: '' };

async function fetchNews() {
  const res = await fetch('/api/news');
  const data = await res.json();
  state.items = data.items || [];
  state.filtered = state.items;
  applyFilters(); // will call render
  updatedEl.textContent = data.updatedAt ? ('Обновлено: ' + new Date(data.updatedAt).toLocaleString()) : '';
}

function render() {
  // lead
  leadEl.innerHTML = '';
  const picks = state.filtered.slice(0, 3);
  if (picks.length) {
    const big = card(picks[0]);
    if (picks.length >= 3) {
      const rightCol = document.createElement('div');
      rightCol.style.display = 'grid';
      rightCol.style.gap = '16px';
      rightCol.appendChild(card(picks[1]));
      rightCol.appendChild(card(picks[2]));
      leadEl.appendChild(big); leadEl.appendChild(rightCol);
    } else { leadEl.appendChild(big); }
  }
  // list
  listEl.innerHTML = '';
  state.filtered.slice(3, 60).forEach(item => {
    const li = document.createElement('li');
    li.appendChild(listItem(item));
    listEl.appendChild(li);
  });
}

function card(item) {
  const a = document.createElement('a'); a.href = item.link; a.target = '_blank'; a.rel = 'noopener';
  const el = document.createElement('article'); el.className = 'card';
  const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; img.src = item.enclosureUrl || '/placeholder.jpg';
  const content = document.createElement('div'); content.className = 'content';
  const h3 = document.createElement('h3'); h3.textContent = item.title;
  const p = document.createElement('p'); p.textContent = item.contentSnippet || '';
  const meta = document.createElement('div'); meta.className = 'meta'; meta.innerHTML = `<span>${item.sourceTitle || 'РБК'}</span> • <time>${formatDate(item.isoDate)}</time>`;
  content.appendChild(h3); content.appendChild(p); content.appendChild(meta);
  el.appendChild(img); el.appendChild(content);
  a.appendChild(el); return a;
}

function listItem(item) {
  const a = document.createElement('a'); a.href = item.link; a.target = '_blank'; a.rel = 'noopener';
  const el = document.createElement('article'); el.className = 'item';
  const img = document.createElement('img'); img.alt=''; img.loading='lazy'; img.src = item.enclosureUrl || '/placeholder.jpg';
  const box = document.createElement('div');
  const h4 = document.createElement('h4'); h4.textContent = item.title;
  const p = document.createElement('p'); p.textContent = item.contentSnippet || '';
  const meta = document.createElement('div'); meta.className = 'meta'; meta.innerHTML = `<span>${(item.categories||[]).slice(0,1).join(', ')}</span><span>·</span><time>${formatDate(item.isoDate)}</time>`;
  box.appendChild(h4); box.appendChild(p); box.appendChild(meta);
  el.appendChild(img); el.appendChild(box);
  a.appendChild(el); return a;
}

function formatDate(d) { try { return d ? new Date(d).toLocaleString() : ''; } catch { return ''; } }

searchInput.addEventListener('input', (e) => { state.q = e.target.value.trim(); applyFilters(); });
chips.forEach(ch => ch.addEventListener('click', () => { chips.forEach(c => c.classList.remove('active')); ch.classList.add('active'); state.category = ch.dataset.category || ''; applyFilters(); }));

function applyFilters() {
  const q = state.q.toLowerCase();
  state.filtered = state.items.filter(i => {
    const okQ = q ? ((i.title||'').toLowerCase().includes(q) || (i.contentSnippet||'').toLowerCase().includes(q)) : true;
    const okC = state.category ? (i.categories||[]).some(c => String(c).toLowerCase().includes(state.category.toLowerCase())) : true;
    return okQ && okC;
  });
  render();
}

// periodic refresh
setInterval(fetchNews, 120000);
fetchNews();
