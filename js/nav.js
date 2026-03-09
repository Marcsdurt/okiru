/* ══════════════════════════════════════
   NAV — OKIRU
   Sidebar, páginas, stats, bottom nav,
   sidebar collapse.
══════════════════════════════════════ */

const paginaPrincipal = document.getElementById('paginaPrincipal');
const paginaSettings  = document.getElementById('paginaSettings');
const paginaStats     = document.getElementById('paginaStats');
const btnAddFloat     = document.querySelector('.btn-add');

// ── Helpers de navegação ──
window.setSidebarActive = function (id) {
  document.querySelectorAll('.sidebar .icon').forEach(i => i.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
};

function esconderTodasPaginas() {
  paginaPrincipal.classList.add('esconder');
  paginaSettings.style.display = 'none';
  if (paginaStats) paginaStats.style.display = 'none';
  btnAddFloat.classList.add('esconder');
}

window.voltarHome = function () {
  esconderTodasPaginas();
  window.setSidebarActive('btnHome');
  paginaPrincipal.classList.remove('esconder');
  btnAddFloat.classList.remove('esconder');
};

document.getElementById('btnHome').addEventListener('click', window.voltarHome);
document.getElementById('btnVoltarSettings').addEventListener('click', window.voltarHome);

// ── Settings ──
document.getElementById('btnSettings').addEventListener('click', () => {
  esconderTodasPaginas();
  window.setSidebarActive('btnSettings');
  paginaSettings.style.display = 'flex';
  window.aplicarUsuario();
});

// ── Stats ──
document.getElementById('btnStats').addEventListener('click', () => {
  esconderTodasPaginas();
  window.setSidebarActive('btnStats');
  paginaStats.style.display = 'flex';
  renderizarStats();
});

function renderizarStats() {
  const agora    = new Date();
  const meses    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  document.getElementById('statsSubtitle').textContent = 'Resumo da sua jornada no Okiru';
  document.getElementById('statsMesNome').textContent  = meses[mesAtual] + ' ' + anoAtual;

  // ── Animes do mês ──
  const inicioMes    = new Date(anoAtual, mesAtual, 1).getTime();
  const animesDoMes  = window.animes.filter(a => (a.dataCriacao || a.id) >= inicioMes);
  const mesLista = document.getElementById('statsMesLista');
  if (animesDoMes.length === 0) {
    mesLista.innerHTML = "<p class='stats-empty'>Nenhum anime adicionado este mês ainda.</p>";
  } else {
    mesLista.innerHTML = animesDoMes.map(a => `
      <div class="stats-mes-item">
        <img src="${a.capa}" onerror="this.style.display='none'">
        <div class="stats-mes-info">
          <strong>${a.nome}</strong>
          <span>${a.status === 'assistindo' ? '▶ Assistindo'
                : a.status === 'assistidos' ? '✅ Assistido'
                : '🕐 Para assistir'}</span>
        </div>
        <span class="stats-mes-nota">⭐ ${a.nota}</span>
      </div>
    `).join('');
  }

  // ── Gêneros ──
  const generoCount = {};
  window.animes.forEach(a => {
    if (a.generos && Array.isArray(a.generos)) {
      a.generos.forEach(g => { generoCount[g] = (generoCount[g] || 0) + 1; });
    }
  });
  const generosEl      = document.getElementById('statsGeneros');
  const generosSorted  = Object.entries(generoCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (generosSorted.length === 0) {
    generosEl.innerHTML = "<p class='stats-empty'>Adicione animes pela busca para ver seus gêneros!</p>";
  } else {
    const maxCount = generosSorted[0][1];
    const cores    = ['#6c7ae0','#a78bfa','#34d399','#f59e0b','#f87171','#60a5fa','#fb923c'];
    generosEl.innerHTML = generosSorted.map(([g, count], i) => {
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div class="stats-genero-row">
          <span class="stats-genero-nome">${g}</span>
          <div class="stats-genero-bar-wrap">
            <div class="stats-genero-bar" style="width:${pct}%;background:${cores[i % cores.length]}"></div>
          </div>
          <span class="stats-genero-count">${count}</span>
        </div>
      `;
    }).join('');
  }

  // ── Preferência de duração ──
  const assistidos = window.animes.filter(a => a.status === 'assistidos' && a.totalEps > 0);
  const duracaoEl  = document.getElementById('statsDuracao');
  if (assistidos.length === 0) {
    duracaoEl.innerHTML = "<p class='stats-empty'>Termine alguns animes para ver sua preferência de duração!</p>";
  } else {
    const grupos = { curto: [], medio: [], longo: [], muito: [] };
    assistidos.forEach(a => {
      const eps = parseInt(a.totalEps);
      if (eps <= 13)       grupos.curto.push(a);
      else if (eps <= 26)  grupos.medio.push(a);
      else if (eps <= 52)  grupos.longo.push(a);
      else                 grupos.muito.push(a);
    });
    const maiorGrupo = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)[0];
    const labels = {
      curto: 'até 13 episódios', medio: 'entre 14 e 26 episódios',
      longo: 'entre 27 e 52 episódios', muito: 'mais de 52 episódios',
    };
    const emojis  = { curto: '😛', medio: '😎', longo: '🔥', muito: '🏆' };
    const exemplos = maiorGrupo[1].slice(0, 3).map(a => a.nome).join(', ');
    duracaoEl.innerHTML = `
      <div class="stats-duracao-icon">${emojis[maiorGrupo[0]]}</div>
      <p class="stats-duracao-texto">Parece que você gosta de animes com
        <strong>${labels[maiorGrupo[0]]}</strong></p>
      <p class="stats-duracao-exemplos">Tipo <em>${exemplos}</em></p>
    `;
  }

  // ── Tempo total ──
  let totalMinutos = 0;
  window.animes.forEach(a => { totalMinutos += (parseInt(a.assistidosEps) || 0) * 24; });

  const tempoEl = document.getElementById('statsTempo');
  const formatarTempo = min => {
    const dias    = Math.floor(min / (60 * 24));
    const horas   = Math.floor((min % (60 * 24)) / 60);
    const minutos = min % 60;
    if (dias > 0)  return `${dias} dia${dias > 1 ? 's' : ''}, ${horas}h e ${minutos}min`;
    if (horas > 0) return `${horas}h e ${minutos}min`;
    return `${minutos} minutos`;
  };

  const totalEps = window.animes.reduce((s, a) => s + (parseInt(a.assistidosEps) || 0), 0);
  tempoEl.innerHTML = totalMinutos === 0
    ? "<p class='stats-empty'>Registre episódios assistidos para calcular seu tempo!</p>"
    : `
      <div class="stats-tempo-icon">⏱️</div>
      <p class="stats-tempo-label">Tempo total assistindo animes desde que você entrou no Okiru</p>
      <p class="stats-tempo-valor">${formatarTempo(totalMinutos)}</p>
      <p class="stats-tempo-eps">Baseado em ${totalEps} episódios · ~24min cada</p>
    `;

  // ── Dados salvos ──
  const storageEl = document.getElementById('statsStorage');
  if (storageEl) {
    const keys = ['animes', 'usuario', 'okiru_tutorial_done'];
    let totalBytes = 0;
    const itens = [];
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const bytes = new Blob([val]).size;
        totalBytes += bytes;
        const labels = {
          animes: 'Lista de animes',
          usuario: 'Perfil do usuário',
          okiru_tutorial_done: 'Tutorial',
        };
        itens.push({ label: labels[key] || key, bytes });
      }
    });

    const formatBytes = b => {
      if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + ' MB';
      if (b >= 1024)        return (b / 1024).toFixed(1) + ' KB';
      return b + ' B';
    };

    const LIMIT = 5 * 1024 * 1024;
    const pct   = Math.min((totalBytes / LIMIT) * 100, 100).toFixed(1);
    const cores = ['#6c7ae0', '#a78bfa', '#34d399'];

    const barras = itens.map((item, i) => {
      const p = ((item.bytes / LIMIT) * 100).toFixed(2);
      return `
        <div class="stats-storage-row">
          <span class="stats-storage-label">${item.label}</span>
          <div class="stats-genero-bar-wrap">
            <div class="stats-genero-bar"
                 style="width:${Math.max(p, 0.5)}%;background:${cores[i % cores.length]}"></div>
          </div>
          <span class="stats-storage-size">${formatBytes(item.bytes)}</span>
        </div>
      `;
    }).join('');

    storageEl.innerHTML = `
      <div class="stats-storage-total">
        <span class="stats-storage-valor">${formatBytes(totalBytes)}</span>
        <span class="stats-storage-de">de ~5 MB disponíveis</span>
      </div>
      <div class="stats-storage-bar-total-wrap">
        <div class="stats-storage-bar-total" style="width:${pct}%"></div>
      </div>
      <p class="stats-storage-pct">${pct}% utilizado</p>
      <div class="stats-storage-itens">${barras}</div>
    `;
  }
}

// ── Sidebar collapse ──
(function () {
  const STORAGE_KEY = 'okiru_sidebar_collapsed';
  const btn = document.getElementById('sidebarToggleBtn');
  if (!btn) return;

  if (localStorage.getItem(STORAGE_KEY) === '1') {
    document.body.classList.add('sidebar-collapsed');
  }

  btn.addEventListener('click', () => {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem(STORAGE_KEY, isCollapsed ? '1' : '0');
  });
})();

// ── Bottom Nav ──
(function () {
  function setBottomNavActive(id) {
    document.querySelectorAll('#bottomNav .bn-item').forEach(i => i.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  const map = {
    bnHome:     'btnHome',
    bnSearch:   'btnSearch',
    bnStats:    'btnStats',
    bnSettings: 'btnSettings',
  };

  Object.entries(map).forEach(([bnId, sidebarId]) => {
    const bnEl      = document.getElementById(bnId);
    const sidebarEl = document.getElementById(sidebarId);
    if (!bnEl || !sidebarEl) return;

    bnEl.addEventListener('click', () => {
      sidebarEl.click();
      setBottomNavActive(bnId);
    });
  });

  // Sincroniza bottom nav quando setSidebarActive é chamado
  const origSetSidebarActive = window.setSidebarActive;
  window.setSidebarActive = function (id) {
    origSetSidebarActive(id);
    const reverseMap = {
      btnHome:     'bnHome',
      btnSearch:   'bnSearch',
      btnStats:    'bnStats',
      btnSettings: 'bnSettings',
    };
    const bnId = reverseMap[id];
    if (bnId) setBottomNavActive(bnId);
  };
})();
