/* ══════════════════════════════════════
   PRÓXIMAS TEMPORADAS — OKIRU
   Verifica sequels via API Jikan.
══════════════════════════════════════ */

const PROXIMAS_CACHE_KEY = 'okiru_proximas_cache';
const PROXIMAS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const JIKAN_DELAY        = 420; // ms entre requisições

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function formatarDataEstreia(aired) {
  if (!aired?.from) return null;
  try {
    const d = new Date(aired.from);
    if (isNaN(d)) return null;
    const diffMs = d - Date.now();
    if (diffMs < -90 * 24 * 60 * 60 * 1000) return null;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return null; }
}

async function buscarIdMal(nome) {
  try {
    const url  = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(nome)}&limit=1&sfw`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.mal_id || null;
  } catch { return null; }
}

async function buscarRelacoes(malId) {
  try {
    const url  = `https://api.jikan.moe/v4/anime/${malId}/relations`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    const sequels = [];
    for (const rel of (json.data || [])) {
      if (rel.relation === 'Sequel') {
        for (const entry of (rel.entry || [])) {
          if (entry.type === 'anime') sequels.push(entry.mal_id);
        }
      }
    }
    return sequels;
  } catch { return []; }
}

async function buscarDetalhesAnime(malId) {
  try {
    const url  = `https://api.jikan.moe/v4/anime/${malId}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

function statusRelevante(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('airing') || s.includes('not yet aired') || s.includes('upcoming');
}

function renderProximasCards(dados) {
  return dados.map((item, idx) => `
    <a class="proximas-card" href="${item.malUrl}" target="_blank" rel="noopener"
       style="animation-delay:${idx * 0.06}s">
      <img class="proximas-card-capa" src="${item.sequelCapa}"
           alt="${item.sequelNome}"
           onerror="this.src='${item.capaPrincipal}'">
      <div class="proximas-card-info">
        <div class="proximas-card-original">Sequel de: ${item.animeOriginal}</div>
        <div class="proximas-card-nome">${item.sequelNome}</div>
        <div class="proximas-card-tags">
          ${item.isAiring
            ? `<span class="proximas-pill proximas-pill-airing">● Disponível agora</span>`
            : `<span class="proximas-pill proximas-pill-upcoming">⏳ Em breve</span>`}
          ${item.data
            ? `<span class="proximas-pill proximas-pill-date">📅 ${item.data}</span>`
            : ''}
        </div>
      </div>
      <span class="proximas-card-arrow">›</span>
    </a>
  `).join('');
}

async function verificarProximasTemporadas() {
  if (window.animes.length === 0) {
    window.mostrarToast('Adicione animes à sua lista primeiro!');
    return;
  }

  const btn        = document.getElementById('proximasVerificarBtn');
  const loading    = document.getElementById('proximasLoading');
  const fill       = document.getElementById('proximasLoadingFill');
  const texto      = document.getElementById('proximasLoadingTexto');
  const resultados = document.getElementById('proximasResultados');
  const vazio      = document.getElementById('proximasVazio');
  const footer     = document.getElementById('proximasFooter');
  const footerInfo = document.getElementById('proximasCacheInfo');

  btn.disabled = true;
  btn.textContent = 'Verificando…';
  loading.style.display    = 'block';
  resultados.style.display = 'none';
  vazio.style.display      = 'none';
  footer.style.display     = 'none';
  fill.style.width         = '0%';

  const encontrados = [];
  const alvo = window.animes.filter(a => a.status === 'assistindo' || a.status === 'assistidos');
  const total = alvo.length;

  for (let i = 0; i < total; i++) {
    const anime = alvo[i];
    const pct   = Math.round(((i + 1) / total) * 100);
    fill.style.width  = pct + '%';
    texto.textContent = `Verificando "${anime.nome.length > 28 ? anime.nome.slice(0, 28) + '…' : anime.nome}" (${i + 1}/${total})`;

    try {
      const malId = await buscarIdMal(anime.nome);
      await sleep(JIKAN_DELAY);
      if (!malId) continue;

      const sequelIds = await buscarRelacoes(malId);
      await sleep(JIKAN_DELAY);
      if (sequelIds.length === 0) continue;

      for (const sId of sequelIds) {
        const detalhe = await buscarDetalhesAnime(sId);
        await sleep(JIKAN_DELAY);
        if (!detalhe) continue;

        if (statusRelevante(detalhe.status)) {
          const dataStr  = formatarDataEstreia(detalhe.aired);
          const isAiring = detalhe.status?.toLowerCase().includes('airing') &&
                           !detalhe.status?.toLowerCase().includes('not yet');
          encontrados.push({
            animeOriginal: anime.nome,
            capaPrincipal: anime.capa,
            sequelNome:    detalhe.title_portuguese || detalhe.title_english || detalhe.title,
            sequelCapa:    detalhe.images?.jpg?.image_url || anime.capa,
            status:        detalhe.status,
            isAiring,
            data:          dataStr,
            malUrl:        `https://myanimelist.net/anime/${sId}`,
          });
        }
      }
    } catch (_) { /* ignora erros individuais */ }
  }

  loading.style.display = 'none';
  btn.disabled          = false;
  btn.textContent       = 'Verificar';

  if (encontrados.length > 0) {
    resultados.innerHTML = renderProximasCards(encontrados);
    resultados.style.display = 'flex';
    localStorage.setItem(PROXIMAS_CACHE_KEY, JSON.stringify({ ts: Date.now(), dados: encontrados }));
  } else {
    vazio.style.display = 'flex';
  }

  const labelTotal = `${total} anime${total !== 1 ? 's' : ''} verificado${total !== 1 ? 's' : ''}`;
  footerInfo.textContent = `Atualizado agora • ${labelTotal}`;
  footer.style.display   = 'flex';
}

function carregarCacheProximas() {
  const fechado = localStorage.getItem('okiru_proximas_fechado') === '1';
  if (fechado) {
    document.getElementById('proximasCorpo').classList.add('proximas-corpo-fechado');
    const btn = document.getElementById('proximasFecharBtn');
    btn.textContent = '＋';
    btn.title       = 'Expandir';
  }

  try {
    const raw = localStorage.getItem(PROXIMAS_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (!cache?.dados || !cache?.ts) return;

    const idadeMs  = Date.now() - cache.ts;
    const idadeHrs = Math.floor(idadeMs / (1000 * 60 * 60));
    const expirado = idadeMs > PROXIMAS_CACHE_TTL;

    const resultados = document.getElementById('proximasResultados');
    const footer     = document.getElementById('proximasFooter');
    const footerInfo = document.getElementById('proximasCacheInfo');
    const vazio      = document.getElementById('proximasVazio');

    if (cache.dados.length === 0) {
      if (!expirado) {
        vazio.style.display  = 'flex';
        footer.style.display = 'flex';
        footerInfo.textContent = `Cache de ${idadeHrs}h atrás`;
      }
      return;
    }

    resultados.innerHTML     = renderProximasCards(cache.dados);
    resultados.style.display = 'flex';
    footer.style.display     = 'flex';
    const labelTempo = idadeHrs < 1 ? 'menos de 1h atrás' : `${idadeHrs}h atrás`;
    footerInfo.textContent   = `Cache de ${labelTempo}${expirado ? ' (desatualizado)' : ''}`;
  } catch (_) { /* cache corrompido */ }
}

// ── Eventos ──
document.getElementById('proximasFecharBtn').addEventListener('click', () => {
  const corpo   = document.getElementById('proximasCorpo');
  const btn     = document.getElementById('proximasFecharBtn');
  const fechado = corpo.classList.toggle('proximas-corpo-fechado');
  btn.textContent = fechado ? '＋' : '✕';
  btn.title       = fechado ? 'Expandir' : 'Recolher';
  localStorage.setItem('okiru_proximas_fechado', fechado ? '1' : '0');
});

document.getElementById('proximasVerificarBtn').addEventListener('click', verificarProximasTemporadas);

document.getElementById('proximasAtualizarBtn').addEventListener('click', () => {
  localStorage.removeItem(PROXIMAS_CACHE_KEY);
  document.getElementById('proximasResultados').style.display = 'none';
  document.getElementById('proximasVazio').style.display      = 'none';
  document.getElementById('proximasFooter').style.display     = 'none';
  verificarProximasTemporadas();
});

carregarCacheProximas();
