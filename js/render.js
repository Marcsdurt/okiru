/* ══════════════════════════════════════
   RENDER — OKIRU
   Renderização da lista principal e
   drag-scroll nas listas horizontais.
══════════════════════════════════════ */

// ── Drag Scroll ──
window.ativarDragScroll = function (el) {
  let isDown = false, startX, scrollLeft, moved = false;

  el.addEventListener('mousedown', e => {
    isDown = true; moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    el.style.cursor = '';
    setTimeout(() => { moved = false; }, 10);
  });

  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.pageX - el.offsetLeft - startX;
    if (Math.abs(dx) > 5) {
      moved = true;
      e.preventDefault();
      el.scrollLeft = scrollLeft - dx * 1.2;
    }
  });

  el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = ''; });

  el._wasDragging = () => moved;
};

// ── Filtros de ordenação ──
window.atualizarIconesFiltro = function () {
  const mapa = {
    assistindo:   'filterAssistindo',
    assistidos:   'filterAssistidos',
    paraAssistir: 'filterPara',
  };
  Object.entries(mapa).forEach(([key, btnId]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.setAttribute('data-order', window.ordenacao[key]);
    btn.textContent = window.ordenacao[key] === 'recentes' ? '↓ Recentes' : '↑ Antigos';
  });
};

window.toggleOrdenacao = function (key) {
  window.ordenacao[key] = window.ordenacao[key] === 'recentes' ? 'antigos' : 'recentes';
  window.salvarOrdenacao();
  window.renderizarAnimes();
  const mapa = {
    assistindo:   'filterAssistindo',
    assistidos:   'filterAssistidos',
    paraAssistir: 'filterPara',
  };
  const btn = document.getElementById(mapa[key]);
  if (btn) {
    btn.classList.add('filter-btn-pulse');
    setTimeout(() => btn.classList.remove('filter-btn-pulse'), 300);
  }
};

document.getElementById('filterAssistindo').addEventListener('click', () => window.toggleOrdenacao('assistindo'));
document.getElementById('filterAssistidos').addEventListener('click', () => window.toggleOrdenacao('assistidos'));
document.getElementById('filterPara').addEventListener('click', () => window.toggleOrdenacao('paraAssistir'));

// ── Busca local ──
document.getElementById('buscaLocal').addEventListener('input', e => {
  window.termoBusca = e.target.value.trim().toLowerCase();
  document.getElementById('buscaLocalClear').style.display = window.termoBusca ? 'flex' : 'none';
  window.renderizarAnimes();
});

document.getElementById('buscaLocalClear').addEventListener('click', () => {
  window.termoBusca = '';
  document.getElementById('buscaLocal').value = '';
  document.getElementById('buscaLocalClear').style.display = 'none';
  document.getElementById('buscaLocal').focus();
  window.renderizarAnimes();
});

// ── Render principal ──
window.renderizarAnimes = function () {
  const listaEls = {
    assistindo:   document.getElementById('listaAssistindo'),
    assistidos:   document.getElementById('listaAssistidos'),
    paraAssistir: document.getElementById('listaPara'),
  };

  Object.values(listaEls).forEach(l => l.innerHTML = '');

  const counts = { assistindo: 0, assistidos: 0, paraAssistir: 0 };
  const grupos  = { assistindo: [], assistidos: [], paraAssistir: [] };

  window.animes.forEach(a => {
    if (window.termoBusca && !a.nome.toLowerCase().includes(window.termoBusca)) return;
    counts[a.status] = (counts[a.status] || 0) + 1;
    grupos[a.status].push(a);
  });

  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => {
      const dataA = a.dataCriacao || a.id;
      const dataB = b.dataCriacao || b.id;
      return window.ordenacao[key] === 'recentes' ? dataB - dataA : dataA - dataB;
    });
  });

  Object.entries(grupos).forEach(([key, lista]) => {
    const container = listaEls[key];

    if (lista.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'lista-empty';
      if (window.termoBusca) {
        empty.textContent = 'Nenhum resultado';
        empty.style.cursor = 'default';
      } else {
        empty.textContent = '+ Adicionar anime';
        empty.addEventListener('click', () => {
          document.getElementById('modal').style.display = 'flex';
        });
      }
      container.appendChild(empty);
    } else {
      lista.forEach(anime => {
        const card = document.createElement('div');
        card.classList.add('card');

        const totalEps     = parseInt(anime.totalEps) || 0;
        const assistidosEps = parseInt(anime.assistidosEps) || 0;
        const pct = totalEps > 0
          ? Math.min(100, Math.round((assistidosEps / totalEps) * 100))
          : 0;

        card.innerHTML = `
          <img src="${anime.capa}" alt="${anime.nome}"
               onerror="this.src='https://via.placeholder.com/130x185?text=?'">
          <div class="card-info">
            <div class="card-title">${anime.nome}</div>
            <span class="card-badge">⭐ ${anime.nota}</span>
            ${totalEps > 0 ? `
            <div class="eps-bar-wrap">
              <div class="eps-bar" style="width:${pct}%"></div>
            </div>
            <div class="eps-label">${assistidosEps}/${totalEps} eps</div>
            ` : ''}
          </div>
        `;

        card.addEventListener('click', () => {
          if (container._wasDragging && container._wasDragging()) return;
          window.abrirDetalhe(anime);
        });

        container.appendChild(card);
      });
    }

    window.ativarDragScroll(container);
  });

  document.getElementById('countAssistindo').textContent = counts.assistindo || 0;
  document.getElementById('countAssistidos').textContent = counts.assistidos || 0;
  document.getElementById('countPara').textContent       = counts.paraAssistir || 0;
  document.getElementById('statAssistindo').textContent  = counts.assistindo || 0;
  document.getElementById('statAssistidos').textContent  = counts.assistidos || 0;
  document.getElementById('statPara').textContent        = counts.paraAssistir || 0;

  window.atualizarIconesFiltro();
};

// Render inicial
window.renderizarAnimes();
