/* ══════════════════════════════════════
   MODAL ADD — OKIRU
   Modal de adição manual de anime/filme.
══════════════════════════════════════ */

const modal     = document.getElementById('modal');
let   tipoModal = 'anime';

// ── Recorte de imagem 2:3 ──
function recortarImagem2x3(file, callback) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const W = 260, H = 390;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const ratio = Math.max(W / img.width, H / img.height);
      const nw = img.width * ratio, nh = img.height * ratio;
      const ox = (W - nw) / 2, oy = (H - nh) / 2;
      ctx.drawImage(img, ox, oy, nw, nh);
      callback(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById('btnGaleriaAnime').addEventListener('click', () => {
  document.getElementById('capaFileInput').click();
});

document.getElementById('capaFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  recortarImagem2x3(file, dataUrl => {
    document.getElementById('capa').value = dataUrl;
  });
  e.target.value = '';
});

// ── Tipo anime / filme ──
window.atualizarTipoModal = function (tipo) {
  tipoModal = tipo;
  const isFilme = tipo === 'filme';
  document.getElementById('tipoBtnAnime').classList.toggle('tipo-btn-ativo', !isFilme);
  document.getElementById('tipoBtnFilme').classList.toggle('tipo-btn-ativo', isFilme);
  document.getElementById('modalTitulo').textContent =
    isFilme ? 'Adicionar Filme Anime' : 'Adicionar Anime';
  document.getElementById('labelNome').innerHTML =
    (isFilme ? 'Nome do filme' : 'Nome do anime') + ' <span class="campo-obrigatorio">*</span>';
  document.getElementById('camposEpisodios').style.display = isFilme ? 'none' : '';
  document.getElementById('camposDuracao').style.display   = isFilme ? '' : 'none';
};

document.getElementById('tipoBtnAnime').addEventListener('click', () => window.atualizarTipoModal('anime'));
document.getElementById('tipoBtnFilme').addEventListener('click', () => window.atualizarTipoModal('filme'));

document.querySelector('.btn-add').addEventListener('click', () => {
  window.atualizarTipoModal('anime');
  document.getElementById('dataAdicao').value = new Date().toISOString().slice(0, 10);
  modal.style.display = 'flex';
});

document.getElementById('fechar').addEventListener('click', () => {
  modal.style.display = 'none';
});

document.getElementById('totalEps').addEventListener('input', () => {
  const total = parseInt(document.getElementById('totalEps').value) || 0;
  document.getElementById('assistidosEps').max = total || 99999;
});

document.getElementById('salvar').addEventListener('click', () => {
  const nome   = document.getElementById('nome').value.trim();
  const capa   = document.getElementById('capa').value.trim();
  const nota   = document.getElementById('nota').value;
  const status = document.getElementById('status').value;
  const isFilme = tipoModal === 'filme';

  const totalEps = isFilme
    ? 0
    : (parseInt(document.getElementById('totalEps').value) || 0);
  const assistidosEps = isFilme
    ? 0
    : Math.min(parseInt(document.getElementById('assistidosEps').value) || 0, totalEps || 99999);
  const duracao = isFilme
    ? (parseInt(document.getElementById('duracao').value) || 0)
    : 0;

  if (!nome || !capa || !nota) {
    alert('Preencha os campos obrigatórios!');
    return;
  }

  const dataInputVal = document.getElementById('dataAdicao').value;
  const dataCriacao  = dataInputVal
    ? new Date(dataInputVal + 'T12:00:00').getTime()
    : Date.now();

  window.animes.push({
    id: Date.now(),
    dataCriacao,
    nome, nota, capa, status,
    observacao: '',
    totalEps, assistidosEps,
    tipo: isFilme ? 'filme' : 'anime',
    duracao,
  });

  window.salvarAnimes();
  window.renderizarAnimes();
  modal.style.display = 'none';

  ['nome', 'capa', 'nota', 'totalEps', 'assistidosEps', 'duracao', 'dataAdicao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
});
