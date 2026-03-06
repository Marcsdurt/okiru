/* ══════════════════════════════════════
   EXPANDIR LISTAS — OKIRU
   Expande cada lista de animes para
   visualização em grid, quase full-screen.
══════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────
     ESTADO
  ───────────────────────────────── */
  let categoriaExpandida = null; // elemento .categoria atualmente expandido
  let placeholderEl      = null; // <div> invisible que ocupa o lugar no DOM
  let posicaoOriginal    = null; // { parent, nextSibling } para restaurar

  /* ─────────────────────────────────
     OVERLAY
  ───────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.id = 'expandirOverlay';
  document.body.appendChild(overlay);

  overlay.addEventListener('click', recolher);

  /* ─────────────────────────────────
     EXPANDIR
  ───────────────────────────────── */
  function expandir(categoriaEl, btn) {
    if (categoriaExpandida) recolher();

    // Guarda posição original
    posicaoOriginal = {
      parent:      categoriaEl.parentNode,
      nextSibling: categoriaEl.nextSibling,
    };

    // Placeholder mantém o espaço no layout
    placeholderEl = document.createElement('div');
    placeholderEl.style.cssText = `
      height: ${categoriaEl.offsetHeight}px;
      margin-bottom: ${getComputedStyle(categoriaEl).marginBottom};
      border-radius: ${getComputedStyle(categoriaEl).borderRadius};
      pointer-events: none;
      visibility: hidden;
    `;
    posicaoOriginal.parent.insertBefore(placeholderEl, posicaoOriginal.nextSibling);

    // Move a categoria para o body e adiciona classe
    document.body.appendChild(categoriaEl);
    categoriaEl.classList.add('expandida');

    // Marca botão como ativo e troca ícone para "recolher"
    btn.classList.add('ativo');
    btn.title = 'Recolher lista';
    btn.innerHTML = _svgRecolher();

    // Mostra overlay
    overlay.classList.add('visivel');

    // Impede scroll do body no mobile
    document.body.style.overflow = 'hidden';

    // Desativa drag-scroll na lista expandida para cards ficarem clicáveis
    const listaEl = categoriaEl.querySelector('.lista');
    if (listaEl && typeof listaEl._wasDragging === 'function') {
      listaEl._wasDraggingOriginal = listaEl._wasDragging;
      listaEl._wasDragging = () => false;
    }

    document.body.classList.add('lista-expandida-ativa');
    categoriaExpandida = categoriaEl;

    // ESC para fechar
    document.addEventListener('keydown', _onKeyDown);
  }

  /* ─────────────────────────────────
     RECOLHER
  ───────────────────────────────── */
  function recolher() {
    if (!categoriaExpandida) return;

    const categoriaEl = categoriaExpandida;
    const btn = categoriaEl.querySelector('.expandir-btn');

    // Animação de saída — aguarda antes de mover no DOM
    categoriaEl.style.animation = 'recolherSaida 0.22s ease forwards';

    setTimeout(() => {
      // Remove estilo inline de animação e classe
      categoriaEl.style.animation = '';
      categoriaEl.classList.remove('expandida');

      // Restaura no DOM
      if (posicaoOriginal) {
        posicaoOriginal.parent.insertBefore(categoriaEl, posicaoOriginal.nextSibling);
      }

      // Restaura drag-scroll na lista
      const listaElR = categoriaEl.querySelector('.lista');
      if (listaElR && listaElR._wasDraggingOriginal) {
        listaElR._wasDragging = listaElR._wasDraggingOriginal;
        delete listaElR._wasDraggingOriginal;
      }

      // Remove placeholder
      if (placeholderEl) { placeholderEl.remove(); placeholderEl = null; }

      // Restaura botão
      if (btn) {
        btn.classList.remove('ativo');
        btn.title = 'Expandir lista';
        btn.innerHTML = _svgExpandir();
      }

      // Esconde overlay
      overlay.classList.remove('visivel');
      document.body.classList.remove('lista-expandida-ativa');
      document.body.style.overflow = '';

      categoriaExpandida = null;
      posicaoOriginal    = null;
    }, 210);

    document.removeEventListener('keydown', _onKeyDown);
  }

  /* ─────────────────────────────────
     TECLA ESC
  ───────────────────────────────── */
  function _onKeyDown(e) {
    if (e.key === 'Escape') recolher();
  }

  /* ─────────────────────────────────
     BIND DOS BOTÕES
  ───────────────────────────────── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.expandir-btn');
    if (!btn) return;

    e.stopPropagation();
    const categoriaEl = btn.closest('.categoria');
    if (!categoriaEl) return;

    if (categoriaEl.classList.contains('expandida')) {
      recolher();
    } else {
      expandir(categoriaEl, btn);
    }
  });

  /* ─────────────────────────────────
     SVG HELPERS
  ───────────────────────────────── */
  function _svgExpandir() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
  }

  function _svgRecolher() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg>`;
  }

  /* ─────────────────────────────────
     API PÚBLICA
  ───────────────────────────────── */
  window.ExpandirListas = { expandir, recolher };

})();
