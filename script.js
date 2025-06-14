// script.js
const btnAnexar       = document.getElementById('btnAnexar');
const btnExcluir      = document.getElementById('btnExcluir');
const btnEnviarConvites = document.getElementById('btnEnviarConvites');
const btnExportExcel  = document.getElementById('btnExportExcel');
const btnExportPDF    = document.getElementById('btnExportPDF');
const btnExportWord   = document.getElementById('btnExportWord');
const fileInput       = document.getElementById('fileInput');
const main            = document.getElementById('main');

let workbook, worksheet, data;

// Quando clicam em “Anexar Planilha”, disparamos o input[type=file]
btnAnexar.addEventListener('click', () => {
  fileInput.click();
});

// Quando o usuário escolhe o arquivo, lemos e processamos
fileInput.addEventListener('change', async (evt) => {
  const file = evt.target.files[0];
  if (!file) return;
  const arrayBuffer = await file.arrayBuffer();
  workbook = XLSX.read(arrayBuffer);
  worksheet = workbook.Sheets[workbook.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(worksheet);
  renderizarPlanilha();
  // habilita os botões agora que temos dados
  btnExcluir.disabled      = false;
  btnEnviarConvites.disabled = false;
  btnExportExcel.disabled  = false;
  btnExportPDF.disabled    = false;
  btnExportWord.disabled   = false;
});

// “Excluir Planilha” volta ao estado inicial
btnExcluir.addEventListener('click', () => {
  workbook = worksheet = data = null;
  main.innerHTML = '';
  fileInput.value = ''; // limpa o input também
  btnExcluir.disabled      = true;
  btnEnviarConvites.disabled = true;
  btnExportExcel.disabled  = true;
  btnExportPDF.disabled    = true;
  btnExportWord.disabled   = true;
});

// “Enviar Convites” só exibe um alerta (CLI é separado)
btnEnviarConvites.addEventListener('click', () => {
  alert('Para enviar realmente use o CLI: run_send_invites.bat Convidados.xlsx');
});

// Exportar Excel pela SheetJS
btnExportExcel.addEventListener('click', () => {
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, worksheet, 'Convidados');
  XLSX.writeFile(wb2, 'export.xlsx');
});

// Esses dois são exemplos de “mock”
btnExportPDF.addEventListener('click', () => {
  const p = document.createElement('p');
  p.textContent = '(PDF gerado)';
  main.appendChild(p);
});
btnExportWord.addEventListener('click', () => {
  const p = document.createElement('p');
  p.textContent = '(Word gerado)';
  main.appendChild(p);
});

// Função que renderiza a lista na área principal
function renderizarPlanilha() {
  main.innerHTML = '';
  if (!data) return;
  const ul = document.createElement('ul');
  data.forEach(row => {
    const li = document.createElement('li');
    li.textContent = row['Nome do Convidado (a)'] || '(sem nome)';
    ul.appendChild(li);
  });
  main.appendChild(ul);
}