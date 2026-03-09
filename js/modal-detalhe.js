/* ══════════════════════════════════════
   MODAL DETALHE — OKIRU
   abrirDetalhe, episódios, editar, deletar,
   mover entre listas.
══════════════════════════════════════ */

const modalDetalhe = document.getElementById('modalDetalhe');

// ── Abrir detalhe ──
window.abrirDetalhe = function (anime) {
  window.animeAtual = anime;
  document.querySelector('.edit-fields-group')?.remove();
  window.editMode = false;

  document.getElementById('detalheCapa').src            = anime.capa;
  document.getElementById('detalheNome').textContent    = anime.nome;
  document.getElementById('detalheNota').textContent    = anime.nota ? '⭐ ' + anime.nota + ' / 10' : '';
  document.getElementById('detalheObs').value           = anime.observacao || '';
  document.getElementById('moverParaLista').value       = anime.status;
  document.getElementById('detalheFilmeBadge').style.display =
    anime.tipo === 'filme' ? 'inline-flex' : 'none';

  const tagsEl = document.getElementById('detalheGenerosTags');
  if (anime.generos && anime.generos.length > 0) {
    tagsEl.innerHTML = window.renderizarTagsGenero(anime.generos);
    tagsEl.style.display = 'flex';
  } else {
    tagsEl.innerHTML = '';
    tagsEl.style.display = 'none';
  }

  document.getElementById('dtMenuDropdown').classList.remove('open');
  document.getElementById('dtMenuBtn').classList.remove('active');
  document.getElementById('obsAutosaveStatus').textContent = '';
  document.getElementById('obsAutosaveStatus').classList.remove('visible');

  window.renderEpisodiosDetalhe(anime);
  modalDetalhe.style.display = 'flex';
};

// ── Episódios ──
window.renderEpisodiosDetalhe = function (anime) {
  const wrap = document.getElementById('detalheEpisodios');
  if (anime.tipo === 'filme') { wrap.innerHTML = ''; return; }

  const total      = parseInt(anime.totalEps) || 0;
  const assistidos = parseInt(anime.assistidosEps) || 0;
  const pct        = total > 0 ? Math.min(100, Math.round((assistidos / total) * 100)) : 0;
  const isDone     = total > 0 && assistidos >= total;
  const countLabel = total > 0
    ? `${assistidos} / ${total} ep.`
    : assistidos > 0 ? `${assistidos} ep.` : '—';

  wrap.innerHTML = `
    <div class="eps-block">
      <div class="eps-header">
        <span class="eps-label">Progresso</span>
        <span class="eps-count ${isDone ? 'eps-count--done' : ''}">${countLabel}</span>
      </div>
      ${total > 0 ? `
      <div class="eps-bar-wrap">
        <div class="eps-bar ${isDone ? 'eps-bar--done' : ''}" style="width:${pct}%"></div>
      </div>` : ''}
      <div class="eps-stepper-row">
        <button class="eps-step-btn" id="epsDecBtn" ${assistidos <= 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div class="eps-stepper-center">
          <input type="number" id="detalheAssistidosEps" class="eps-num-input"
                 value="${assistidos}" min="0" max="${total || 99999}" placeholder="0">
          <span class="eps-stepper-sep">/ </span>
          <input type="number" id="detalheTotalEps" class="eps-num-input eps-total-input"
                 value="${total || ''}" min="0" placeholder="?">
          <span class="eps-stepper-unit">ep.</span>
        </div>
        <button class="eps-step-btn" id="epsIncBtn"
                ${total > 0 && assistidos >= total ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('detalheTotalEps').addEventListener('change', window.salvarEpisodios);
  document.getElementById('detalheAssistidosEps').addEventListener('change', window.salvarEpisodios);
  document.getElementById('detalheAssistidosEps').addEventListener('input',  window.salvarEpisodios);

  document.getElementById('epsIncBtn').addEventListener('click', () => {
    const el  = document.getElementById('detalheAssistidosEps');
    const max = parseInt(document.getElementById('detalheTotalEps').value) || 99999;
    const cur = parseInt(el.value) || 0;
    if (cur < max) { el.value = cur + 1; window.salvarEpisodios(); }
  });

  document.getElementById('epsDecBtn').addEventListener('click', () => {
    const el  = document.getElementById('detalheAssistidosEps');
    const cur = parseInt(el.value) || 0;
    if (cur > 0) { el.value = cur - 1; window.salvarEpisodios(); }
  });
};

window.salvarEpisodios = function () {
  if (!window.animeAtual) return;
  const total      = parseInt(document.getElementById('detalheTotalEps').value) || 0;
  const assistidos = Math.min(
    parseInt(document.getElementById('detalheAssistidosEps').value) || 0,
    total || 99999
  );
  window.animeAtual.totalEps      = total;
  window.animeAtual.assistidosEps = assistidos;
  window.salvarAnimes();
  window.renderEpisodiosDetalhe(window.animeAtual);
  window.renderizarAnimes();
};

// ── Menu ⋯ ──
document.getElementById('dtMenuBtn').addEventListener('click', e => {
  e.stopPropagation();
  const dd  = document.getElementById('dtMenuDropdown');
  const btn = document.getElementById('dtMenuBtn');
  const isOpen = dd.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
});

document.addEventListener('click', e => {
  const dd  = document.getElementById('dtMenuDropdown');
  const btn = document.getElementById('dtMenuBtn');
  if (!dd.contains(e.target) && e.target !== btn) {
    dd.classList.remove('open');
    btn.classList.remove('active');
  }
});

// ── Fechar modal ──
document.getElementById('fecharDetalhe').addEventListener('click', () => {
  if (window.editMode) {
    document.querySelector('.edit-fields-group')?.remove();
    if (window.animeAtual) {
      document.getElementById('detalheNome').textContent = window.animeAtual.nome;
      document.getElementById('detalheNota').textContent =
        window.animeAtual.nota ? '⭐ ' + window.animeAtual.nota + ' / 10' : '';
    }
    window.editMode = false;
  }
  document.getElementById('dtMenuDropdown').classList.remove('open');
  document.getElementById('dtMenuBtn').classList.remove('active');
  modalDetalhe.style.display = 'none';
});

// ── Mover entre listas ──
document.getElementById('moverParaLista').addEventListener('change', e => {
  if (!window.animeAtual) return;
  window.animeAtual.status = e.target.value;
  window.salvarAnimes();
  window.renderizarAnimes();
  const sel = e.target;
  sel.style.color = '#34d399';
  setTimeout(() => sel.style.color = '', 900);
});

// ── Anotação com autosave ──
let obsAutosaveTimer = null;
document.getElementById('detalheObs').addEventListener('input', () => {
  if (!window.animeAtual) return;
  window.animeAtual.observacao = document.getElementById('detalheObs').value;
  window.salvarAnimes();
  const badge = document.getElementById('obsAutosaveStatus');
  badge.textContent = '✓ salvo';
  badge.classList.add('visible');
  clearTimeout(obsAutosaveTimer);
  obsAutosaveTimer = setTimeout(() => badge.classList.remove('visible'), 2000);
});

// ── Excluir ──
document.getElementById('deleteBtn').addEventListener('click', () => {
  if (!window.animeAtual) return;
  document.getElementById('dtMenuDropdown').classList.remove('open');
  document.getElementById('dtMenuBtn').classList.remove('active');
  document.getElementById('dtConfirmDesc').textContent =
    `"${window.animeAtual.nome}" será removido permanentemente da sua lista.`;
  document.getElementById('dtConfirmOverlay').classList.add('open');
});

document.getElementById('dtConfirmCancel').addEventListener('click', () => {
  document.getElementById('dtConfirmOverlay').classList.remove('open');
});

document.getElementById('dtConfirmOk').addEventListener('click', () => {
  if (!window.animeAtual) return;
  window.animes = window.animes.filter(a => a.id !== window.animeAtual.id);
  window.salvarAnimes();
  window.renderizarAnimes();
  document.getElementById('dtConfirmOverlay').classList.remove('open');
  modalDetalhe.style.display = 'none';
  window.animeAtual = null;
});

// ── Modal de edição completa ──
(function () {
  const overlay         = document.getElementById('editModalOverlay');
  const closeBtn        = document.getElementById('editCloseBtn');
  const saveBtn         = document.getElementById('editSaveBtn');
  const nomeInput       = document.getElementById('editNomeInput');
  const notaInput       = document.getElementById('editNotaInput');
  const capaInput       = document.getElementById('editCapaInput');
  const capaFile        = document.getElementById('editCapaFile');
  const capaUploadBtn   = document.getElementById('editCapaUploadBtn');
  const capaThumb       = document.getElementById('editCapaThumb');
  const capaHint        = document.getElementById('editCapaHint');
  const dataInput       = document.getElementById('editDataInput');
  const assistidosInput = document.getElementById('editAssistidosInput');
  const totalInput      = document.getElementById('editTotalInput');
  const obsInput        = document.getElementById('editObsInput');
  const heroBg          = document.getElementById('editHeroBg');
  const tagsPreview     = document.getElementById('editTagsPreview');
  const progressFill    = document.getElementById('editProgressFill');
  const progressoSection = document.getElementById('editProgressoSection');

  function atualizarBarra() {
    const assistidos = parseInt(assistidosInput.value) || 0;
    const total      = parseInt(totalInput.value) || 0;
    const pct = total > 0 ? Math.min(100, Math.round(assistidos / total * 100)) : 0;
    progressFill.style.width = pct + '%';
  }

  assistidosInput.addEventListener('input', atualizarBarra);
  totalInput.addEventListener('input', atualizarBarra);

  capaUploadBtn.addEventListener('click', () => capaFile.click());
  document.getElementById('editCapaThumbWrap').addEventListener('click', () => capaFile.click());

  capaFile.addEventListener('change', () => {
    const file = capaFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      capaInput.value = dataUrl;
      heroBg.src      = dataUrl;
      capaThumb.src   = dataUrl;
      capaHint.textContent = file.name.length > 22 ? file.name.slice(0, 20) + '…' : file.name;
      capaHint.classList.add('has-file');
      saveBtn.classList.add('changed');
    };
    reader.readAsDataURL(file);
  });

  function abrirEditModal() {
    if (!window.animeAtual) return;
    document.getElementById('dtMenuDropdown').classList.remove('open');
    document.getElementById('dtMenuBtn').classList.remove('active');

    nomeInput.value  = window.animeAtual.nome || '';
    notaInput.value  = window.animeAtual.nota || '';
    capaInput.value  = window.animeAtual.capa || '';
    heroBg.src       = window.animeAtual.capa || '';
    capaThumb.src    = window.animeAtual.capa || '';
    capaHint.textContent = 'JPG, PNG, WEBP';
    capaHint.classList.remove('has-file');
    capaFile.value   = '';

    const dataAtual = window.animeAtual.dataCriacao
      ? new Date(window.animeAtual.dataCriacao).toISOString().slice(0, 10)
      : new Date(window.animeAtual.id).toISOString().slice(0, 10);
    dataInput.value = dataAtual;

    const isFilme = window.animeAtual.tipo === 'filme';
    progressoSection.style.display = isFilme ? 'none' : '';
    assistidosInput.value = window.animeAtual.assistidosEps || 0;
    totalInput.value      = window.animeAtual.totalEps || '';
    atualizarBarra();

    obsInput.value = window.animeAtual.observacao || '';

    tagsPreview.innerHTML = '';
    if (window.animeAtual.generos && window.animeAtual.generos.length) {
      window.animeAtual.generos.slice(0, 3).forEach(g => {
        const t = document.createElement('span');
        t.className   = 'edit-tag';
        t.textContent = g;
        tagsPreview.appendChild(t);
      });
    }

    saveBtn.classList.remove('changed');
    [nomeInput, notaInput, dataInput, assistidosInput, totalInput, obsInput].forEach(el => {
      el.addEventListener('input', () => saveBtn.classList.add('changed'));
    });

    overlay.classList.add('open');
    requestAnimationFrame(() => nomeInput.focus());
  }

  function fecharEditModal() {
    overlay.classList.remove('open');
  }

  function salvarEdicaoModal() {
    if (!window.animeAtual) return;
    if (nomeInput.value.trim())       window.animeAtual.nome = nomeInput.value.trim();
    if (notaInput.value !== '')       window.animeAtual.nota = notaInput.value;
    if (capaInput.value.trim())       window.animeAtual.capa = capaInput.value.trim();
    if (dataInput.value)              window.animeAtual.dataCriacao =
      new Date(dataInput.value + 'T12:00:00').getTime();
    if (assistidosInput.value !== '') window.animeAtual.assistidosEps =
      parseInt(assistidosInput.value) || 0;
    if (totalInput.value !== '')      window.animeAtual.totalEps =
      parseInt(totalInput.value) || 0;
    window.animeAtual.observacao = obsInput.value;

    window.salvarAnimes();

    document.getElementById('detalheNome').textContent = window.animeAtual.nome;
    document.getElementById('detalheNota').textContent =
      window.animeAtual.nota ? '⭐ ' + window.animeAtual.nota + ' / 10' : '';
    document.getElementById('detalheCapa').src  = window.animeAtual.capa;
    document.getElementById('detalheObs').value = window.animeAtual.observacao;

    window.renderizarAnimes();
    fecharEditModal();
    window.editMode = false;
  }

  document.getElementById('editBtn').addEventListener('click', abrirEditModal);
  closeBtn.addEventListener('click', fecharEditModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharEditModal(); });
  saveBtn.addEventListener('click', salvarEdicaoModal);
})();
