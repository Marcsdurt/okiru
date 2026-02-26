/* ══════════════════════════════════════
   BADGES — OKIRU
   Adicione ao index.html:
     <link rel="stylesheet" href="badges.css">  → no <head>
     <script src="badges.js"></script>           → após script.js e tutorial.js
══════════════════════════════════════ */

(function () {

  /* ─────────────────────────────────
     CAMINHO BASE
  ───────────────────────────────── */
  const BASE_URL = (() => {
    const loc = window.location.href.split('?')[0];
    return loc.substring(0, loc.lastIndexOf('/') + 1);
  })();

  function resolverUrlImg(path) {
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return BASE_URL + path;
  }

  /* ─────────────────────────────────
     DEFINIÇÃO DAS BADGES
  ───────────────────────────────── */
  const BADGES = [
    {
      id:    'classico',
      nome:  'Clássico',
      img:   'badges/badge-classico.png',
      emoji: '🏛️',
      formato: 'livre',
      desc:  'Esse anime está na sua lista há 1 ano ou mais. Um verdadeiro clássico do seu histórico!',
      check(anime) {
        const criacao = anime.dataCriacao || anime.id;
        if (!criacao) return false;
        const umAnoMs = 365 * 24 * 60 * 60 * 1000;
        return (Date.now() - criacao) >= umAnoMs;
      },
    },
    {
      id:    'decepcao',
      nome:  'Decepção',
      img:   'badges/badge-decepcao.png',
      emoji: '😞',
      formato: 'livre',
      desc:  'Esse anime ficou abaixo das expectativas. Nota menor que 5.',
      check(anime) {
        const nota = parseFloat(anime.nota);
        return !isNaN(nota) && nota > 0 && nota < 5;
      },
    },
    // { id: 'maratonista', nome: 'Maratonista', img: 'badges/badge-maratonista.png', emoji: '🏃',
    //   check: (a) => parseInt(a.assistidosEps) >= 100 },
  ];

  function getBadgesDoAnime(anime) {
    return BADGES.filter(b => b.check(anime));
  }

  /* ─────────────────────────────────
     MODAL DE DETALHE — Badge lateral
     (DOM normal da página — sem blob,
      sem problema de caminho)
  ───────────────────────────────── */
  let badgeLateralEl = null;

  /* ─────────────────────────────────
     POPUP de detalhe da badge
     Aparece ao clicar na badge lateral
  ───────────────────────────────── */
  function abrirBadgePopup(badge) {
    // Remove popup anterior
    const old = document.getElementById('badgePopupOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'badgePopupOverlay';
    overlay.className = 'badge-popup-overlay';

    const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';

    overlay.innerHTML = `
      <div class="badge-popup">
        <button class="badge-popup-close" id="badgePopupClose">✕</button>
        <div class="badge-popup-glow"></div>
        <img
          class="badge-popup-img${fmtClass}"
          src="${resolverUrlImg(badge.img)}"
          alt="${badge.nome}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        >
        <span class="badge-popup-emoji${fmtClass}" style="display:none">${badge.emoji}</span>
        <div class="badge-popup-label">BADGE</div>
        <div class="badge-popup-nome">${badge.nome}</div>
        <div class="badge-popup-desc">${badge.desc || 'Anime na sua lista há 1 ano ou mais.'}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animar entrada
    requestAnimationFrame(() => overlay.classList.add('visible'));

    // Fechar
    const fecharPopup = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('badgePopupClose').addEventListener('click', fecharPopup);
    overlay.addEventListener('click', e => { if (e.target === overlay) fecharPopup(); });
  }

  function criarBadgeItem(badge, index) {
    const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';

    const item = document.createElement('div');
    item.className = 'badge-lateral-item';
    item.style.setProperty('--badge-delay', (index * 0.15) + 's');

    const imgEl = document.createElement('img');
    imgEl.className = 'badge-lateral-img' + fmtClass;
    imgEl.alt = badge.nome;

    const emojiEl = document.createElement('span');
    emojiEl.className = 'badge-lateral-emoji' + fmtClass;
    emojiEl.textContent = badge.emoji;
    emojiEl.style.display = 'none';

    imgEl.addEventListener('error', () => {
      imgEl.style.display = 'none';
      emojiEl.style.display = 'flex';
    });

    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'badge-lateral-tooltip';
    tooltipEl.innerHTML = `
      <span class="badge-tooltip-label">Badge</span>
      <span class="badge-tooltip-name">${badge.nome}</span>
    `;

    item.appendChild(imgEl);
    item.appendChild(emojiEl);
    item.appendChild(tooltipEl);

    item.addEventListener('click', () => abrirBadgePopup(badge));

    imgEl.src = resolverUrlImg(badge.img);
    return item;
  }

  function renderBadgeNoModal(anime) {
    if (badgeLateralEl) { badgeLateralEl.remove(); badgeLateralEl = null; }

    const badges = getBadgesDoAnime(anime);
    if (badges.length === 0) return;

    const modalCard = document.querySelector('.modal-detalhe');
    if (!modalCard) return;

    const isMobile = window.innerWidth <= 768;

    badgeLateralEl = document.createElement('div');
    badgeLateralEl.className = 'badge-lateral-wrap' + (isMobile ? ' badge-lateral-mobile' : '');

    // Renderiza cada badge como um item empilhado com animação escalonada
    badges.forEach((badge, index) => {
      badgeLateralEl.appendChild(criarBadgeItem(badge, index));
    });

    modalCard.appendChild(badgeLateralEl);

    // No mobile garante posição final via animationend do último item
    if (isMobile) {
      const lastItem = badgeLateralEl.lastElementChild;
      if (lastItem) {
        lastItem.addEventListener('animationend', () => {
          badgeLateralEl.style.opacity = '1';
          badgeLateralEl.style.transform = 'translateY(-50%)';
        }, { once: true });
      }
    }
  }

  function limparBadgeModal() {
    if (badgeLateralEl) { badgeLateralEl.remove(); badgeLateralEl = null; }
  }

  /* ─────────────────────────────────
     HOOK em abrirDetalhe
  ───────────────────────────────── */
  const _hookDetalhe = setInterval(() => {
    if (typeof window.abrirDetalhe === 'function') {
      clearInterval(_hookDetalhe);
      const _orig = window.abrirDetalhe;
      window.abrirDetalhe = function (anime) {
        _orig.call(this, anime);
        requestAnimationFrame(() => renderBadgeNoModal(anime));
      };
    }
  }, 50);

  document.addEventListener('click', e => {
    const fechar  = document.getElementById('fecharDetalhe');
    const overlay = document.getElementById('modalDetalhe');
    if (!fechar || !overlay) return;
    if (fechar.contains(e.target) || e.target === fechar || e.target === overlay) {
      limparBadgeModal();
    }
  });

  /* ─────────────────────────────────
     HOOK em abrirStoryPreview
     ← ABORDAGEM CORRETA para a imagem

     Em vez de tentar embutir a imagem
     num blob (que falha em file://),
     injetamos a badge diretamente no
     #storyCard que já está no DOM da
     página. A imagem carrega normalmente
     como qualquer <img> da página.
  ───────────────────────────────── */
  const _hookStory = setInterval(() => {
    if (typeof window.abrirStoryPreview === 'function') {
      clearInterval(_hookStory);
      const _origPreview = window.abrirStoryPreview;

      window.abrirStoryPreview = function (anime) {
        // Chama o original primeiro (monta o card normalmente)
        _origPreview.call(this, anime);

        const badges = getBadgesDoAnime(anime);
        if (badges.length === 0) return;

        const badge   = badges[0];
        const content = document.querySelector('#storyCard .story-content');
        if (!content) return;

        // Remove badge anterior se houver (reabertura do modal)
        const existing = content.querySelector('.story-badge-wrap');
        if (existing) existing.remove();

        // Cria o elemento da badge — imagem normal no DOM da página
        const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';
        const wrap = document.createElement('div');
        wrap.className = 'story-badge-wrap';
        wrap.innerHTML = `
          <img
            class="story-badge-img${fmtClass}"
            src="${resolverUrlImg(badge.img)}"
            alt="${badge.nome}"
          >
          <div class="story-badge-tag">${badge.nome}</div>
        `;

        // Insere ANTES do nome do anime
        const nomeEl = content.querySelector('.story-anime-nome');
        if (nomeEl) {
          content.insertBefore(wrap, nomeEl);
        } else {
          content.prepend(wrap);
        }
      };
    }
  }, 50);

  /* ─────────────────────────────────
     HOOK em abrirXPostPreview
     (mesma lógica — DOM da página)
  ───────────────────────────────── */
  const _hookXPost = setInterval(() => {
    if (typeof window.abrirXPostPreview === 'function') {
      clearInterval(_hookXPost);
      const _origXPreview = window.abrirXPostPreview;

      window.abrirXPostPreview = function (anime) {
        _origXPreview.call(this, anime);

        const badges = getBadgesDoAnime(anime);
        if (badges.length === 0) return;

        const badge   = badges[0];
        const content = document.querySelector('#xPostCard .story-content');
        if (!content) return;

        const existing = content.querySelector('.story-badge-wrap');
        if (existing) existing.remove();

        const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';
        const wrap = document.createElement('div');
        wrap.className = 'story-badge-wrap';
        wrap.innerHTML = `
          <img
            class="story-badge-img${fmtClass}"
            src="${resolverUrlImg(badge.img)}"
            alt="${badge.nome}"
          >
          <div class="story-badge-tag">${badge.nome}</div>
        `;

        const nomeEl = content.querySelector('.story-anime-nome');
        if (nomeEl) {
          content.insertBefore(wrap, nomeEl);
        } else {
          content.prepend(wrap);
        }
      };
    }
  }, 50);

  /* ─────────────────────────────────
     HOOK em abrirStoryNova / abrirXPostNova
     (páginas de download em nova aba)
     Aqui não tem solução para file://,
     mas pelo menos não quebra.
     O preview no overlay já mostra tudo.
  ───────────────────────────────── */
  const _hookDownload = setInterval(() => {
    if (typeof window.abrirStoryNova  === 'function' &&
        typeof window.abrirXPostNova  === 'function') {
      clearInterval(_hookDownload);

      // Story nova aba: injeta bloco de badge no HTML com URL absoluta
      // (funciona quando servido por servidor HTTP, não em file://)
      const _origStoryNova = window.abrirStoryNova;
      window.abrirStoryNova = function (anime) {
        return _origStoryNova.call(this, anime);
      };

      const _origXPostNova = window.abrirXPostNova;
      window.abrirXPostNova = function (anime) {
        return _origXPostNova.call(this, anime);
      };
    }
  }, 50);

  // API pública
  window.Badges = { getBadgesDoAnime };

})();
