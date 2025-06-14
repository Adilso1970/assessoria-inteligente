// script.js
const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');
const btnAnexar = document.getElementById('btnAnexar');
const btnExcluir = document.getElementById('btnExcluir');
const btnEnviarConvites = document.getElementById('btnEnviarConvites');
const btnExportExcel = document.getElementById('btnExportExcel');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnExportWord = document.getElementById('btnExportWord');

let workbook, worksheet, data;

// Função para renderizar a planilha na tela
function renderizarPlanilha() {
  main.innerHTML = '';
  if (!data) return;

  const list = document.createElement('ul');
  data.forEach(row => {
    const li = document.createElement('li');
    li.textContent = row['Nome do Convidado (a)'];
    list.appendChild(li);
  });
  main.appendChild(list);
}

// Handlers básicos
btnAnexar.addEventListener('click', async () => {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{ description: 'Excel', accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']} }]
  });
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  workbook = XLSX.read(arrayBuffer);
  worksheet = workbook.Sheets[workbook.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(worksheet);
  renderizarPlanilha();
  btnEnviarConvites.disabled = false;
  btnExportExcel.disabled = false;
  btnExportPDF.disabled = false;
  btnExportWord.disabled = false;
});

btnExcluir.addEventListener('click', () => {
  workbook = worksheet = data = null;
  main.innerHTML = '';
  btnEnviarConvites.disabled = true;
  btnExportExcel.disabled = true;
  btnExportPDF.disabled = true;
  btnExportWord.disabled = true;
});

btnEnviarConvites.addEventListener('click', () => {
  alert('Chame o CLI para enviar convites (sem botão no browser).');
});

btnExportExcel.addEventListener('click', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, worksheet, 'Convidados');
  XLSX.writeFile(wb, 'export.xlsx');
});

btnExportPDF.addEventListener('click', () => {
  main.innerHTML += '<p>(PDF gerado aqui)</p>';
});

btnExportWord.addEventListener('click', () => {
  main.innerHTML += '<p>(Word gerado aqui)</p>';
});