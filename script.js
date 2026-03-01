// ======== TRADUÇÃO DE GÊNEROS ========
const generosPT = {
  "Action": "Ação",
  "Adventure": "Aventura",
  "Comedy": "Comédia",
  "Drama": "Drama",
  "Fantasy": "Fantasia",
  "Horror": "Terror",
  "Mystery": "Mistério",
  "Romance": "Romance",
  "Sci-Fi": "Ficção Científica",
  "Science Fiction": "Ficção Científica",
  "Slice of Life": "Slice of Life",
  "Sports": "Esportes",
  "Supernatural": "Sobrenatural",
  "Thriller": "Suspense",
  "Psychological": "Psicológico",
  "Mecha": "Mecha",
  "Music": "Música",
  "School": "Escola",
  "Military": "Militar",
  "Historical": "Histórico",
  "Parody": "Paródia",
  "Harem": "Harém",
  "Martial Arts": "Artes Marciais",
  "Magic": "Magia",
  "Demons": "Demônios",
  "Vampire": "Vampiro",
  "Space": "Espaço",
  "Cars": "Corrida",
  "Samurai": "Samurai",
  "Game": "Jogos",
  "Josei": "Josei",
  "Seinen": "Seinen",
  "Shonen": "Shonen",
  "Shounen": "Shonen",
  "Shōnen": "Shonen",
  "Shoujo": "Shojo",
  "Shojo": "Shojo",
  "Shōjo": "Shojo",
  "Award Winning": "Premiado",
  "Boys Love": "Boys Love",
  "Girls Love": "Girls Love",
  "Suspense": "Suspense",
  "Gore": "Gore",
  "Ecchi": "Ecchi",
  "Isekai": "Isekai",
};

function traduzirGenero(nome) {
  return generosPT[nome] || nome;
}

function renderizarTagsGenero(generos) {
  if (!generos || generos.length === 0) return "";
  return generos.map(g => {
    const nome = typeof g === "string" ? g : g.name;
    const traduzido = traduzirGenero(nome);
    return `<span class="genero-tag">${traduzido}</span>`;
  }).join("");
}

// ======== DADOS ========
let animes = JSON.parse(localStorage.getItem("animes")) || [];
let animeAtual = null;
let editMode = false;
let searchTimeout = null;
let sdAnimeData = null;
let ordenacao = {
  assistindo: "recentes",
  assistidos: "recentes",
  paraAssistir: "recentes"
};

// ======== DRAG-SCROLL ========
function ativarDragScroll(el) {
  let isDown = false, startX, scrollLeft, moved = false;
  el.addEventListener("mousedown", e => {
    isDown = true; moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.style.cursor = "grabbing";
  });
  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    el.style.cursor = "";
    setTimeout(() => { moved = false; }, 10);
  });
  el.addEventListener("mousemove", e => {
    if (!isDown) return;
    const dx = e.pageX - el.offsetLeft - startX;
    if (Math.abs(dx) > 5) { moved = true; e.preventDefault(); el.scrollLeft = scrollLeft - dx * 1.2; }
  });
  el.addEventListener("mouseleave", () => { isDown = false; el.style.cursor = ""; });
  el._wasDragging = () => moved;
}

// ======== BUSCA LOCAL ========
let termoBusca = "";

document.getElementById("buscaLocal").addEventListener("input", e => {
  termoBusca = e.target.value.trim().toLowerCase();
  document.getElementById("buscaLocalClear").style.display = termoBusca ? "flex" : "none";
  renderizarAnimes();
});

document.getElementById("buscaLocalClear").addEventListener("click", () => {
  termoBusca = "";
  document.getElementById("buscaLocal").value = "";
  document.getElementById("buscaLocalClear").style.display = "none";
  document.getElementById("buscaLocal").focus();
  renderizarAnimes();
});

// ======== RENDER ========
function renderizarAnimes() {
  const listaEls = {
    assistindo:   document.getElementById("listaAssistindo"),
    assistidos:   document.getElementById("listaAssistidos"),
    paraAssistir: document.getElementById("listaPara")
  };
  Object.values(listaEls).forEach(l => l.innerHTML = "");

  const counts = { assistindo: 0, assistidos: 0, paraAssistir: 0 };
  const grupos = { assistindo: [], assistidos: [], paraAssistir: [] };

  animes.forEach(a => {
    // Filtro de busca local
    if (termoBusca && !a.nome.toLowerCase().includes(termoBusca)) return;
    counts[a.status] = (counts[a.status] || 0) + 1;
    grupos[a.status].push(a);
  });

  Object.keys(grupos).forEach(key => {
    grupos[key].sort((a, b) => ordenacao[key] === "recentes" ? b.id - a.id : a.id - b.id);
  });

  Object.entries(grupos).forEach(([key, lista]) => {
    const container = listaEls[key];

    if (lista.length === 0) {
      const empty = document.createElement("div");
      empty.className = "lista-empty";
      if (termoBusca) {
        empty.textContent = "Nenhum resultado";
        empty.style.cursor = "default";
      } else {
        empty.textContent = "+ Adicionar anime";
        empty.addEventListener("click", () => document.getElementById("modal").style.display = "flex");
      }
      container.appendChild(empty);
    } else {
      lista.forEach(anime => {
        const card = document.createElement("div");
        card.classList.add("card");

        const totalEps = parseInt(anime.totalEps) || 0;
        const assistidosEps = parseInt(anime.assistidosEps) || 0;
        const pct = totalEps > 0 ? Math.min(100, Math.round((assistidosEps / totalEps) * 100)) : 0;

        card.innerHTML = `
          <img src="${anime.capa}" alt="${anime.nome}" onerror="this.src='https://via.placeholder.com/130x185?text=?'">
          <div class="card-info">
            <div class="card-title">${anime.nome}</div>
            <span class="card-badge">⭐ ${anime.nota}</span>
            ${totalEps > 0 ? `
            <div class="eps-bar-wrap"><div class="eps-bar" style="width:${pct}%"></div></div>
            <div class="eps-label">${assistidosEps}/${totalEps} eps</div>
            ` : ""}
          </div>
`;


        card.addEventListener("click", () => {
          if (container._wasDragging && container._wasDragging()) return;
          abrirDetalhe(anime);
        });

        container.appendChild(card);
      });
    }

    ativarDragScroll(container);
  });

  document.getElementById("countAssistindo").textContent = counts.assistindo || 0;
  document.getElementById("countAssistidos").textContent = counts.assistidos || 0;
  document.getElementById("countPara").textContent       = counts.paraAssistir || 0;
  document.getElementById("statAssistindo").textContent  = counts.assistindo || 0;
  document.getElementById("statAssistidos").textContent  = counts.assistidos || 0;
  document.getElementById("statPara").textContent        = counts.paraAssistir || 0;

  atualizarIconesFiltro();
}
renderizarAnimes();

// ======== FILTROS ========
function atualizarIconesFiltro() {
  const mapa = { assistindo: "filterAssistindo", assistidos: "filterAssistidos", paraAssistir: "filterPara" };
  Object.entries(mapa).forEach(([key, btnId]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.setAttribute("data-order", ordenacao[key]);
    btn.textContent = ordenacao[key] === "recentes" ? "↓ Recentes" : "↑ Antigos";
  });
}
function toggleOrdenacao(key) {
  ordenacao[key] = ordenacao[key] === "recentes" ? "antigos" : "recentes";
  renderizarAnimes();
  const mapa = { assistindo: "filterAssistindo", assistidos: "filterAssistidos", paraAssistir: "filterPara" };
  const btn = document.getElementById(mapa[key]);
  if (btn) { btn.classList.add("filter-btn-pulse"); setTimeout(() => btn.classList.remove("filter-btn-pulse"), 300); }
}
document.getElementById("filterAssistindo").addEventListener("click", () => toggleOrdenacao("assistindo"));
document.getElementById("filterAssistidos").addEventListener("click", () => toggleOrdenacao("assistidos"));
document.getElementById("filterPara").addEventListener("click", () => toggleOrdenacao("paraAssistir"));

// ======== RECORTE DE IMAGEM (2:3) ========
function recortarImagem2x3(file, callback) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const W = 260, H = 390; // 2:3
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      const ratio = Math.max(W / img.width, H / img.height);
      const nw = img.width * ratio, nh = img.height * ratio;
      const ox = (W - nw) / 2, oy = (H - nh) / 2;
      ctx.drawImage(img, ox, oy, nw, nh);
      callback(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// Galeria no modal de adicionar anime
document.getElementById("btnGaleriaAnime").addEventListener("click", () => {
  document.getElementById("capaFileInput").click();
});
document.getElementById("capaFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  recortarImagem2x3(file, dataUrl => {
    document.getElementById("capa").value = dataUrl;
  });
  e.target.value = "";
});

// ======== MODAL ADD ========
const modal = document.getElementById("modal");
let tipoModal = "anime"; // "anime" ou "filme"

function atualizarTipoModal(tipo) {
  tipoModal = tipo;
  const isFilme = tipo === "filme";
  document.getElementById("tipoBtnAnime").classList.toggle("tipo-btn-ativo", !isFilme);
  document.getElementById("tipoBtnFilme").classList.toggle("tipo-btn-ativo", isFilme);
  document.getElementById("modalTitulo").textContent = isFilme ? "Adicionar Filme Anime" : "Adicionar Anime";
  document.getElementById("labelNome").innerHTML = (isFilme ? "Nome do filme" : "Nome do anime") + ' <span class="campo-obrigatorio">*</span>';
  document.getElementById("camposEpisodios").style.display = isFilme ? "none" : "";
  document.getElementById("camposDuracao").style.display = isFilme ? "" : "none";
}

document.getElementById("tipoBtnAnime").addEventListener("click", () => atualizarTipoModal("anime"));
document.getElementById("tipoBtnFilme").addEventListener("click", () => atualizarTipoModal("filme"));

document.querySelector(".btn-add").addEventListener("click", () => {
  atualizarTipoModal("anime");
  // Define a data padrão como hoje
  const hoje = new Date().toISOString().slice(0, 10);
  document.getElementById("dataAdicao").value = hoje;
  modal.style.display = "flex";
});
document.getElementById("fechar").addEventListener("click", () => modal.style.display = "none");

document.getElementById("totalEps").addEventListener("input", () => {
  const total = parseInt(document.getElementById("totalEps").value) || 0;
  document.getElementById("assistidosEps").max = total || 99999;
});

document.getElementById("salvar").addEventListener("click", () => {
  const nome = document.getElementById("nome").value.trim();
  const capa = document.getElementById("capa").value.trim();
  const nota = document.getElementById("nota").value;
  const status = document.getElementById("status").value;
  const isFilme = tipoModal === "filme";
  const totalEps = isFilme ? 0 : (parseInt(document.getElementById("totalEps").value) || 0);
  const assistidosEps = isFilme ? 0 : Math.min(parseInt(document.getElementById("assistidosEps").value) || 0, totalEps || 99999);
  const duracao = isFilme ? (parseInt(document.getElementById("duracao").value) || 0) : 0;
  if (!nome || !capa || !nota) { alert("Preencha os campos obrigatórios!"); return; }
  const dataInputVal = document.getElementById("dataAdicao").value;
  const dataCriacao = dataInputVal ? new Date(dataInputVal + "T12:00:00").getTime() : Date.now();
  animes.push({ id: Date.now(), dataCriacao, nome, nota, capa, status, observacao: "", totalEps, assistidosEps, tipo: isFilme ? "filme" : "anime", duracao });
  localStorage.setItem("animes", JSON.stringify(animes));
  renderizarAnimes();
  modal.style.display = "none";
  ["nome","capa","nota","totalEps","assistidosEps","duracao","dataAdicao"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
});

// ======== MODAL DETALHE ========
const modalDetalhe = document.getElementById("modalDetalhe");

function abrirDetalhe(anime) {
  animeAtual = anime;
  editMode = false;
  const eb = document.getElementById("editBtn");
  eb.classList.remove("saving");
  eb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  document.getElementById("detalheCapa").src = anime.capa;
  document.getElementById("detalheNome").textContent = anime.nome;
  document.getElementById("detalheNota").textContent = "⭐ " + anime.nota + " / 10";
  document.getElementById("detalheObs").value = anime.observacao || "";
  document.getElementById("moverParaLista").value = anime.status;

  // Badge filme
  const filmeBadge = document.getElementById("detalheFilmeBadge");
  filmeBadge.style.display = anime.tipo === "filme" ? "inline-flex" : "none";

  // Gêneros no hero
  const tagsEl = document.getElementById("detalheGenerosTags");
  if (anime.generos && anime.generos.length > 0) {
    tagsEl.innerHTML = renderizarTagsGenero(anime.generos);
    tagsEl.style.display = "flex";
  } else {
    tagsEl.innerHTML = "";
    tagsEl.style.display = "none";
  }

  renderEpisodiosDetalhe(anime);
  modalDetalhe.style.display = "flex";
}

function renderEpisodiosDetalhe(anime) {
  const wrap = document.getElementById("detalheEpisodios");
  if (anime.tipo === "filme") {
    wrap.innerHTML = "";
    return;
  }
  const totalEps = parseInt(anime.totalEps) || 0;
  const assistidosEps = parseInt(anime.assistidosEps) || 0;
  const pct = totalEps > 0 ? Math.min(100, Math.round((assistidosEps / totalEps) * 100)) : 0;
  wrap.innerHTML = `
    <div class="eps-detalhe-row">
      <div class="eps-detalhe-field">
        <label>Assistidos</label>
        <input type="number" id="detalheAssistidosEps" value="${assistidosEps}" min="0" max="${totalEps || 99999}" placeholder="0">
      </div>
      <span class="eps-sep">/</span>
      <div class="eps-detalhe-field">
        <label>Total</label>
        <input type="number" id="detalheTotalEps" value="${totalEps || ""}" min="0" placeholder="?">
      </div>
    </div>
    ${totalEps > 0 ? `
    <div class="eps-detalhe-bar-wrap">
      <div class="eps-detalhe-bar" style="width:${pct}%"></div>
      <span class="eps-detalhe-pct">${pct}%</span>
    </div>` : ""}
  `;
  document.getElementById("detalheTotalEps").addEventListener("change", salvarEpisodios);
  document.getElementById("detalheAssistidosEps").addEventListener("change", salvarEpisodios);
  document.getElementById("detalheAssistidosEps").addEventListener("input", salvarEpisodios);
}

function salvarEpisodios() {
  if (!animeAtual) return;
  const totalEps = parseInt(document.getElementById("detalheTotalEps").value) || 0;
  const assistidosEps = Math.min(parseInt(document.getElementById("detalheAssistidosEps").value) || 0, totalEps || 99999);
  animeAtual.totalEps = totalEps;
  animeAtual.assistidosEps = assistidosEps;
  localStorage.setItem("animes", JSON.stringify(animes));
  renderEpisodiosDetalhe(animeAtual);
  renderizarAnimes();
}

document.getElementById("moverParaLista").addEventListener("change", e => {
  if (!animeAtual) return;
  animeAtual.status = e.target.value;
  localStorage.setItem("animes", JSON.stringify(animes));
  renderizarAnimes();
  const sel = e.target;
  sel.style.borderColor = "#34d399";
  setTimeout(() => sel.style.borderColor = "", 900);
});

document.getElementById("fecharDetalhe").addEventListener("click", () => modalDetalhe.style.display = "none");

document.getElementById("detalheShareBtn").addEventListener("click", () => {
  if (!animeAtual) return;
  abrirMenuCompartilhar(animeAtual);
});

document.getElementById("editBtn").addEventListener("click", () => {
  const capa = document.getElementById("detalheCapa");
  const nome = document.getElementById("detalheNome");
  const nota = document.getElementById("detalheNota");
  const detalheBody = document.querySelector(".detalhe-body");
  if (!animeAtual) return;
  const EDIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/></svg>`;
  const SAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M256 416.1L131.3 291.3L86.06 336.6L256 506.5L553.9 208.6L508.7 163.4L256 416.1z"/></svg>`;
  if (!editMode) {
    // Nome e nota editáveis sobre o hero (fundo escuro, texto branco)
    nome.innerHTML = `<input type="text" id="editNome" class="detalhe-edit-input detalhe-edit-nome" value="${animeAtual.nome}">`;
    nota.innerHTML = `<input type="number" id="editNota" class="detalhe-edit-input detalhe-edit-nota" value="${animeAtual.nota}" min="0" max="10" step="0.1">`;
    // Capa e data no corpo do modal
    const dataAtual = animeAtual.dataCriacao
      ? new Date(animeAtual.dataCriacao).toISOString().slice(0, 10)
      : new Date(animeAtual.id).toISOString().slice(0, 10);
    detalheBody.insertAdjacentHTML("afterbegin", `
      <div class="edit-fields-group">
        <input type="text" id="editCapa" class="edit-capa-input" value="${animeAtual.capa}" placeholder="URL da capa">
        <div class="edit-data-wrap">
          <label class="edit-data-label">📅 Data de adição</label>
          <input type="date" id="editData" class="edit-capa-input" value="${dataAtual}">
        </div>
      </div>
    `);
    document.getElementById("editBtn").innerHTML = SAVE_SVG;
    document.getElementById("editBtn").classList.add("saving");
    editMode = true;
  } else {
    animeAtual.nome = document.getElementById("editNome").value;
    animeAtual.nota = document.getElementById("editNota").value;
    animeAtual.capa = document.getElementById("editCapa").value;
    animeAtual.observacao = document.getElementById("detalheObs").value;
    const editDataVal = document.getElementById("editData") ? document.getElementById("editData").value : null;
    if (editDataVal) animeAtual.dataCriacao = new Date(editDataVal + "T12:00:00").getTime();
    localStorage.setItem("animes", JSON.stringify(animes));
    document.querySelector(".edit-fields-group")?.remove();
    nome.textContent = animeAtual.nome;
    nota.textContent = "⭐ " + animeAtual.nota + " / 10";
    capa.src = animeAtual.capa;
    renderizarAnimes();
    document.getElementById("editBtn").innerHTML = EDIT_SVG;
    document.getElementById("editBtn").classList.remove("saving");
    editMode = false;
  }
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (!animeAtual || !confirm("Tem certeza?")) return;
  animes = animes.filter(a => a.id !== animeAtual.id);
  localStorage.setItem("animes", JSON.stringify(animes));
  renderizarAnimes();
  modalDetalhe.style.display = "none";
  animeAtual = null;
});

document.getElementById("detalheObs").addEventListener("input", () => {
  if (!animeAtual) return;
  animeAtual.observacao = document.getElementById("detalheObs").value;
  localStorage.setItem("animes", JSON.stringify(animes));
});

// ======== COMPARTILHAR ========
let animeParaCompartilhar = null;

function abrirMenuCompartilhar(anime) {
  animeParaCompartilhar = anime;
  // Popular preview
  const prev = document.getElementById("shareAnimePreview");
  prev.innerHTML = `
    <img src="${anime.capa}" onerror="this.src='https://via.placeholder.com/48x68?text=?'">
    <div class="share-anime-preview-info">
      <strong>${anime.nome}</strong>
      <span>⭐ ${anime.nota}/10</span>
    </div>
  `;
  document.getElementById("shareOverlay").style.display = "flex";
}

document.getElementById("shareOverlay").addEventListener("click", e => {
  if (e.target === document.getElementById("shareOverlay")) fecharShareMenu();
});
document.getElementById("shareClose").addEventListener("click", fecharShareMenu);

function fecharShareMenu() {
  document.getElementById("shareOverlay").style.display = "none";
  animeParaCompartilhar = null;
}

// ── Compartilhar como TEXTO ──
document.getElementById("shareBtnTexto").addEventListener("click", async () => {
  if (!animeParaCompartilhar) return;
  const a = animeParaCompartilhar;
  const msg = `Terminei ${a.nome} e acho que ele merece ${a.nota}/10! Já deixei tudo registrado no Okiru ⛩️`;
  if (navigator.share) {
    try {
      await navigator.share({ text: msg });
    } catch(e) { /* cancelado pelo usuário */ }
  } else {
    await navigator.clipboard.writeText(msg);
    mostrarToast("Texto copiado! Cole onde quiser 📋");
  }
  fecharShareMenu();
});

// ── Compartilhar como IMAGEM — step 2 (seleção de badges) ──
let _shareTipo = null; // "story" | "xpost"

function irParaStep2(tipo) {
  if (!animeParaCompartilhar) return;
  _shareTipo = tipo;

  const badges = window.Badges ? window.Badges.getBadgesDisponiveisParaCompartilhar(animeParaCompartilhar) : [];
  const lista  = document.getElementById("shareBadgeList");
  lista.innerHTML = "";

  if (badges.length === 0) {
    lista.innerHTML = '<p class="share-badge-empty">Esse anime não tem badges ainda 😢</p>';
  } else {
    badges.forEach(badge => {
      const imgSrc = window.Badges._resolverUrl ? window.Badges._resolverUrl(badge.img) : badge.img;
      const item = document.createElement("label");
      item.className = "share-badge-item";
      const isManual = !badge.check; // badges manuais não têm função check
      const fmtClass = badge.formato === 'redondo' ? ' badge--redondo' : ' badge--livre';
      item.innerHTML = `
        <input type="checkbox" class="share-badge-check" value="${badge.id}" ${isManual ? '' : 'checked'}>
        <div class="share-badge-item-inner">
          <img class="share-badge-item-img${fmtClass}" src="${imgSrc}" alt="${badge.nome}" onerror="this.style.display='none'">
          <div class="share-badge-item-info">
            <strong>${badge.nome}</strong>
            <span>${badge.desc || ""}</span>
          </div>
          <div class="share-badge-item-toggle"></div>
        </div>
      `;
      lista.appendChild(item);
    });
  }

  document.getElementById("shareStep1").style.display = "none";
  document.getElementById("shareStep2").style.display = "block";
}

function voltarStep1() {
  document.getElementById("shareStep1").style.display = "block";
  document.getElementById("shareStep2").style.display = "none";
  _shareTipo = null;
}

document.getElementById("shareStep2Back").addEventListener("click", voltarStep1);

document.getElementById("shareGerarBtn").addEventListener("click", () => {
  if (!animeParaCompartilhar) return;
  const anime = animeParaCompartilhar;

  // Coleta IDs das badges marcadas
  const selecionadas = [...document.querySelectorAll(".share-badge-check:checked")].map(el => el.value);
  anime._badgesSelecionadas = selecionadas.length > 0 ? selecionadas : null;

  const tipo = _shareTipo;
  fecharShareMenu(); // fecha e limpa animeParaCompartilhar
  voltarStep1();     // reseta step para próxima vez

  if (tipo === "story") {
    abrirStoryPreview(anime);
  } else {
    abrirXPostPreview(anime);
  }
});

// Também resetar o step ao fechar manualmente
const _origFecharShare = fecharShareMenu;
fecharShareMenu = function() {
  _origFecharShare();
  voltarStep1();
};

document.getElementById("shareBtnStory").addEventListener("click", () => {
  if (!animeParaCompartilhar) return;
  irParaStep2("story");
});

document.getElementById("shareBtnXPost").addEventListener("click", () => {
  if (!animeParaCompartilhar) return;
  irParaStep2("xpost");
});

document.getElementById("xPostPreviewOverlay").addEventListener("click", e => {
  if (e.target === document.getElementById("xPostPreviewOverlay")) fecharXPostPreview();
});
document.getElementById("xPostPreviewClose").addEventListener("click", fecharXPostPreview);

function fecharXPostPreview() {
  document.getElementById("xPostPreviewOverlay").style.display = "none";
}

function abrirXPostPreview(anime) {
  window._lastAnimeXPost = anime;
  const nota = parseFloat(anime.nota) || 0;
  const estrelas = Math.round((nota / 10) * 5);
  const strEstrelas = "★".repeat(estrelas) + "☆".repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : null;
  const studio = anime.studio || null;
  const sinopse = anime.sinopse || null;

  const overlay = document.getElementById("xPostPreviewOverlay");
  const card    = document.getElementById("xPostCard");

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
      ${ano || studio ? `<p class="story-meta">${[ano, studio ? '🎬 ' + studio : null].filter(Boolean).join('  ·  ')}</p>` : ''}
      <p class="story-avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="story-estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="story-sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="story-footer">⛩️  okiru</div>
  `;

  overlay.style.display = "flex";
}

document.getElementById("xPostDownloadBtn").addEventListener("click", () => {
  const anime = animeParaCompartilhar || window._lastAnimeXPost;
  if (!anime) return;
  abrirXPostNova(anime);
});

function abrirXPostNova(anime) {
  const nota = parseFloat(anime.nota) || 0;
  const estrelas = Math.round((nota / 10) * 5);
  const strEstrelas = "★".repeat(estrelas) + "☆".repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : "";
  const studio = anime.studio || "";
  const sinopse = anime.sinopse || "";
  const metaLine = [ano, studio ? "🎬 " + studio : ""].filter(Boolean).join("  ·  ");

  // Proporção 1004x1743 → mantemos escala visual com width=502px (metade) para tela
  // O card terá aspect-ratio 1004/1743 ≈ 0.576
  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Okiru — ${anime.nome} (Post X)</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #0a0a14;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh;
      font-family: 'Nunito', sans-serif;
      padding: 20px;
      gap: 16px;
    }
    p.instrucao {
      color: rgba(255,255,255,0.5);
      font-size: 13px; text-align: center;
      font-family: 'Nunito', sans-serif;
    }
    /* Card com proporção 1004x1743 */
    .card {
      width: 502px;
      height: 872px; /* 502 * 1743/1004 ≈ 872 */
      background: linear-gradient(160deg, #1a1c2e 0%, #16182a 50%, #0f1117 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.8);
    }
    .card::before {
      content: '';
      position: absolute; top: -80px; right: -80px;
      width: 320px; height: 320px; border-radius: 50%;
      background: radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%);
    }
    .card::after {
      content: '';
      position: absolute; bottom: -60px; left: -60px;
      width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, rgba(108,122,224,0.25) 0%, transparent 70%);
    }
    .header {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center;
      gap: 10px; z-index: 10;
      padding: 18px 0 14px;
      background: rgba(15,17,23,0.6);
      backdrop-filter: blur(8px);
    }
    .header-icon { font-size: 22px; }
    .header-name { font-size: 22px; font-weight: 800; color: white; letter-spacing: 0.5px; }
    .capa-wrap {
      position: absolute; top: 0; left: 0; right: 0;
      height: 55%; z-index: 1;
    }
    .capa-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .capa-fade {
      position: absolute; bottom: 0; left: 0; right: 0; height: 75%;
      background: linear-gradient(to bottom, transparent 0%, #0f1117 100%);
    }
    .content {
      position: absolute;
      bottom: 52px; left: 0; right: 0;
      padding: 0 28px; z-index: 5;
    }
    .nome {
      font-size: 34px; font-weight: 900;
      color: #fff; line-height: 1.15; margin-bottom: 8px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.6);
    }
    .meta { font-size: 13px; color: #a78bfa; font-weight: 700; margin-bottom: 12px; }
    .avaliacao { font-size: 17px; color: rgba(255,255,255,0.85); margin-bottom: 4px; }
    .avaliacao strong { color: #fff; font-size: 20px; }
    .estrelas { font-size: 26px; letter-spacing: 3px; color: #f59e0b; margin-bottom: 12px; }
    .sinopse {
      font-size: 13px; color: rgba(255,255,255,0.55);
      line-height: 1.6;
      display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }
    .footer {
      position: absolute; bottom: 16px; left: 0; right: 0;
      text-align: center; z-index: 5;
      font-size: 14px; font-weight: 800;
      color: rgba(108,122,224,0.7); letter-spacing: 1px;
    }
    .x-badge {
      position: absolute; top: 18px; right: 20px; z-index: 15;
      font-size: 20px; font-weight: 900;
      color: rgba(255,255,255,0.85);
      font-family: 'Nunito', sans-serif;
    }
  </style>
</head>
<body>
  <p class="instrucao">Clique com botão direito na imagem → Salvar imagem<br>ou tire um screenshot 📸</p>
  <div class="card">
    <div class="header">
      <span class="header-icon">⛩️</span>
      <span class="header-name">Okiru</span>
    </div>
    <span class="x-badge">𝕏</span>
    <div class="capa-wrap">
      <img class="capa-img" src="${anime.capa}" onerror="this.style.display='none'">
      <div class="capa-fade"></div>
    </div>
    <div class="content">
      <h2 class="nome">${anime.nome}</h2>
      ${metaLine ? `<p class="meta">${metaLine}</p>` : ""}
      <p class="avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="sinopse">${sinopse}</p>` : ""}
    </div>
    <div class="footer">⛩️  okiru</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function abrirStoryPreview(anime) {
  window._lastAnimeStory = anime; // guarda para o botão de download
  const nota = parseFloat(anime.nota) || 0;
  const estrelas = Math.round((nota / 10) * 5);
  const strEstrelas = "★".repeat(estrelas) + "☆".repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : null;
  const studio = anime.studio || null;
  const sinopse = anime.sinopse || null;

  const overlay = document.getElementById("storyPreviewOverlay");
  const card    = document.getElementById("storyCard");

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
      ${ano || studio ? `<p class="story-meta">${[ano, studio ? '🎬 ' + studio : null].filter(Boolean).join('  ·  ')}</p>` : ''}
      <p class="story-avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="story-estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="story-sinopse">${sinopse}</p>` : ''}
    </div>
    <div class="story-footer">⛩️ okiru</div>
  `;

  overlay.style.display = "flex";
}

document.getElementById("storyPreviewOverlay").addEventListener("click", e => {
  if (e.target === document.getElementById("storyPreviewOverlay")) fecharStoryPreview();
});
document.getElementById("storyPreviewClose").addEventListener("click", fecharStoryPreview);

function fecharStoryPreview() {
  document.getElementById("storyPreviewOverlay").style.display = "none";
}

document.getElementById("storyDownloadBtn").addEventListener("click", () => {
  const anime = animeParaCompartilhar || window._lastAnimeStory;
  if (!anime) return;
  abrirStoryNova(anime);
});

function abrirStoryNova(anime) {
  const nota = parseFloat(anime.nota) || 0;
  const estrelas = Math.round((nota / 10) * 5);
  const strEstrelas = "★".repeat(estrelas) + "☆".repeat(5 - estrelas);
  const ano    = anime.ano    ? String(anime.ano) : "";
  const studio = anime.studio || "";
  const sinopse = anime.sinopse || "";
  const metaLine = [ano, studio ? "🎬 " + studio : ""].filter(Boolean).join("  ·  ");

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Okiru — ${anime.nome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #0a0a14;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh;
      font-family: 'Nunito', sans-serif;
      padding: 20px;
      gap: 20px;
    }
    p.instrucao {
      color: rgba(255,255,255,0.5);
      font-size: 13px; text-align: center;
      font-family: 'Nunito', sans-serif;
    }
    .card {
      width: 360px;
      height: 640px;
      background: linear-gradient(160deg, #1a1c2e 0%, #16182a 50%, #0f1117 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.8);
    }
    .card::before {
      content: '';
      position: absolute; top: -80px; right: -80px;
      width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%);
    }
    .card::after {
      content: '';
      position: absolute; bottom: -60px; left: -60px;
      width: 240px; height: 240px; border-radius: 50%;
      background: radial-gradient(circle, rgba(108,122,224,0.25) 0%, transparent 70%);
    }
    .header {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center;
      gap: 8px; z-index: 10;
      padding: 14px 0 12px;
      background: rgba(15,17,23,0.6);
      backdrop-filter: blur(8px);
    }
    .header-icon { font-size: 18px; }
    .header-name { font-size: 18px; font-weight: 800; color: white; letter-spacing: 0.5px; }
    .capa-wrap {
      position: absolute; top: 0; left: 0; right: 0;
      height: 58%; z-index: 1;
    }
    .capa-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .capa-fade {
      position: absolute; bottom: 0; left: 0; right: 0; height: 75%;
      background: linear-gradient(to bottom, transparent 0%, #0f1117 100%);
    }
    .content {
      position: absolute;
      bottom: 44px; left: 0; right: 0;
      padding: 0 20px; z-index: 5;
    }
    .nome {
      font-size: 26px; font-weight: 900;
      color: #fff; line-height: 1.15; margin-bottom: 5px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.6);
    }
    .meta { font-size: 11px; color: #a78bfa; font-weight: 700; margin-bottom: 8px; }
    .avaliacao { font-size: 14px; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
    .avaliacao strong { color: #fff; font-size: 16px; }
    .estrelas { font-size: 20px; letter-spacing: 2px; color: #f59e0b; margin-bottom: 8px; }
    .sinopse {
      font-size: 10.5px; color: rgba(255,255,255,0.55);
      line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
    }
    .footer {
      position: absolute; bottom: 12px; left: 0; right: 0;
      text-align: center; z-index: 5;
      font-size: 12px; font-weight: 800;
      color: rgba(108,122,224,0.7); letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <p class="instrucao">Clique com botão direito na imagem → Salvar imagem<br>ou tire um screenshot 📸</p>
  <div class="card">
    <div class="header">
      <span class="header-icon">⛩️</span>
      <span class="header-name">Okiru</span>
    </div>
    <div class="capa-wrap">
      <img class="capa-img" src="${anime.capa}" onerror="this.style.display='none'">
      <div class="capa-fade"></div>
    </div>
    <div class="content">
      <h2 class="nome">${anime.nome}</h2>
      ${metaLine ? `<p class="meta">${metaLine}</p>` : ""}
      <p class="avaliacao">Minha avaliação: <strong>${nota}/10</strong></p>
      <p class="estrelas">${strEstrelas}</p>
      ${sinopse ? `<p class="sinopse">${sinopse}</p>` : ""}
    </div>
    <div class="footer">⛩️  okiru</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}


// ======== PRÓXIMAS TEMPORADAS ========
const PROXIMAS_CACHE_KEY = "okiru_proximas_cache";
const PROXIMAS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const JIKAN_DELAY        = 420; // ms entre requisições (rate limit ~3/s)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Formata data de estreia
function formatarDataEstreia(aired) {
  if (!aired?.from) return null;
  try {
    const d = new Date(aired.from);
    if (isNaN(d)) return null;
    // Se for no futuro ou até 3 meses atrás considera relevante
    const diffMs = d - Date.now();
    if (diffMs < -90 * 24 * 60 * 60 * 1000) return null; // muito antigo
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return null; }
}

// Busca ID MAL de um anime pelo nome
async function buscarIdMal(nome) {
  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(nome)}&limit=1&sfw`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.mal_id || null;
  } catch { return null; }
}

// Busca relações de um anime (sequels)
async function buscarRelacoes(malId) {
  try {
    const url = `https://api.jikan.moe/v4/anime/${malId}/relations`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    // Filtra só Sequel
    const sequels = [];
    for (const rel of (json.data || [])) {
      if (rel.relation === "Sequel") {
        for (const entry of (rel.entry || [])) {
          if (entry.type === "anime") sequels.push(entry.mal_id);
        }
      }
    }
    return sequels;
  } catch { return []; }
}

// Busca detalhes de um anime pelo ID
async function buscarDetalhesAnime(malId) {
  try {
    const url = `https://api.jikan.moe/v4/anime/${malId}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

// Verifica se um status é relevante (airing ou upcoming)
function statusRelevante(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes("airing") || s.includes("not yet aired") || s.includes("upcoming");
}

async function verificarProximasTemporadas() {
  if (animes.length === 0) {
    mostrarToast("Adicione animes à sua lista primeiro!");
    return;
  }

  const btn        = document.getElementById("proximasVerificarBtn");
  const loading    = document.getElementById("proximasLoading");
  const fill       = document.getElementById("proximasLoadingFill");
  const texto      = document.getElementById("proximasLoadingTexto");
  const resultados = document.getElementById("proximasResultados");
  const vazio      = document.getElementById("proximasVazio");
  const footer     = document.getElementById("proximasFooter");
  const footerInfo = document.getElementById("proximasCacheInfo");

  // Mostra loading, esconde o resto
  btn.disabled = true;
  btn.textContent = "Verificando…";
  loading.style.display    = "block";
  resultados.style.display = "none";
  vazio.style.display      = "none";
  footer.style.display     = "none";
  fill.style.width         = "0%";

  const encontrados = [];
  // Só verifica animes das listas "assistindo" e "assistidos"
  const alvo = animes.filter(a => a.status === "assistindo" || a.status === "assistidos");
  const total = alvo.length;

  for (let i = 0; i < total; i++) {
    const anime = alvo[i];
    const pct   = Math.round(((i + 1) / total) * 100);
    fill.style.width  = pct + "%";
    texto.textContent = `Verificando "${anime.nome.length > 28 ? anime.nome.slice(0,28)+"…" : anime.nome}" (${i+1}/${total})`;

    try {
      // 1. Acha o ID no MAL
      const malId = await buscarIdMal(anime.nome);
      await sleep(JIKAN_DELAY);
      if (!malId) continue;

      // 2. Busca relações (sequels)
      const sequelIds = await buscarRelacoes(malId);
      await sleep(JIKAN_DELAY);
      if (sequelIds.length === 0) continue;

      // 3. Para cada sequel, verifica status
      for (const sId of sequelIds) {
        const detalhe = await buscarDetalhesAnime(sId);
        await sleep(JIKAN_DELAY);
        if (!detalhe) continue;

        if (statusRelevante(detalhe.status)) {
          const dataStr   = formatarDataEstreia(detalhe.aired);
          const isAiring  = detalhe.status?.toLowerCase().includes("airing") &&
                            !detalhe.status?.toLowerCase().includes("not yet");
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

  // Esconde loading
  loading.style.display = "none";
  btn.disabled          = false;
  btn.textContent       = "Verificar";

  // Exibe resultados
  if (encontrados.length > 0) {
    resultados.innerHTML = encontrados.map((item, idx) => `
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
              : ""}
          </div>
        </div>
        <span class="proximas-card-arrow">›</span>
      </a>
    `).join("");
    resultados.style.display = "flex";

    // Salva cache
    const cache = { ts: Date.now(), dados: encontrados };
    localStorage.setItem(PROXIMAS_CACHE_KEY, JSON.stringify(cache));
  } else {
    vazio.style.display = "flex";
  }

  // Rodapé
  footerInfo.textContent = `Atualizado agora • ${total} anime${total !== 1 ? "s" : ""} verificado${total !== 1 ? "s" : ""}`;
  footer.style.display   = "flex";
}

function carregarCacheProximas() {
  const fechado = localStorage.getItem("okiru_proximas_fechado") === "1";
  if (fechado) {
    document.getElementById("proximasCorpo").classList.add("proximas-corpo-fechado");
    const btn = document.getElementById("proximasFecharBtn");
    btn.textContent = "＋";
    btn.title       = "Expandir";
  }
  try {
    const raw = localStorage.getItem(PROXIMAS_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (!cache?.dados || !cache?.ts) return;

    const idadeMs   = Date.now() - cache.ts;
    const idadeHrs  = Math.floor(idadeMs / (1000 * 60 * 60));
    const expirado  = idadeMs > PROXIMAS_CACHE_TTL;

    const resultados = document.getElementById("proximasResultados");
    const footer     = document.getElementById("proximasFooter");
    const footerInfo = document.getElementById("proximasCacheInfo");
    const vazio      = document.getElementById("proximasVazio");

    if (cache.dados.length === 0) {
      if (!expirado) {
        vazio.style.display  = "flex";
        footer.style.display = "flex";
        footerInfo.textContent = `Cache de ${idadeHrs}h atrás`;
      }
      return;
    }

    resultados.innerHTML = cache.dados.map((item, idx) => `
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
              : ""}
          </div>
        </div>
        <span class="proximas-card-arrow">›</span>
      </a>
    `).join("");

    resultados.style.display = "flex";
    footer.style.display     = "flex";
    const labelTempo = idadeHrs < 1 ? "menos de 1h atrás" : `${idadeHrs}h atrás`;
    footerInfo.textContent   = `Cache de ${labelTempo}${expirado ? " (desatualizado)" : ""}`;
  } catch (_) { /* cache corrompido — ignora */ }
}

// Evento: botão fechar — recolhe o conteúdo, mantém o header
document.getElementById("proximasFecharBtn").addEventListener("click", () => {
  const corpo    = document.getElementById("proximasCorpo");
  const btn      = document.getElementById("proximasFecharBtn");
  const fechado  = corpo.classList.toggle("proximas-corpo-fechado");
  btn.textContent = fechado ? "＋" : "✕";
  btn.title       = fechado ? "Expandir" : "Recolher";
  localStorage.setItem("okiru_proximas_fechado", fechado ? "1" : "0");
});

// Evento: botão verificar
document.getElementById("proximasVerificarBtn").addEventListener("click", verificarProximasTemporadas);

// Evento: botão atualizar (limpa cache e re-verifica)
document.getElementById("proximasAtualizarBtn").addEventListener("click", () => {
  localStorage.removeItem(PROXIMAS_CACHE_KEY);
  document.getElementById("proximasResultados").style.display = "none";
  document.getElementById("proximasVazio").style.display      = "none";
  document.getElementById("proximasFooter").style.display     = "none";
  verificarProximasTemporadas();
});

// Carrega cache ao iniciar
carregarCacheProximas();

// ── Toast de feedback ──
function mostrarToast(msg) {
  let t = document.getElementById("toastMsg");
  if (!t) {
    t = document.createElement("div");
    t.id = "toastMsg";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("toast-show");
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove("toast-show"), 2800);
}

// ======== SETTINGS ========
let usuario = JSON.parse(localStorage.getItem("usuario")) || { nome: "Marcos Duarte", foto: "https://i.imgur.com/6VBx3io.png", darkMode: false };
function aplicarUsuario() {
  const hNome = document.querySelector(".perfil-text h2");
  const hImg  = document.querySelector(".perfil-avatar-ring img");
  if (hNome) hNome.textContent = usuario.nome;
  if (hImg)  hImg.src = usuario.foto;
  document.body.classList.toggle("dark", usuario.darkMode);
  document.getElementById("darkModeToggle").checked = usuario.darkMode;
}
aplicarUsuario();

const paginaPrincipal = document.getElementById("paginaPrincipal");
const paginaSettings  = document.getElementById("paginaSettings");
const btnAddFloat     = document.querySelector(".btn-add");

function setSidebarActive(id) {
  document.querySelectorAll(".sidebar .icon").forEach(i => i.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.getElementById("btnSettings").addEventListener("click", () => {
  setSidebarActive("btnSettings");
  paginaPrincipal.classList.add("esconder");
  paginaSettings.style.display = "flex";
  btnAddFloat.classList.add("esconder");
  document.getElementById("novoNome").value = usuario.nome;
  document.getElementById("novaFoto").value = usuario.foto;
  const prev = document.getElementById("settingsAvatarPreview");
  if (prev) prev.src = usuario.foto;
});

document.getElementById("novaFoto").addEventListener("input", e => {
  const val = e.target.value.trim();
  if (val) document.getElementById("settingsAvatarPreview").src = val;
});

// Botão Galeria — abre seletor de arquivo
document.getElementById("btnGaleria").addEventListener("click", () => {
  document.getElementById("fotoFileInput").click();
});

document.getElementById("fotoFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    document.getElementById("novaFoto").value = dataUrl;
    document.getElementById("settingsAvatarPreview").src = dataUrl;
  };
  reader.readAsDataURL(file);
});

// ======== ESTATÍSTICAS ========
const paginaStats = document.getElementById("paginaStats");

document.getElementById("btnStats").addEventListener("click", () => {
  setSidebarActive("btnStats");
  paginaPrincipal.classList.add("esconder");
  paginaSettings.style.display = "none";
  paginaStats.style.display = "flex";
  btnAddFloat.classList.add("esconder");
  renderizarStats();
});

function renderizarStats() {
  const agora = new Date();
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // Subtitle
  document.getElementById("statsSubtitle").textContent = "Resumo da sua jornada no Okiru";

  // ── Seção 1: Animes do mês ──
  document.getElementById("statsMesNome").textContent = meses[mesAtual] + " " + anoAtual;
  const inicioMes = new Date(anoAtual, mesAtual, 1).getTime();
  const animesDoMes = animes.filter(a => (a.dataCriacao || a.id) >= inicioMes);
  const mesLista = document.getElementById("statsMesLista");
  if (animesDoMes.length === 0) {
    mesLista.innerHTML = "<p class='stats-empty'>Nenhum anime adicionado este mês ainda.</p>";
  } else {
    mesLista.innerHTML = animesDoMes.map(a => `
      <div class="stats-mes-item">
        <img src="${a.capa}" onerror="this.style.display='none'">
        <div class="stats-mes-info">
          <strong>${a.nome}</strong>
          <span>${a.status === 'assistindo' ? '▶ Assistindo' : a.status === 'assistidos' ? '✅ Assistido' : '🕐 Para assistir'}</span>
        </div>
        <span class="stats-mes-nota">⭐ ${a.nota}</span>
      </div>
    `).join("");
  }

  // ── Seção 2: Gêneros ──
  const generoCount = {};
  animes.forEach(a => {
    if (a.generos && Array.isArray(a.generos)) {
      a.generos.forEach(g => {
        generoCount[g] = (generoCount[g] || 0) + 1;
      });
    }
  });
  const generosEl = document.getElementById("statsGeneros");
  const generosSorted = Object.entries(generoCount).sort((a,b) => b[1]-a[1]).slice(0, 7);
  if (generosSorted.length === 0) {
    generosEl.innerHTML = "<p class='stats-empty'>Adicione animes pela busca para ver seus gêneros!</p>";
  } else {
    const maxCount = generosSorted[0][1];
    const cores = ["#6c7ae0","#a78bfa","#34d399","#f59e0b","#f87171","#60a5fa","#fb923c"];
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
    }).join("");
  }

  // ── Seção 3: Preferência de duração ──
  const assistidos = animes.filter(a => a.status === "assistidos" && a.totalEps > 0);
  const duracaoEl = document.getElementById("statsDuracao");
  if (assistidos.length === 0) {
    duracaoEl.innerHTML = "<p class='stats-empty'>Termine alguns animes para ver sua preferência de duração!</p>";
  } else {
    const grupos = { curto: [], medio: [], longo: [], muito: [] };
    assistidos.forEach(a => {
      const eps = parseInt(a.totalEps);
      if (eps <= 13) grupos.curto.push(a);
      else if (eps <= 26) grupos.medio.push(a);
      else if (eps <= 52) grupos.longo.push(a);
      else grupos.muito.push(a);
    });
    const maiorGrupo = Object.entries(grupos).sort((a,b) => b[1].length - a[1].length)[0];
    const labels = { curto: "até 13 episódios", medio: "entre 14 e 26 episódios", longo: "entre 27 e 52 episódios", muito: "mais de 52 episódios" };
    const emojis = { curto: "😛", medio: "😎", longo: "🔥", muito: "🏆" };
    const exemplos = maiorGrupo[1].slice(0, 3).map(a => a.nome).join(", ");
    duracaoEl.innerHTML = `
      <div class="stats-duracao-icon">${emojis[maiorGrupo[0]]}</div>
      <p class="stats-duracao-texto">Parece que você gosta de animes com <strong>${labels[maiorGrupo[0]]}</strong></p>
      <p class="stats-duracao-exemplos">Tipo <em>${exemplos}</em></p>
    `;
  }

  // ── Seção 4: Tempo total assistido ──
  let totalMinutos = 0;
  animes.forEach(a => {
    const eps = parseInt(a.assistidosEps) || 0;
    totalMinutos += eps * 24; // média de 24 min por episódio
  });
  const tempoEl = document.getElementById("statsTempo");
  const formatarTempo = (min) => {
    const dias = Math.floor(min / (60 * 24));
    const horas = Math.floor((min % (60 * 24)) / 60);
    const minutos = min % 60;
    if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''}, ${horas}h e ${minutos}min`;
    if (horas > 0) return `${horas}h e ${minutos}min`;
    return `${minutos} minutos`;
  };
  const tempoFormatado = formatarTempo(totalMinutos);
  const tempoMsg = totalMinutos === 0
    ? "<p class='stats-empty'>Registre episódios assistidos para calcular seu tempo!</p>"
    : `
      <div class="stats-tempo-icon">⏱️</div>
      <p class="stats-tempo-label">Tempo total assistindo animes desde que você entrou no Okiru</p>
      <p class="stats-tempo-valor">${tempoFormatado}</p>
      <p class="stats-tempo-eps">Baseado em ${animes.reduce((s,a) => s + (parseInt(a.assistidosEps)||0), 0)} episódios · ~24min cada</p>
    `;
  tempoEl.innerHTML = tempoMsg;

  // ── Dados salvos ──
  const storageEl = document.getElementById("statsStorage");
  if (storageEl) {
    // Calcula tamanho de todas as chaves do localStorage do Okiru
    const keys = ["animes", "usuario", "okiru_tutorial_done"];
    let totalBytes = 0;
    const itens = [];
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const bytes = new Blob([val]).size;
        totalBytes += bytes;
        const labels = { animes: "Lista de animes", usuario: "Perfil do usuário", okiru_tutorial_done: "Tutorial" };
        itens.push({ label: labels[key] || key, bytes });
      }
    });

    const formatBytes = (b) => {
      if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
      if (b >= 1024)        return (b / 1024).toFixed(1) + " KB";
      return b + " B";
    };

    // Limite estimado do localStorage (5MB)
    const LIMIT = 5 * 1024 * 1024;
    const pct = Math.min((totalBytes / LIMIT) * 100, 100).toFixed(1);

    const cores = ["#6c7ae0", "#a78bfa", "#34d399"];
    const barras = itens.map((item, i) => {
      const p = ((item.bytes / LIMIT) * 100).toFixed(2);
      return `
        <div class="stats-storage-row">
          <span class="stats-storage-label">${item.label}</span>
          <div class="stats-genero-bar-wrap">
            <div class="stats-genero-bar" style="width:${Math.max(p, 0.5)}%;background:${cores[i % cores.length]}"></div>
          </div>
          <span class="stats-storage-size">${formatBytes(item.bytes)}</span>
        </div>`;
    }).join("");

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

function voltarHome() {
  setSidebarActive("btnHome");
  paginaSettings.style.display = "none";
  paginaStats.style.display = "none";
  paginaPrincipal.classList.remove("esconder");
  btnAddFloat.classList.remove("esconder");
}
document.getElementById("btnHome").addEventListener("click", voltarHome);
document.getElementById("btnVoltarSettings").addEventListener("click", voltarHome);
document.getElementById("salvarSettings").addEventListener("click", () => {
  usuario.nome = document.getElementById("novoNome").value;
  usuario.foto = document.getElementById("novaFoto").value;
  usuario.darkMode = document.getElementById("darkModeToggle").checked;
  localStorage.setItem("usuario", JSON.stringify(usuario));
  aplicarUsuario();
  const btn = document.getElementById("salvarSettings");
  const orig = btn.textContent;
  btn.textContent = "✓ Salvo!";
  btn.style.background = "linear-gradient(135deg,#34d399,#059669)";
  setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 1800);
});

// ======== BUSCA (Jikan) ========
const searchOverlay = document.getElementById("searchOverlay");
const searchInput   = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchLabel   = document.getElementById("searchLabel");

document.getElementById("btnSearch").addEventListener("click", () => {
  setSidebarActive("btnSearch");
  searchOverlay.style.display = "flex";
  searchInput.focus();
});
document.getElementById("btnCloseSearch").addEventListener("click", fecharBusca);
searchOverlay.addEventListener("click", e => { if (e.target === searchOverlay) fecharBusca(); });

function fecharBusca() {
  setSidebarActive("btnHome");
  searchOverlay.style.display = "none";
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchLabel.textContent = "Resultados";
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (!q) { searchResults.innerHTML = ""; searchLabel.textContent = "Resultados"; return; }
  searchTimeout = setTimeout(() => buscarAnime(q), 700);
});

async function buscarAnime(query) {
  searchResults.innerHTML = `<div class="search-spinner">🔍 Buscando<span class="dots"></span></div>`;
  searchLabel.textContent = "Buscando...";
  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderResults(json.data || []);
  } catch(err) {
    searchResults.innerHTML = `<div class="search-spinner">❌ Erro ao buscar. Verifique sua conexão.</div>`;
    searchLabel.textContent = "Resultados";
  }
}

function renderResults(data) {
  searchResults.innerHTML = "";
  if (!data.length) { searchLabel.textContent = "Nenhum resultado encontrado"; return; }
  searchLabel.textContent = `Resultados (${data.length})`;
  data.forEach(anime => {
    const item   = document.createElement("div");
    item.classList.add("search-result-item");
    const thumb  = anime.images?.jpg?.image_url || "";
    const studio = anime.studios?.[0]?.name || "Estúdio desconhecido";
    const score  = anime.score ? `⭐ ${parseFloat(anime.score).toFixed(1)}` : "Sem nota";
    const eps    = anime.episodes ? `${anime.episodes} eps` : "N/A";
    const title  = anime.title_portuguese || anime.title_english || anime.title || "";
    item.innerHTML = `
      <img src="${thumb}" alt="${title}" onerror="this.style.background='#e0e0e0';this.src=''">
      <div style="flex:1;min-width:0">
        <div class="r-title">${title}</div>
        <div class="r-meta">${studio} · ${eps}</div>
        <div class="r-score">${score}</div>
      </div>
      <span style="color:#bbb;font-size:18px;flex-shrink:0">›</span>`;
    item.addEventListener("click", () => abrirDetalheAnime(anime));
    searchResults.appendChild(item);
  });
}

const searchDetailOverlay = document.getElementById("searchDetailOverlay");

function abrirDetalheAnime(anime) {
  sdAnimeData = anime;
  const title  = anime.title_portuguese || anime.title_english || anime.title || "";
  const capa   = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";
  const studio = anime.studios?.[0]?.name || "Estúdio desconhecido";
  const desc   = anime.synopsis ? anime.synopsis.replace("[Written by MAL Rewrite]", "").trim() : "Sem descrição disponível.";
  const eps    = anime.episodes || 0;

  document.getElementById("sdTitle").textContent   = title;
  document.getElementById("sdImage").src           = capa;
  document.getElementById("sdStudio").textContent  = "🎬 " + studio;
  document.getElementById("sdDesc").textContent    = desc;

  // Gêneros
  const sdTags = document.getElementById("sdGenerosTags");
  const generos = anime.genres || [];
  if (generos.length > 0) {
    sdTags.innerHTML = renderizarTagsGenero(generos);
    sdTags.style.display = "flex";
  } else {
    sdTags.innerHTML = "";
    sdTags.style.display = "none";
  }
  document.getElementById("sdNota").value          = anime.score ? Math.min(10, parseFloat(anime.score)).toFixed(1) : "";
  document.getElementById("sdTotalEps").value      = eps || "";
  document.getElementById("sdAssistidosEps").value = "";
  document.getElementById("sdAssistidosEps").max   = eps || 99999;

  const btn = document.getElementById("sdAddBtn");
  btn.textContent = "+ Adicionar ao Organizador"; btn.disabled = false; btn.style.background = "";
  // Define data padrão como hoje
  const sdDataEl = document.getElementById("sdDataAdicao");
  if (sdDataEl) sdDataEl.value = new Date().toISOString().slice(0, 10);
  searchDetailOverlay.style.display = "flex";
}

document.getElementById("sdClose").addEventListener("click", () => { searchDetailOverlay.style.display = "none"; sdAnimeData = null; });
searchDetailOverlay.addEventListener("click", e => { if (e.target === searchDetailOverlay) { searchDetailOverlay.style.display = "none"; sdAnimeData = null; } });

async function traduzirTexto(texto) {
  if (!texto) return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
    const res = await fetch(url);
    const json = await res.json();
    // A API retorna arrays aninhados com os fragmentos traduzidos
    return json[0].map(item => item[0]).join("");
  } catch(e) {
    console.warn("Tradução falhou, usando original:", e);
    return texto; // fallback para o inglês
  }
}

document.getElementById("sdAddBtn").addEventListener("click", async () => {
  if (!sdAnimeData) return;
  const btn = document.getElementById("sdAddBtn");
  const nota   = document.getElementById("sdNota").value || "0";
  const status = document.getElementById("sdStatus").value;
  const titulo = sdAnimeData.title_portuguese || sdAnimeData.title_english || sdAnimeData.title || "";
  const capa   = sdAnimeData.images?.jpg?.large_image_url || sdAnimeData.images?.jpg?.image_url || "";
  const totalEps = parseInt(document.getElementById("sdTotalEps").value) || 0;
  const assistidosEps = Math.min(parseInt(document.getElementById("sdAssistidosEps").value) || 0, totalEps || 99999);
  const ano    = sdAnimeData.year || sdAnimeData.aired?.prop?.from?.year || null;
  const studio = sdAnimeData.studios?.[0]?.name || null;
  const sinopseOriginal = sdAnimeData.synopsis ? sdAnimeData.synopsis.replace("[Written by MAL Rewrite]", "").trim() : null;
  const generos = sdAnimeData.genres ? sdAnimeData.genres.map(g => g.name) : [];

  if (animes.find(a => a.nome === titulo)) { alert("Este anime já está na sua lista!"); return; }

  // Traduz a sinopse antes de salvar
  btn.textContent = "⏳ Traduzindo..."; btn.disabled = true;
  const sinopse = await traduzirTexto(sinopseOriginal);

  const tipoApi = sdAnimeData.type || "";
  const isFilmeApi = tipoApi === "Movie";
  const duracao = isFilmeApi ? (sdAnimeData.duration ? parseInt(sdAnimeData.duration) || 0 : 0) : 0;
  const sdDataVal = document.getElementById("sdDataAdicao")?.value;
  const dataCriacao = sdDataVal ? new Date(sdDataVal + "T12:00:00").getTime() : Date.now();
  animes.push({ id: Date.now(), dataCriacao, nome: titulo, nota: parseFloat(nota).toFixed(1), capa, status, observacao: "", totalEps, assistidosEps, ano, studio, sinopse, generos, tipo: isFilmeApi ? "filme" : "anime", duracao });
  localStorage.setItem("animes", JSON.stringify(animes));
  renderizarAnimes();
  btn.textContent = "✅ Adicionado!"; btn.style.background = "#4caf50";
  setTimeout(() => { searchDetailOverlay.style.display = "none"; sdAnimeData = null; }, 1200);
});

// ======== EXPORTAR / IMPORTAR DADOS ========

// ── Exportar ──
document.getElementById("btnExportarDados").addEventListener("click", () => {
  const payload = {
    versao: "1.1",
    exportadoEm: new Date().toISOString(),
    usuario:       JSON.parse(localStorage.getItem("usuario")       || "{}"),
    animes:        JSON.parse(localStorage.getItem("animes")        || "[]"),
    mangas:        JSON.parse(localStorage.getItem("mangas")        || "[]"),
    mangasAdultos: JSON.parse(localStorage.getItem("mangasAdultos") || "[]"),
    ordenacao:     JSON.parse(localStorage.getItem("ordenacao")     || "null"),
    tutorial:      localStorage.getItem("okiru_tutorial_done")      || null,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `okiru-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  mostrarToast("📦 Backup exportado com sucesso!");

  // Feedback visual no botão
  const btn = document.getElementById("btnExportarDados");
  const orig = btn.innerHTML;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width:18px;height:18px;fill:white"><path d="M256 416.1L131.3 291.3L86.06 336.6L256 506.5L553.9 208.6L508.7 163.4L256 416.1z"/></svg> Exportado!`;
  btn.style.background = "linear-gradient(135deg,#34d399,#059669)";
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ""; }, 2200);
});

// ── Toggle de agendamento semanal ──
const scheduleToggle = document.getElementById("scheduleToggle");
const scheduleToast  = document.getElementById("scheduleToast");
const scheduleRow    = document.getElementById("scheduleRow");

// Restaurar estado do toggle
scheduleToggle.checked = localStorage.getItem("okiru_schedule") === "1";
if (scheduleToggle.checked) {
  scheduleToast.classList.add("visible");
  scheduleRow.classList.add("schedule-toggle-active");
}

scheduleToggle.addEventListener("change", () => {
  const ativo = scheduleToggle.checked;
  localStorage.setItem("okiru_schedule", ativo ? "1" : "0");

  if (ativo) {
    scheduleToast.classList.add("visible");
    scheduleRow.classList.add("schedule-toggle-active");
    agendarExportacao();
  } else {
    scheduleToast.classList.remove("visible");
    scheduleRow.classList.remove("schedule-toggle-active");
  }
});

// Simulação de agendamento semanal usando setTimeout (7 dias)
function agendarExportacao() {
  const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
  const ultimaExportacao = parseInt(localStorage.getItem("okiru_last_export") || "0");
  const agora = Date.now();
  const diff  = agora - ultimaExportacao;

  // Se já passou 1 semana (ou nunca exportou), agenda para agora + 1 semana
  const delay = diff >= UMA_SEMANA_MS ? UMA_SEMANA_MS : UMA_SEMANA_MS - diff;
  setTimeout(() => {
    if (localStorage.getItem("okiru_schedule") !== "1") return;
    document.getElementById("btnExportarDados").click();
    localStorage.setItem("okiru_last_export", String(Date.now()));
    agendarExportacao(); // re-agenda para a próxima semana
  }, delay);
}

// Inicializa o agendamento se o toggle estiver ativo ao carregar
if (localStorage.getItem("okiru_schedule") === "1") agendarExportacao();

// ── Importar ──
document.getElementById("importFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const dados = JSON.parse(ev.target.result);

      // Validação mínima
      if (!dados.versao || !Array.isArray(dados.animes)) {
        alert("❌ Arquivo inválido ou corrompido. Certifique-se de usar um backup gerado pelo Okiru.");
        return;
      }

      // Restaurar dados
      if (dados.animes)        localStorage.setItem("animes",        JSON.stringify(dados.animes));
      if (dados.mangas)        localStorage.setItem("mangas",        JSON.stringify(dados.mangas));
      if (dados.mangasAdultos) localStorage.setItem("mangasAdultos", JSON.stringify(dados.mangasAdultos));
      if (dados.usuario)       localStorage.setItem("usuario",       JSON.stringify(dados.usuario));
      if (dados.ordenacao)     localStorage.setItem("ordenacao",     JSON.stringify(dados.ordenacao));
      if (dados.tutorial)      localStorage.setItem("okiru_tutorial_done", dados.tutorial);

      // Aplicar na interface sem recarregar
      animes = dados.animes;
      if (dados.usuario) {
        usuario = dados.usuario;
        aplicarUsuario();
        // Atualizar campos de settings
        const campoNome = document.getElementById("novoNome");
        const campoFoto = document.getElementById("novaFoto");
        const prevImg   = document.getElementById("settingsAvatarPreview");
        if (campoNome) campoNome.value = usuario.nome || "";
        if (campoFoto) campoFoto.value = usuario.foto || "";
        if (prevImg)   prevImg.src     = usuario.foto || "";
      }
      renderizarAnimes();

      // Badge de sucesso
      const badge = document.getElementById("importSuccessBadge");
      badge.style.display = "flex";
      const totalMangas = (dados.mangas?.length || 0) + (dados.mangasAdultos?.length || 0);
      badge.innerHTML = `✅ ${dados.animes.length} anime(s)${totalMangas > 0 ? ` e ${totalMangas} mangá(s)` : ""} importados com sucesso!`;
      setTimeout(() => { badge.style.display = "none"; }, 4000);

      mostrarToast("🎌 Dados restaurados com sucesso!");

    } catch (err) {
      alert("❌ Não foi possível ler o arquivo. Verifique se é um JSON válido.");
      console.error("Erro ao importar:", err);
    }

    // Limpa o input para permitir reimportar o mesmo arquivo
    e.target.value = "";
  };
  reader.readAsText(file);
});