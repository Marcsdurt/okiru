/* ══════════════════════════════════════
   STORE — OKIRU
   Estado global da aplicação.
   Todos os outros módulos importam daqui.
══════════════════════════════════════ */

// ── Dados principais ──
window.animes    = JSON.parse(localStorage.getItem('animes')) || [];
window.animeAtual = null;

// ── Estado de UI ──
window.editMode      = false;
window.searchTimeout = null;
window.sdAnimeData   = null;
window.termoBusca    = '';
window.ordenacao     = JSON.parse(localStorage.getItem('ordenacao')) || {
  assistindo:   'recentes',
  assistidos:   'recentes',
  paraAssistir: 'recentes',
};

// ── Usuário ──
window.usuario = JSON.parse(localStorage.getItem('usuario')) || {
  nome:     'Usuário',
  foto:     'https://i.imgur.com/6VBx3io.png',
  darkMode: false,
};

// ── Helpers de persistência ──
window.salvarAnimes = function () {
  localStorage.setItem('animes', JSON.stringify(window.animes));
};

window.salvarOrdenacao = function () {
  localStorage.setItem('ordenacao', JSON.stringify(window.ordenacao));
};

window.salvarUsuario = function () {
  localStorage.setItem('usuario', JSON.stringify(window.usuario));
};

// ── Tradução de gêneros ──
const generosPT = {
  'Action': 'Ação', 'Adventure': 'Aventura', 'Comedy': 'Comédia',
  'Drama': 'Drama', 'Fantasy': 'Fantasia', 'Horror': 'Terror',
  'Mystery': 'Mistério', 'Romance': 'Romance', 'Sci-Fi': 'Ficção Científica',
  'Science Fiction': 'Ficção Científica', 'Slice of Life': 'Slice of Life',
  'Sports': 'Esportes', 'Supernatural': 'Sobrenatural', 'Thriller': 'Suspense',
  'Psychological': 'Psicológico', 'Mecha': 'Mecha', 'Music': 'Música',
  'School': 'Escola', 'Military': 'Militar', 'Historical': 'Histórico',
  'Parody': 'Paródia', 'Harem': 'Harém', 'Martial Arts': 'Artes Marciais',
  'Magic': 'Magia', 'Demons': 'Demônios', 'Vampire': 'Vampiro',
  'Space': 'Espaço', 'Cars': 'Corrida', 'Samurai': 'Samurai',
  'Game': 'Jogos', 'Josei': 'Josei', 'Seinen': 'Seinen',
  'Shonen': 'Shonen', 'Shounen': 'Shonen', 'Shōnen': 'Shonen',
  'Shoujo': 'Shojo', 'Shojo': 'Shojo', 'Shōjo': 'Shojo',
  'Award Winning': 'Premiado', 'Boys Love': 'Boys Love',
  'Girls Love': 'Girls Love', 'Suspense': 'Suspense', 'Gore': 'Gore',
  'Ecchi': 'Ecchi', 'Isekai': 'Isekai',
};

window.traduzirGenero = function (nome) {
  return generosPT[nome] || nome;
};

window.renderizarTagsGenero = function (generos) {
  if (!generos || generos.length === 0) return '';
  return generos.map(g => {
    const nome = typeof g === 'string' ? g : g.name;
    return `<span class="genero-tag">${window.traduzirGenero(nome)}</span>`;
  }).join('');
};

// ── Toast global ──
window.mostrarToast = function (msg) {
  let t = document.getElementById('toastMsg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastMsg';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('toast-show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('toast-show'), 2800);
};
