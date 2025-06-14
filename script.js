(async () => {
  const fileInput = document.getElementById('file-input');
  const btnAnexar = document.getElementById('btnAnexar');
  const btnExcluir = document.getElementById('btnExcluir');
  const btnEnviar = document.getElementById('btnEnviar');
  const nomeArquivo = document.getElementById('nome-arquivo');
  const tabelaLista = document.getElementById('tabela-lista');
  let convidados = [];

  btnAnexar.onclick = () => fileInput.click();
  fileInput.onchange = async (e) => {
    const [file] = e.target.files;
    nomeArquivo.textContent = file.name;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    convidados = XLSX.utils
      .sheet_to_json(ws, { header: 1 })
      .slice(1)
      .map(row => ({ nome: row[0], telefone: row[1], mesa: row[2] }));
    renderTabela();
    btnEnviar.disabled = false;
  };

  btnExcluir.onclick = () => {
    convidados = [];
    nomeArquivo.textContent = '';
    tabelaLista.innerHTML = '';
    btnEnviar.disabled = true;
    document.getElementById('qr').innerHTML = '';
    document.getElementById('checkin').innerHTML = '';
  };

  function renderTabela() {
    let html = '<table><tr><th>Nome</th><th>Fone</th><th>Mesa</th></tr>';
    convidados.forEach(c => {
      html += <tr><td></td><td></td><td></td></tr>;
    });
    html += '</table>';
    tabelaLista.innerHTML = html;
  }

  btnEnviar.onclick = async () => {
    const inst = prompt('Instância Z-API (ex: ABC12345):');
    const token = prompt('Token Z-API:');
    if (!inst || !token) return alert('Instância e token obrigatórios.');

    try {
      const resp = await fetch('/.netlify/functions/send-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inst, token, convidados })
      });
      const json = await resp.json();
      console.log('Resposta Function:', json);
      if (json.failures?.length) {
        alert('Falha nos convites:\n' + json.failures.join('\n'));
      } else {
        alert('Convites enviados com sucesso!');
      }
    } catch (err) {
      console.error('Erro na chamada:', err);
      alert('Erro interno ao enviar. Veja console.');
    }
  };
})();
