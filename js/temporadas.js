/* ══════════════════════════════════════
   TEMPORADAS — OKIRU  v2
   Adicione ao index.html:
     <link rel="stylesheet" href="temporadas.css">  → após badges.css no <head>
     <script src="temporadas.js"></script>           → após badges.js antes de </body>
══════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── HELPERS DE DADOS ─── */
  function lerAnimes() {
    try { return JSON.parse(localStorage.getItem('animes')) || []; } catch(e) { return []; }
  }
  function salvarAnimes(arr) { localStorage.setItem('animes', JSON.stringify(arr)); }
  function getAnimeById(id) { return lerAnimes().find(a => a.id === id) || null; }
  function getNumT(pai, filhoId) {
    const idx = (pai.temporadas || []).indexOf(filhoId);
    return idx === -1 ? '?' : idx + 2;
  }
  function labelStatus(s) {
    return { assistindo:'Assistindo', assistidos:'Assistido', paraAssistir:'Para assistir' }[s] || s;
  }

  /* ─── ASSOCIAR / DESASSOCIAR ─── */
  function associar(paiId, filhoId) {
    if (paiId === filhoId) return false;
    const arr = lerAnimes();
    const pai = arr.find(a => a.id === paiId);
    const filho = arr.find(a => a.id === filhoId);
    if (!pai || !filho) return false;
    if ((filho.temporadas || []).length > 0) return false;
    if (filho.temporadaDe && filho.temporadaDe !== paiId) return false;
    if (pai.temporadaDe) return false;
    pai.temporadas = pai.temporadas || [];
    if (!pai.temporadas.includes(filhoId)) pai.temporadas.push(filhoId);
    filho.temporadaDe = paiId;
    salvarAnimes(arr);
    return true;
  }

  function desassociar(paiId, filhoId) {
    const arr = lerAnimes();
    const pai = arr.find(a => a.id === paiId);
    const filho = arr.find(a => a.id === filhoId);
    if (!pai || !filho) return;
    pai.temporadas = (pai.temporadas || []).filter(id => id !== filhoId);
    if (pai.temporadas.length === 0) delete pai.temporadas;
    delete filho.temporadaDe;
    salvarAnimes(arr);
  }

  /* ─── TOAST ─── */
  let _tt;
  function toast(msg) {
    let t = document.getElementById('tempToast');
    if (!t) { t = document.createElement('div'); t.id = 'tempToast'; t.className = 'temp-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    clearTimeout(_tt);
    t.classList.remove('visible');
    void t.offsetWidth;
    t.classList.add('visible');
    _tt = setTimeout(() => t.classList.remove('visible'), 2600);
  }

  /* ─── DETECTAR ABERTURA DO MODAL via MutationObserver ───
     script.js chama abrirDetalhe() direto (não via window),
     então substituir window.abrirDetalhe não funciona.
     Em vez disso, observamos quando #modalDetalhe fica visível
     e lemos o anime atual pelo nome exibido no modal.
  ─── */
  (function() {
    const modalEl = document.getElementById('modalDetalhe');
    if (!modalEl) return;

    let _estaAberto = false;

    const obs = new MutationObserver(() => {
      const aberto = modalEl.style.display === 'flex';
      if (aberto && !_estaAberto) {
        _estaAberto = true;
        // Modal acabou de abrir — lê anime atual pelo nome no header
        requestAnimationFrame(() => _aoAbrirModal());
      } else if (!aberto && _estaAberto) {
        _estaAberto = false;
        removerSecao();
      }
    });
    obs.observe(modalEl, { attributes: true, attributeFilter: ['style'] });
  })();

  function _aoAbrirModal() {
    const nomeEl = document.getElementById('detalheNome');
    if (!nomeEl) return;
    const nome = nomeEl.textContent.trim().toLowerCase();
    const arr = lerAnimes();
    const anime = arr.find(a => a.nome.trim().toLowerCase() === nome);
    if (anime) renderSecao(anime);
  }

  /* ─── HOOK EM window.renderizarAnimes ───
     Intercepta a função de render para filtrar temporadas-filho
     antes que os cards sejam criados. Isso garante que as listas
     e contadores nunca incluam animes vinculados como temporada.
  ─── */
  (function hookRender() {
    // Aguarda window.renderizarAnimes estar disponível (definido em render.js)
    if (typeof window.renderizarAnimes !== 'function') {
      setTimeout(hookRender, 50);
      return;
    }

    const _orig = window.renderizarAnimes;

    window.renderizarAnimes = function () {
      // Filtra temporariamente os filhos do array global
      const filhosIds = new Set(
        (window.animes || [])
          .filter(a => a.temporadaDe)
          .map(a => a.id)
      );

      if (filhosIds.size === 0) {
        _orig.apply(this, arguments);
        return;
      }

      // Esconde os filhos do array global durante o render
      const todosAnimes = window.animes;
      window.animes = todosAnimes.filter(a => !filhosIds.has(a.id));

      _orig.apply(this, arguments);

      // Restaura o array completo
      window.animes = todosAnimes;
    };
  })();

  /* ─── RENDER DA SEÇÃO ─── */
  let _sec = null;

  function removerSecao() { if (_sec) { _sec.remove(); _sec = null; } }

  function renderSecao(anime) {
    removerSecao();
    const body = document.querySelector('.detalhe-body');
    if (!body) return;

    const obs = body.querySelector('.detalhe-obs-wrap');
    _sec = document.createElement('div');
    _sec.className = 'temp-section';

    // Lê dados frescos do localStorage
    const arr = lerAnimes();
    const animeAtual = arr.find(a => a.id === anime.id) || anime;

    /* ── Caso: é filho de outro anime ── */
    if (animeAtual.temporadaDe) {
      const pai = getAnimeById(animeAtual.temporadaDe);
      const numT = pai ? getNumT(pai, animeAtual.id) : '?';
      _sec.innerHTML = `
        <div class="temp-header open" id="tempHeader">
          <div class="temp-header-left">
            <div class="temp-header-icon">${_svgFilme()}</div>
            <div class="temp-header-text">
              <span class="temp-header-title">Temporadas</span>
              <span class="temp-header-sub">Vinculado como temporada</span>
            </div>
          </div>
          ${_svgChevron()}
        </div>
        <div class="temp-body open" id="tempBody">
          <div class="temp-body-inner">
            <div class="temp-vinculado-aviso">
              ${_svgInfo()}
              ${pai ? `Este anime é a <strong>T${numT}</strong> de <strong>${pai.nome}</strong>` : 'Vinculado como temporada de outro anime'}
            </div>
          </div>
        </div>`;
      _inserir(body, obs);
      _hookChevron();
      return;
    }

    /* ── Caso: anime livre ou pai ── */
    const ids = animeAtual.temporadas || [];
    const badge = ids.length > 0 ? `<span class="temp-header-badge">${ids.length}</span>` : '';
    const subTxt = ids.length > 0 ? `${ids.length} temporada(s) associada(s)` : 'Associar outras temporadas';

    _sec.innerHTML = `
      <div class="temp-header" id="tempHeader">
        <div class="temp-header-left">
          <div class="temp-header-icon">${_svgFilme()}</div>
          <div class="temp-header-text">
            <span class="temp-header-title">Temporadas${badge}</span>
            <span class="temp-header-sub" id="tempHeaderSub">${subTxt}</span>
          </div>
        </div>
        ${_svgChevron()}
      </div>
      <div class="temp-body" id="tempBody">
        <div class="temp-body-inner">
          <div class="temp-search-wrap">
            <button class="temp-search-toggle" id="tempSearchToggle" title="Buscar anime">
              ${_svgLupa()}
            </button>
            <div class="temp-search-input-wrap" id="tempSearchInputWrap">
              <input type="text" id="tempSearchInput" class="temp-search-input"
                placeholder="Buscar na sua lista..." autocomplete="off" spellcheck="false">
            </div>
            <button class="temp-search-clear" id="tempSearchClear">✕</button>
          </div>
          <div class="temp-search-results" id="tempSearchResults"></div>
          <div id="tempLista"></div>
        </div>
      </div>`;

    _inserir(body, obs);
    _hookChevron();
    _hookBusca(animeAtual);
    renderLista(animeAtual);
  }

  function _inserir(body, obs) {
    if (obs) body.insertBefore(_sec, obs); else body.appendChild(_sec);
  }

  function _hookChevron() {
    const h = document.getElementById('tempHeader');
    const b = document.getElementById('tempBody');
    if (!h || !b) return;
    h.addEventListener('click', () => { const o = b.classList.toggle('open'); h.classList.toggle('open', o); });
  }

  /* ─── BUSCA ─── */
  function _hookBusca(animeRef) {
    // Sempre busca os elementos frescos do DOM (podem ter sido recriados)
    const toggle    = document.getElementById('tempSearchToggle');
    const inputWrap = document.getElementById('tempSearchInputWrap');
    const input     = document.getElementById('tempSearchInput');
    const clear     = document.getElementById('tempSearchClear');
    const results   = document.getElementById('tempSearchResults');
    if (!toggle) return;

    // Guarda o id — nunca o objeto inteiro (evita stale reference)
    const animeId = animeRef.id;

    // Usa AbortController para remover listeners antigos ao recriar
    // (evita acúmulo de listeners se _hookBusca for chamado mais de uma vez)
    const ac = new AbortController();
    const sig = { signal: ac.signal };

    // Armazena o controller no elemento para cancelar na próxima chamada
    if (toggle._buscaAbort) toggle._buscaAbort.abort();
    toggle._buscaAbort = ac;

    let expandido = inputWrap.classList.contains('expanded');

    toggle.addEventListener('click', () => {
      expandido = !expandido;
      inputWrap.classList.toggle('expanded', expandido);
      if (expandido) {
        setTimeout(() => input.focus(), 160);
      } else {
        input.value = '';
        clear.classList.remove('visible');
        results.innerHTML = '';
      }
    }, sig);

    clear.addEventListener('click', () => {
      input.value = '';
      clear.classList.remove('visible');
      results.innerHTML = '';
      input.focus();
    }, sig);

    input.addEventListener('input', () => {
      const t = input.value.trim().toLowerCase();
      clear.classList.toggle('visible', t.length > 0);
      // Lê o anime fresco do localStorage a cada busca
      const animeAtualizado = lerAnimes().find(a => a.id === animeId) || animeRef;
      mostrarResultados(t, animeAtualizado, results);
    }, sig);
  }

  function mostrarResultados(termo, animeRef, resultsEl) {
    resultsEl.innerHTML = '';
    if (!termo) return;

    const arr = lerAnimes();
    const atual = arr.find(a => a.id === animeRef.id) || animeRef;
    const assocIds = atual.temporadas || [];

    const candidatos = arr.filter(a =>
      a.id !== atual.id &&
      !assocIds.includes(a.id) &&
      !(a.temporadaDe && a.temporadaDe !== atual.id) &&
      !(a.temporadas || []).length &&
      a.nome.toLowerCase().includes(termo)
    );

    if (!candidatos.length) {
      resultsEl.innerHTML = `<div class="temp-no-results">Nenhum anime encontrado</div>`; return;
    }

    candidatos.slice(0, 8).forEach(a => {
      const eps = parseInt(a.totalEps) || 0;
      const item = document.createElement('div');
      item.className = 'temp-result-item';
      item.innerHTML = `
        <img class="temp-result-img" src="${a.capa}" alt="${a.nome}" onerror="this.src='https://via.placeholder.com/32x46?text=?'">
        <div class="temp-result-info">
          <div class="temp-result-nome">${a.nome}</div>
          <div class="temp-result-status">${labelStatus(a.status)}${eps > 0 ? ' · ' + eps + ' ep.' : ''}</div>
        </div>
        <button class="temp-result-add">+</button>`;

      item.querySelector('.temp-result-add').addEventListener('click', e => {
        e.stopPropagation();
        const ok = associar(atual.id, a.id);
        if (ok) {
          const novoArr = lerAnimes();
          const novoAtual = novoArr.find(x => x.id === atual.id) || atual;
          toast(`✅ "${a.nome}" associado como T${getNumT(novoAtual, a.id)}`);

          // Limpa busca
          const inp = document.getElementById('tempSearchInput');
          const clr = document.getElementById('tempSearchClear');
          const res = document.getElementById('tempSearchResults');
          if (inp) inp.value = '';
          if (clr) clr.classList.remove('visible');
          if (res) res.innerHTML = '';

          // Atualiza sub-header
          const sub = document.getElementById('tempHeaderSub');
          const tot = (novoAtual.temporadas || []).length;
          if (sub) sub.textContent = tot > 0 ? `${tot} temporada(s) associada(s)` : 'Associar outras temporadas';

          renderLista(novoAtual);
          // Re-ativa o hook de busca com o anime atualizado (DOM pode ter mudado)
          _hookBusca(novoAtual);
          if (typeof window.renderizarAnimes === 'function') window.renderizarAnimes();
        } else {
          toast('⚠️ Não foi possível associar este anime');
        }
      });

      resultsEl.appendChild(item);
    });
  }

  /* ─── LISTA DE TEMPORADAS ─── */
  function renderLista(animeAtual) {
    const el = document.getElementById('tempLista');
    if (!el) return;
    el.innerHTML = '';
    const ids = animeAtual.temporadas || [];
    if (!ids.length) return;

    const label = document.createElement('div');
    label.className = 'temp-label-section';
    label.textContent = 'Temporadas associadas';
    el.appendChild(label);

    const lista = document.createElement('div');
    lista.className = 'temp-lista';
    lista.appendChild(_itemTemporada(animeAtual, 1, null));
    ids.forEach((id, idx) => {
      const filho = getAnimeById(id);
      if (filho) lista.appendChild(_itemTemporada(filho, idx + 2, animeAtual.id));
    });
    el.appendChild(lista);
  }

  function _itemTemporada(anime, numero, paiId) {
    const item = document.createElement('div');
    item.className = 'temp-item' + (numero === 1 ? ' temp-item--pai' : '');
    const eps = parseInt(anime.totalEps) || 0;
    const ass = parseInt(anime.assistidosEps) || 0;
    item.innerHTML = `
      <div class="temp-item-numero">T${numero}</div>
      <img class="temp-item-img" src="${anime.capa}" alt="${anime.nome}" onerror="this.src='https://via.placeholder.com/28x40?text=?'">
      <div class="temp-item-info">
        <div class="temp-item-nome">${anime.nome}</div>
        <div class="temp-item-meta">
          <span class="temp-item-status">${labelStatus(anime.status)}</span>
          ${eps > 0 ? `<span class="temp-item-eps">· ${ass}/${eps} ep.</span>` : ''}
        </div>
      </div>
      ${numero > 1 ? `<button class="temp-item-remove">✕</button>` : ''}`;

    if (numero > 1) {
      item.querySelector('.temp-item-remove').addEventListener('click', () => {
        desassociar(paiId, anime.id);
        toast(`↩️ "${anime.nome}" desassociado`);
        const pai = getAnimeById(paiId);
        if (pai) {
          renderLista(pai);
          const sub = document.getElementById('tempHeaderSub');
          const tot = (pai.temporadas || []).length;
          if (sub) sub.textContent = tot > 0 ? `${tot} temporada(s) associada(s)` : 'Associar outras temporadas';
        }
        if (typeof window.renderizarAnimes === 'function') window.renderizarAnimes();
      });
    }
    return item;
  }

  /* ─── FECHAR MODAL ─── */
  // Gerenciado pelo MutationObserver do #modalDetalhe acima

  /* ─── SVG helpers ─── */
  function _svgFilme() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/></svg>`;
  }
  function _svgChevron() {
    return `<svg class="temp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`;
  }
  function _svgLupa() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  }
  function _svgInfo() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }

  /* ─── API PÚBLICA ─── */
  window.Temporadas = { associar, desassociar };

})();
