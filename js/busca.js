/* ══════════════════════════════════════
   BUSCA — OKIRU
   Busca via API Jikan (MyAnimeList) e
   modal de detalhe do resultado.
══════════════════════════════════════ */

const searchOverlay = document.getElementById('searchOverlay');
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchLabel   = document.getElementById('searchLabel');
const searchDetailOverlay = document.getElementById('searchDetailOverlay');

// ── Abrir / fechar busca ──
document.getElementById('btnSearch').addEventListener('click', () => {
  window.setSidebarActive('btnSearch');
  searchOverlay.style.display = 'flex';
  searchInput.focus();
});

document.getElementById('btnCloseSearch').addEventListener('click', fecharBusca);
searchOverlay.addEventListener('click', e => {
  if (e.target === searchOverlay) fecharBusca();
});

function fecharBusca() {
  window.setSidebarActive('btnHome');
  searchOverlay.style.display = 'none';
  searchInput.value = '';
  searchResults.innerHTML = '';
  searchLabel.textContent = 'Resultados';
}

// ── Input com debounce ──
searchInput.addEventListener('input', () => {
  clearTimeout(window.searchTimeout);
  const q = searchInput.value.trim();
  if (!q) {
    searchResults.innerHTML = '';
    searchLabel.textContent = 'Resultados';
    return;
  }
  window.searchTimeout = setTimeout(() => buscarAnime(q), 700);
});

async function buscarAnime(query) {
  searchResults.innerHTML = `<div class="search-spinner">🔍 Buscando<span class="dots"></span></div>`;
  searchLabel.textContent = 'Buscando...';
  try {
    const url  = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderResults(json.data || []);
  } catch (err) {
    searchResults.innerHTML = `<div class="search-spinner">❌ Erro ao buscar. Verifique sua conexão.</div>`;
    searchLabel.textContent = 'Resultados';
  }
}

function renderResults(data) {
  searchResults.innerHTML = '';
  if (!data.length) { searchLabel.textContent = 'Nenhum resultado encontrado'; return; }
  searchLabel.textContent = `Resultados (${data.length})`;

  data.forEach(anime => {
    const item   = document.createElement('div');
    item.classList.add('search-result-item');
    const thumb  = anime.images?.jpg?.image_url || '';
    const studio = anime.studios?.[0]?.name || 'Estúdio desconhecido';
    const score  = anime.score ? `⭐ ${parseFloat(anime.score).toFixed(1)}` : 'Sem nota';
    const eps    = anime.episodes ? `${anime.episodes} eps` : 'N/A';
    const title  = anime.title_portuguese || anime.title_english || anime.title || '';

    item.innerHTML = `
      <img src="${thumb}" alt="${title}"
           onerror="this.style.background='#e0e0e0';this.src=''">
      <div style="flex:1;min-width:0">
        <div class="r-title">${title}</div>
        <div class="r-meta">${studio} · ${eps}</div>
        <div class="r-score">${score}</div>
      </div>
      <span style="color:#bbb;font-size:18px;flex-shrink:0">›</span>
    `;

    item.addEventListener('click', () => window.abrirDetalheAnime(anime));
    searchResults.appendChild(item);
  });
}

// ── Detalhe do resultado da busca ──
window.abrirDetalheAnime = function (anime) {
  window.sdAnimeData = anime;
  const title  = anime.title_portuguese || anime.title_english || anime.title || '';
  const capa   = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const studio = anime.studios?.[0]?.name || 'Estúdio desconhecido';
  const desc   = anime.synopsis
    ? anime.synopsis.replace('[Written by MAL Rewrite]', '').trim()
    : 'Sem descrição disponível.';
  const eps = anime.episodes || 0;

  document.getElementById('sdTitle').textContent  = title;
  document.getElementById('sdImage').src          = capa;
  document.getElementById('sdStudio').textContent = '🎬 ' + studio;
  document.getElementById('sdDesc').textContent   = desc;

  const sdTags  = document.getElementById('sdGenerosTags');
  const generos = anime.genres || [];
  if (generos.length > 0) {
    sdTags.innerHTML = window.renderizarTagsGenero(generos);
    sdTags.style.display = 'flex';
  } else {
    sdTags.innerHTML = '';
    sdTags.style.display = 'none';
  }

  document.getElementById('sdNota').value          = anime.score
    ? Math.min(10, parseFloat(anime.score)).toFixed(1)
    : '';
  document.getElementById('sdTotalEps').value      = eps || '';
  document.getElementById('sdAssistidosEps').value = '';
  document.getElementById('sdAssistidosEps').max   = eps || 99999;

  const btn = document.getElementById('sdAddBtn');
  btn.textContent = '+ Adicionar ao Organizador';
  btn.disabled    = false;
  btn.style.background = '';

  const sdDataEl = document.getElementById('sdDataAdicao');
  if (sdDataEl) sdDataEl.value = new Date().toISOString().slice(0, 10);

  searchDetailOverlay.style.display = 'flex';
};

document.getElementById('sdClose').addEventListener('click', () => {
  searchDetailOverlay.style.display = 'none';
  window.sdAnimeData = null;
});
searchDetailOverlay.addEventListener('click', e => {
  if (e.target === searchDetailOverlay) {
    searchDetailOverlay.style.display = 'none';
    window.sdAnimeData = null;
  }
});

// ── Tradução de sinopse ──
async function traduzirTexto(texto) {
  if (!texto) return null;
  try {
    const url  = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
    const res  = await fetch(url);
    const json = await res.json();
    return json[0].map(item => item[0]).join('');
  } catch (e) {
    console.warn('Tradução falhou, usando original:', e);
    return texto;
  }
}

// ── Adicionar da busca ──
document.getElementById('sdAddBtn').addEventListener('click', async () => {
  if (!window.sdAnimeData) return;
  const btn    = document.getElementById('sdAddBtn');
  const anime  = window.sdAnimeData;
  const nota   = document.getElementById('sdNota').value || '0';
  const status = document.getElementById('sdStatus').value;
  const titulo = anime.title_portuguese || anime.title_english || anime.title || '';
  const capa   = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const totalEps      = parseInt(document.getElementById('sdTotalEps').value) || 0;
  const assistidosEps = Math.min(
    parseInt(document.getElementById('sdAssistidosEps').value) || 0,
    totalEps || 99999
  );
  const ano    = anime.year || anime.aired?.prop?.from?.year || null;
  const studio = anime.studios?.[0]?.name || null;
  const sinopseOriginal = anime.synopsis
    ? anime.synopsis.replace('[Written by MAL Rewrite]', '').trim()
    : null;
  const generos = anime.genres ? anime.genres.map(g => g.name) : [];

  if (window.animes.find(a => a.nome === titulo)) {
    alert('Este anime já está na sua lista!');
    return;
  }

  btn.textContent = '⏳ Traduzindo...';
  btn.disabled    = true;
  const sinopse = await traduzirTexto(sinopseOriginal);

  const tipoApi  = anime.type || '';
  const isFilme  = tipoApi === 'Movie';
  const duracao  = isFilme ? (anime.duration ? parseInt(anime.duration) || 0 : 0) : 0;
  const sdDataVal = document.getElementById('sdDataAdicao')?.value;
  const dataCriacao = sdDataVal
    ? new Date(sdDataVal + 'T12:00:00').getTime()
    : Date.now();

  window.animes.push({
    id: Date.now(),
    dataCriacao,
    nome: titulo,
    nota: parseFloat(nota).toFixed(1),
    capa, status,
    observacao: '',
    totalEps, assistidosEps,
    ano, studio, sinopse, generos,
    tipo: isFilme ? 'filme' : 'anime',
    duracao,
  });

  window.salvarAnimes();
  window.renderizarAnimes();
  btn.textContent = '✅ Adicionado!';
  btn.style.background = '#4caf50';
  setTimeout(() => {
    searchDetailOverlay.style.display = 'none';
    window.sdAnimeData = null;
  }, 1200);
});
