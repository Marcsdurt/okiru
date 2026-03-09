/* ══════════════════════════════════════
   SETTINGS — OKIRU
   Perfil de usuário, dark mode,
   exportar/importar dados.
══════════════════════════════════════ */

// ── Aplicar usuário na UI ──
window.aplicarUsuario = function () {
  const hNome = document.querySelector('.perfil-text h2');
  const hImg  = document.querySelector('.perfil-avatar-ring img');
  if (hNome) hNome.textContent = window.usuario.nome;
  if (hImg)  hImg.src = window.usuario.foto;
  document.body.classList.toggle('dark', window.usuario.darkMode);
  document.getElementById('darkModeToggle').checked = window.usuario.darkMode;

  const sbAvatar = document.getElementById('sidebarAvatar');
  const sbName   = document.getElementById('sidebarUserName');
  if (sbAvatar) sbAvatar.src         = window.usuario.foto;
  if (sbName)   sbName.textContent   = window.usuario.nome;

  const nameInput  = document.getElementById('novoNome');
  const avatarPrev = document.getElementById('settingsAvatarPreview');
  const urlInput   = document.getElementById('novaFoto');
  if (nameInput)  nameInput.value  = window.usuario.nome;
  if (avatarPrev) avatarPrev.src   = window.usuario.foto;
  if (urlInput)   urlInput.value   = window.usuario.foto;
};

window.aplicarUsuario();

// ── Dark mode instantâneo ──
document.getElementById('darkModeToggle').addEventListener('change', function () {
  window.usuario.darkMode = this.checked;
  document.body.classList.toggle('dark', window.usuario.darkMode);
  window.salvarUsuario();
});

// ── Avatar: clique abre file picker ──
document.getElementById('cfgAvatarWrap').addEventListener('click', () => {
  document.getElementById('fotoFileInput').click();
});

document.getElementById('fotoFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    document.getElementById('novaFoto').value            = dataUrl;
    document.getElementById('settingsAvatarPreview').src = dataUrl;
  };
  reader.readAsDataURL(file);
});

// ── Preview URL em tempo real ──
document.getElementById('novaFoto').addEventListener('input', e => {
  const val = e.target.value.trim();
  if (val) document.getElementById('settingsAvatarPreview').src = val;
});

// ── Modal de URL de foto ──
document.getElementById('btnAbrirUrlFoto').addEventListener('click', () => {
  document.getElementById('cfgPhotoModal').classList.add('visible');
  document.getElementById('novaFoto').focus();
});

document.getElementById('cfgPhotoModalClose').addEventListener('click', () => {
  document.getElementById('cfgPhotoModal').classList.remove('visible');
});

document.getElementById('cfgApplyUrl').addEventListener('click', () => {
  const val = document.getElementById('novaFoto').value.trim();
  if (val) document.getElementById('settingsAvatarPreview').src = val;
  document.getElementById('cfgPhotoModal').classList.remove('visible');
});

// ── Salvar settings ──
document.getElementById('salvarSettings').addEventListener('click', () => {
  window.usuario.nome     = (document.getElementById('novoNome').value || '').trim() || window.usuario.nome;
  window.usuario.foto     = document.getElementById('novaFoto').value || window.usuario.foto;
  window.usuario.darkMode = document.getElementById('darkModeToggle').checked;
  window.salvarUsuario();
  window.aplicarUsuario();

  const btn = document.getElementById('salvarSettings');
  btn.textContent = '✓ Salvo';
  btn.classList.add('cfg-btn--saved');
  setTimeout(() => {
    btn.textContent = 'Salvar';
    btn.classList.remove('cfg-btn--saved');
  }, 2000);
});

// ── Exportar dados ──
document.getElementById('btnExportarDados').addEventListener('click', () => {
  const payload = {
    versao:        '1.1',
    exportadoEm:   new Date().toISOString(),
    usuario:       JSON.parse(localStorage.getItem('usuario')       || '{}'),
    animes:        JSON.parse(localStorage.getItem('animes')        || '[]'),
    mangas:        JSON.parse(localStorage.getItem('mangas')        || '[]'),
    mangasAdultos: JSON.parse(localStorage.getItem('mangasAdultos') || '[]'),
    ordenacao:     JSON.parse(localStorage.getItem('ordenacao')     || 'null'),
    tutorial:      localStorage.getItem('okiru_tutorial_done')      || null,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `okiru-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  window.mostrarToast('📦 Backup exportado com sucesso!');

  const btn  = document.getElementById('btnExportarDados');
  const orig = btn.innerHTML;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
    style="width:18px;height:18px;fill:white">
    <path d="M256 416.1L131.3 291.3L86.06 336.6L256 506.5L553.9 208.6L508.7 163.4L256 416.1z"/>
    </svg> Exportado!`;
  btn.style.background = 'linear-gradient(135deg,#34d399,#059669)';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2200);
});

// ── Agendamento semanal ──
const scheduleToggle = document.getElementById('scheduleToggle');
const scheduleToast  = document.getElementById('scheduleToast');
const scheduleRow    = document.getElementById('scheduleRow');

scheduleToggle.checked = localStorage.getItem('okiru_schedule') === '1';
if (scheduleToggle.checked) {
  scheduleToast.classList.add('visible');
  scheduleRow.classList.add('schedule-toggle-active');
}

scheduleToggle.addEventListener('change', () => {
  const ativo = scheduleToggle.checked;
  localStorage.setItem('okiru_schedule', ativo ? '1' : '0');
  if (ativo) {
    scheduleToast.classList.add('visible');
    scheduleRow.classList.add('schedule-toggle-active');
    agendarExportacao();
  } else {
    scheduleToast.classList.remove('visible');
    scheduleRow.classList.remove('schedule-toggle-active');
  }
});

function agendarExportacao() {
  const UMA_SEMANA_MS    = 7 * 24 * 60 * 60 * 1000;
  const ultimaExportacao = parseInt(localStorage.getItem('okiru_last_export') || '0');
  const agora = Date.now();
  const diff  = agora - ultimaExportacao;
  const delay = diff >= UMA_SEMANA_MS ? UMA_SEMANA_MS : UMA_SEMANA_MS - diff;

  setTimeout(() => {
    if (localStorage.getItem('okiru_schedule') !== '1') return;
    document.getElementById('btnExportarDados').click();
    localStorage.setItem('okiru_last_export', String(Date.now()));
    agendarExportacao();
  }, delay);
}

if (localStorage.getItem('okiru_schedule') === '1') agendarExportacao();

// ── Importar dados ──
document.getElementById('importFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const dados = JSON.parse(ev.target.result);

      if (!dados.versao || !Array.isArray(dados.animes)) {
        alert('❌ Arquivo inválido ou corrompido. Certifique-se de usar um backup gerado pelo Okiru.');
        return;
      }

      if (dados.animes)        localStorage.setItem('animes',        JSON.stringify(dados.animes));
      if (dados.mangas)        localStorage.setItem('mangas',        JSON.stringify(dados.mangas));
      if (dados.mangasAdultos) localStorage.setItem('mangasAdultos', JSON.stringify(dados.mangasAdultos));
      if (dados.usuario)       localStorage.setItem('usuario',       JSON.stringify(dados.usuario));
      if (dados.ordenacao)     localStorage.setItem('ordenacao',     JSON.stringify(dados.ordenacao));
      if (dados.tutorial)      localStorage.setItem('okiru_tutorial_done', dados.tutorial);

      window.animes = dados.animes;

      if (dados.usuario) {
        window.usuario = dados.usuario;
        window.aplicarUsuario();
      }

      window.renderizarAnimes();

      const badge = document.getElementById('importSuccessBadge');
      badge.style.display = 'flex';
      const totalMangas = (dados.mangas?.length || 0) + (dados.mangasAdultos?.length || 0);
      badge.innerHTML = `✅ ${dados.animes.length} anime(s)${totalMangas > 0 ? ` e ${totalMangas} mangá(s)` : ''} importados com sucesso!`;
      setTimeout(() => { badge.style.display = 'none'; }, 4000);

      window.mostrarToast('🎌 Dados restaurados com sucesso!');

    } catch (err) {
      alert('❌ Não foi possível ler o arquivo. Verifique se é um JSON válido.');
      console.error('Erro ao importar:', err);
    }

    e.target.value = '';
  };

  reader.readAsText(file);
});
