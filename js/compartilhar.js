/* ══════════════════════════════════════
   COMPARTILHAR — OKIRU
   Menu de compartilhamento, story preview,
   xpost preview e geração de imagens.
══════════════════════════════════════ */

let animeParaCompartilhar = null;
let _shareTipo = null; // 'story' | 'xpost'

// ── Menu principal ──
window.abrirMenuCompartilhar = function (anime) {
  animeParaCompartilhar = anime;
  const prev = document.getElementById('shareAnimePreview');
  prev.innerHTML = `
    <img src="${anime.capa}" onerror="this.src='https://via.placeholder.com/48x68?text=?'">
    <div class="share-anime-preview-info">
      <strong>${anime.nome}</strong>
      <span>⭐ ${anime.nota}/10</span>
    </div>
  `;
  document.getElementById('shareOverlay').style.display = 'flex';
};

document.getElementById('shareOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('shareOverlay')) fecharShareMenu();
});
document.getElementById('shareClose').addEventListener('click', fecharShareMenu);

function fecharShareMenu() {
  document.getElementById('shareOverlay').style.display = 'none';
  animeParaCompartilhar = null;
  _voltarStep1();
}
// Exposta globalmente para badges.js poder chamar
window.fecharShareMenu = fecharShareMenu;

// ── Compartilhar como texto ──
document.getElementById('shareBtnTexto').addEventListener('click', async () => {
  if (!animeParaCompartilhar) return;
  const a   = animeParaCompartilhar;
  const msg = `Terminei ${a.nome} e acho que ele merece ${a.nota}/10! Já deixei tudo registrado no Okiru ⛩️`;
  if (navigator.share) {
    try { await navigator.share({ text: msg }); } catch (e) { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(msg);
    window.mostrarToast('Texto copiado! Cole onde quiser 📋');
  }
  fecharShareMenu();
});

// ── Step 2: seleção de badges ──
function irParaStep2(tipo) {
  if (!animeParaCompartilhar) return;
  _shareTipo = tipo;

  const badges = window.Badges
    ? window.Badges.getBadgesDisponiveisParaCompartilhar(animeParaCompartilhar)
    : [];
  const lista = document.getElementById('shareBadgeList');
  lista.innerHTML = '';

  if (badges.length === 0) {
    lista.innerHTML = '<p class="share-badge-empty">Esse anime não tem badges ainda 😢</p>';
  } else {
    badges.forEach(badge => {
      const imgSrc  = window.Badges._resolverUrl ? window.Badges._resolverUrl(badge.img) : badge.img;
      const isManual = !badge.check;
      const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';
      const item = document.createElement('label');
      item.className = 'share-badge-item';
      item.innerHTML = `
        <input type="checkbox" class="share-badge-check" value="${badge.id}"
               ${isManual ? '' : 'checked'}>
        <div class="share-badge-item-inner">
          <img class="share-badge-item-img${fmtClass}" src="${imgSrc}"
               alt="${badge.nome}" onerror="this.style.display='none'">
          <div class="share-badge-item-info">
            <strong>${badge.nome}</strong>
            <span>${badge.desc || ''}</span>
          </div>
          <div class="share-badge-item-toggle"></div>
        </div>
      `;
      lista.appendChild(item);
    });
  }

  document.getElementById('shareStep1').style.display = 'none';
  document.getElementById('shareStep2').style.display = 'block';
}

function _voltarStep1() {
  document.getElementById('shareStep1').style.display = 'block';
  document.getElementById('shareStep2').style.display = 'none';
  _shareTipo = null;
}

document.getElementById('shareStep2Back').addEventListener('click', _voltarStep1);

document.getElementById('shareGerarBtn').addEventListener('click', () => {
  if (!animeParaCompartilhar) return;
  const anime = animeParaCompartilhar;
  const selecionadas = [...document.querySelectorAll('.share-badge-check:checked')].map(el => el.value);
  anime._badgesSelecionadas = selecionadas.length > 0 ? selecionadas : null;

  const tipo = _shareTipo;
  fecharShareMenu();

  if (tipo === 'story') {
    window.abrirStoryPreview(anime);
  } else {
    window.abrirXPostPreview(anime);
  }
});

document.getElementById('shareBtnStory').addEventListener('click', () => {
  if (!animeParaCompartilhar) return;
  irParaStep2('story');
});
document.getElementById('shareBtnXPost').addEventListener('click', () => {
  if (!animeParaCompartilhar) return;
  irParaStep2('xpost');
});

// Botão share no menu ⋯ do detalhe
document.getElementById('dtShareBtn').addEventListener('click', () => {
  document.getElementById('dtMenuDropdown').classList.remove('open');
  document.getElementById('dtMenuBtn').classList.remove('active');
  if (window.animeAtual) window.abrirMenuCompartilhar(window.animeAtual);
});

// ── XPost Preview ──
document.getElementById('xPostPreviewOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('xPostPreviewOverlay')) fecharXPostPreview();
});
document.getElementById('xPostPreviewClose').addEventListener('click', fecharXPostPreview);

function fecharXPostPreview() {
  document.getElementById('xPostPreviewOverlay').style.display = 'none';
}

window.abrirXPostPreview = function (anime) {
  window._lastAnimeXPost = anime;
  const nota       = parseFloat(anime.nota) || 0;
  const estrelas   = Math.round((nota / 10) * 5);
  const strEstrelas = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : null;
  const studio = anime.studio || null;
  const sinopse = anime.sinopse || null;

  const card = document.getElementById('xPostCard');
  card.innerHTML = `
    <div class="story-header">
      <span class="story-header-icon">⛩️</span>
      <span class="story-header-name">Okiru</span>
    </div>
    <span class="xpost-badge">𝕏</span>
    <div class="story-capa-wrap">
      <img src="${anime.capa}" class="story-capa-img" onerror="this.style.display='none'">
      <div class="story-capa-fade"></div>
    </div>
    <div class="story-content">
      <h2 class="story-anime-nome">${anime.nome}</h2>
      ${ano || studio
        ? `<p class="story-meta">${[ano, studio ? '🎬 ' + studio : null].filter(Boolean).join('  ·  ')}</p>`
        : ''}
      <p class="story-avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="story-estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="story-sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="story-footer">⛩️  okiru</div>
  `;

  document.getElementById('xPostPreviewOverlay').style.display = 'flex';
};

document.getElementById('xPostDownloadBtn').addEventListener('click', () => {
  const anime = animeParaCompartilhar || window._lastAnimeXPost;
  if (!anime) return;
  window.abrirXPostNova(anime);
});

window.abrirXPostNova = function (anime) {
  const nota       = parseFloat(anime.nota) || 0;
  const estrelas   = Math.round((nota / 10) * 5);
  const strEstrelas = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : '';
  const studio = anime.studio || '';
  const sinopse = anime.sinopse || '';
  const metaLine = [ano, studio ? '🎬 ' + studio : ''].filter(Boolean).join('  ·  ');

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Okiru — ${anime.nome} (Post X)</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0a0a14; display:flex; flex-direction:column; align-items:center;
           justify-content:center; min-height:100vh; font-family:'Nunito',sans-serif;
           padding:20px; gap:16px; }
    p.instrucao { color:rgba(255,255,255,0.5); font-size:13px; text-align:center; }
    .card { width:502px; height:872px;
            background:linear-gradient(160deg,#1a1c2e 0%,#16182a 50%,#0f1117 100%);
            border-radius:20px; position:relative; overflow:hidden;
            box-shadow:0 24px 64px rgba(0,0,0,0.8); }
    .card::before { content:''; position:absolute; top:-80px; right:-80px;
                    width:320px; height:320px; border-radius:50%;
                    background:radial-gradient(circle,rgba(167,139,250,0.3) 0%,transparent 70%); }
    .card::after  { content:''; position:absolute; bottom:-60px; left:-60px;
                    width:280px; height:280px; border-radius:50%;
                    background:radial-gradient(circle,rgba(108,122,224,0.25) 0%,transparent 70%); }
    .header { position:absolute; top:0; left:0; right:0; display:flex; align-items:center;
              justify-content:center; gap:10px; z-index:10; padding:18px 0 14px;
              background:rgba(15,17,23,0.6); backdrop-filter:blur(8px); }
    .header-icon { font-size:22px; }
    .header-name { font-size:22px; font-weight:800; color:white; letter-spacing:0.5px; }
    .capa-wrap { position:absolute; top:0; left:0; right:0; height:55%; z-index:1; }
    .capa-img { width:100%; height:100%; object-fit:cover; display:block; }
    .capa-fade { position:absolute; bottom:0; left:0; right:0; height:75%;
                 background:linear-gradient(to bottom,transparent 0%,#0f1117 100%); }
    .content { position:absolute; bottom:52px; left:0; right:0; padding:0 28px; z-index:5; }
    .nome { font-size:34px; font-weight:900; color:#fff; line-height:1.15; margin-bottom:8px;
            text-shadow:0 2px 12px rgba(0,0,0,0.6); }
    .meta { font-size:13px; color:#a78bfa; font-weight:700; margin-bottom:12px; }
    .avaliacao { font-size:17px; color:rgba(255,255,255,0.85); margin-bottom:4px; }
    .avaliacao strong { color:#fff; font-size:20px; }
    .estrelas { font-size:26px; letter-spacing:3px; color:#f59e0b; margin-bottom:12px; }
    .sinopse { font-size:13px; color:rgba(255,255,255,0.55); line-height:1.6;
               display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; }
    .footer { position:absolute; bottom:16px; left:0; right:0; text-align:center; z-index:5;
              font-size:14px; font-weight:800; color:rgba(108,122,224,0.7); letter-spacing:1px; }
    .x-badge { position:absolute; top:18px; right:20px; z-index:15; font-size:20px;
               font-weight:900; color:rgba(255,255,255,0.85); }
  </style>
</head>
<body>
  <p class="instrucao">Clique com botão direito na imagem → Salvar imagem<br>ou tire um screenshot 📸</p>
  <div class="card">
    <div class="header"><span class="header-icon">⛩️</span><span class="header-name">Okiru</span></div>
    <span class="x-badge">𝕏</span>
    <div class="capa-wrap">
      <img class="capa-img" src="${anime.capa}" onerror="this.style.display='none'">
      <div class="capa-fade"></div>
    </div>
    <div class="content">
      <h2 class="nome">${anime.nome}</h2>
      ${metaLine ? `<p class="meta">${metaLine}</p>` : ''}
      <p class="avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="footer">⛩️  okiru</div>
  </div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ── Story Preview ──
document.getElementById('storyPreviewOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('storyPreviewOverlay')) fecharStoryPreview();
});
document.getElementById('storyPreviewClose').addEventListener('click', fecharStoryPreview);

function fecharStoryPreview() {
  document.getElementById('storyPreviewOverlay').style.display = 'none';
}

window.abrirStoryPreview = function (anime) {
  window._lastAnimeStory = anime;
  const nota       = parseFloat(anime.nota) || 0;
  const estrelas   = Math.round((nota / 10) * 5);
  const strEstrelas = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : null;
  const studio = anime.studio || null;
  const sinopse = anime.sinopse || null;

  const card = document.getElementById('storyCard');
  card.innerHTML = `
    <div class="story-header">
      <span class="story-header-icon">⛩️</span>
      <span class="story-header-name">Okiru</span>
    </div>
    <div class="story-capa-wrap">
      <img src="${anime.capa}" class="story-capa-img" onerror="this.style.display='none'">
      <div class="story-capa-fade"></div>
    </div>
    <div class="story-content">
      <h2 class="story-anime-nome">${anime.nome}</h2>
      ${ano || studio
        ? `<p class="story-meta">${[ano, studio ? '🎬 ' + studio : null].filter(Boolean).join('  ·  ')}</p>`
        : ''}
      <p class="story-avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="story-estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="story-sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="story-footer">⛩️ okiru</div>
  `;

  document.getElementById('storyPreviewOverlay').style.display = 'flex';
};

document.getElementById('storyDownloadBtn').addEventListener('click', () => {
  const anime = animeParaCompartilhar || window._lastAnimeStory;
  if (!anime) return;
  window.abrirStoryNova(anime);
});

window.abrirStoryNova = function (anime) {
  const nota       = parseFloat(anime.nota) || 0;
  const estrelas   = Math.round((nota / 10) * 5);
  const strEstrelas = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : '';
  const studio = anime.studio || '';
  const sinopse = anime.sinopse || '';
  const metaLine = [ano, studio ? '🎬 ' + studio : ''].filter(Boolean).join('  ·  ');

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Okiru — ${anime.nome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0a0a14; display:flex; flex-direction:column; align-items:center;
           justify-content:center; min-height:100vh; font-family:'Nunito',sans-serif;
           padding:20px; gap:20px; }
    p.instrucao { color:rgba(255,255,255,0.5); font-size:13px; text-align:center; }
    .card { width:360px; height:640px;
            background:linear-gradient(160deg,#1a1c2e 0%,#16182a 50%,#0f1117 100%);
            border-radius:20px; position:relative; overflow:hidden;
            box-shadow:0 24px 64px rgba(0,0,0,0.8); }
    .card::before { content:''; position:absolute; top:-80px; right:-80px;
                    width:280px; height:280px; border-radius:50%;
                    background:radial-gradient(circle,rgba(167,139,250,0.3) 0%,transparent 70%); }
    .card::after  { content:''; position:absolute; bottom:-60px; left:-60px;
                    width:240px; height:240px; border-radius:50%;
                    background:radial-gradient(circle,rgba(108,122,224,0.25) 0%,transparent 70%); }
    .header { position:absolute; top:0; left:0; right:0; display:flex; align-items:center;
              justify-content:center; gap:8px; z-index:10; padding:14px 0 12px;
              background:rgba(15,17,23,0.6); backdrop-filter:blur(8px); }
    .header-icon { font-size:18px; }
    .header-name { font-size:18px; font-weight:800; color:white; letter-spacing:0.5px; }
    .capa-wrap { position:absolute; top:0; left:0; right:0; height:58%; z-index:1; }
    .capa-img { width:100%; height:100%; object-fit:cover; display:block; }
    .capa-fade { position:absolute; bottom:0; left:0; right:0; height:75%;
                 background:linear-gradient(to bottom,transparent 0%,#0f1117 100%); }
    .content { position:absolute; bottom:44px; left:0; right:0; padding:0 20px; z-index:5; }
    .nome { font-size:26px; font-weight:900; color:#fff; line-height:1.15; margin-bottom:5px;
            text-shadow:0 2px 12px rgba(0,0,0,0.6); }
    .meta { font-size:11px; color:#a78bfa; font-weight:700; margin-bottom:8px; }
    .avaliacao { font-size:14px; color:rgba(255,255,255,0.85); margin-bottom:3px; }
    .avaliacao strong { color:#fff; font-size:16px; }
    .estrelas { font-size:20px; letter-spacing:2px; color:#f59e0b; margin-bottom:8px; }
    .sinopse { font-size:10.5px; color:rgba(255,255,255,0.55); line-height:1.5;
               display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
    .footer { position:absolute; bottom:12px; left:0; right:0; text-align:center; z-index:5;
              font-size:12px; font-weight:800; color:rgba(108,122,224,0.7); letter-spacing:1px; }
  </style>
</head>
<body>
  <p class="instrucao">Clique com botão direito na imagem → Salvar imagem<br>ou tire um screenshot 📸</p>
  <div class="card">
    <div class="header"><span class="header-icon">⛩️</span><span class="header-name">Okiru</span></div>
    <div class="capa-wrap">
      <img class="capa-img" src="${anime.capa}" onerror="this.style.display='none'">
      <div class="capa-fade"></div>
    </div>
    <div class="content">
      <h2 class="nome">${anime.nome}</h2>
      ${metaLine ? `<p class="meta">${metaLine}</p>` : ''}
      <p class="avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="footer">⛩️ okiru</div>
  </div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
