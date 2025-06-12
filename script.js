// script.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Remove o botão Configurar Z-API (para não reaparecer)
  const zapiBtn = document.getElementById('btnConfigZapi');
  if (zapiBtn) zapiBtn.remove();

  // 2) Referências DOM
  const fileInput      = document.getElementById('file-input');
  const btnAnexar      = document.getElementById('btnAnexar');
  const btnExcluir     = document.getElementById('btnExcluir');
  const btnEnviar      = document.getElementById('btnEnviar');
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnExportPDF   = document.getElementById('btnExportPDF');
  const btnExportWord  = document.getElementById('btnExportWord');

  // 3) Estado interno dos convidados
  let convidados = [];

  // 4) Liga eventos
  btnAnexar.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', processarPlanilha);
  btnExcluir.addEventListener('click', excluirPlanilha);
  btnEnviar.addEventListener('click', enviarConvites);
  btnExportExcel.addEventListener('click', exportarExcel);
  btnExportPDF.addEventListener('click', exportarPDF);
  btnExportWord.addEventListener('click', exportarWord);
});

/**
 * Pede instância e token via prompt na primeira execução
 * e guarda em localStorage para uso futuro.
 */
async function getZapiCredentials() {
  let inst = localStorage.getItem('zapiInstance');
  let tok  = localStorage.getItem('zapiToken');

  if (!inst || !tok) {
    inst = prompt('🔑 Insira seu ID de instância Z-API:');
    tok  = prompt('🔑 Insira seu Token Z-API:');
    if (!inst || !tok) {
      alert('⚠️ Z-API não configurada. Operação cancelada.');
      return null;
    }
    localStorage.setItem('zapiInstance', inst);
    localStorage.setItem('zapiToken', tok);
  }
  return { inst, tok };
}

/**
 * Lê o .xlsx, converte em JSON e atualiza a UI
 */
function processarPlanilha(event) {
  const f = event.target.files[0];
  if (!f || !f.name.endsWith('.xlsx')) {
    alert('Arquivo inválido. Selecione um .xlsx');
    return;
  }

  document.getElementById('nome-arquivo').textContent = f.name;

  const reader = new FileReader();
  reader.onload = ev => {
    const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
    convidados = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) || [];
    document.getElementById('btnEnviar').disabled = convidados.length === 0;
    renderList();
    renderQR();
    renderCheckin();
  };
  reader.readAsArrayBuffer(f);
}

/**
 * Limpa os dados e reseta a interface
 */
function excluirPlanilha() {
  convidados = [];
  ['nome-arquivo','tabela-lista','qr','checkin'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
  document.getElementById('btnEnviar').disabled = true;
}

/**
 * Envia convites via Z-API usando função serverless + DEBUG de telefones
 */
async function enviarConvites() {
  if (!convidados.length) {
    alert('Faça upload da planilha antes.');
    return;
  }

  // 1) Pega instância/token via prompt/localStorage
  const creds = await getZapiCredentials();
  if (!creds) return;
  const { inst, tok } = creds;

  // Debug: verificar instância e token
  console.log('➤ Envio Z-API com inst=', inst, 'e token=', tok);

  // 2) Envia tudo de uma vez para a Function Netlify
  const resp = await fetch('/.netlify/functions/send-invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inst, tok, convidados })
  });

  // 3) Lê resultado
  let failures = [];
  try {
    const data = await resp.json();
    failures = data.failures || [];
  } catch (e) {
    console.error('❌ Erro ao parsear JSON da Function:', e);
    alert('Erro interno ao processar envio.');
    return;
  }

  // 4) DEBUG: mostra cada número gerado
  convidados.forEach(p => {
    const raw = p['Número WhatsApp'];
    const phone = '55' + String(raw).replace(/\D/g, '');
    console.log(`📱 Payload => raw: "${raw}", phone: "${phone}"`);
  });

  // 5) Feedback ao usuário
  if (failures.length) {
    console.warn('❌ Falha nos convites para:', failures);
    alert('Falha ao enviar para:\n' + failures.join('\n'));
  } else {
    console.log('✅ Convites enviados com sucesso para todos os números.');
    alert('Todos os convites foram enviados com sucesso!');
  }
}

/**
 * Exporta JSON para Excel (.xlsx)
 */
function exportarExcel() {
  if (!convidados.length) {
    alert('Nenhum dado para exportar.');
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(convidados);
  ws['!cols'] = Object.keys(convidados[0] || {}).map(() => ({ wch:25 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Convidados');
  XLSX.writeFile(wb, 'relatorio.xlsx');
}

/**
 * Exporta lista para PDF (.pdf)
 */
function exportarPDF() {
  if (!convidados.length) {
    alert('Nenhum dado para exportar.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  convidados.forEach(p => {
    const txt = [
      p['Nome do Convidado (a)'],
      p['Acompanhante'],
      p['Nome Filho (a)'], p['Nome Filho (a).1'], p['Nome Filho (a).2']
    ].filter(Boolean).join(', ') + ' — Mesa ' + p['Nº Mesa'];
    doc.text(txt, 10, y);
    y += 10;
    if (y > 280) { doc.addPage(); y = 10; }
  });
  doc.save('relatorio.pdf');
}

/**
 * Exporta lista para Word (.doc)
 */
function exportarWord() {
  if (!convidados.length) {
    alert('Nenhum dado para exportar.');
    return;
  }
  const content = convidados.map(p =>
    [
      p['Nome do Convidado (a)'],
      p['Acompanhante'],
      p['Nome Filho (a)'], p['Nome Filho (a).1'], p['Nome Filho (a).2']
    ].filter(Boolean).join(', ') + ' — Mesa ' + p['Nº Mesa']
  ).join('\n');

  const blob = new Blob([content], { type:'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'relatorio.doc';
  link.click();
}

/**
 * Renderiza a lista de convidados
 */
function renderList() {
  document.getElementById('tabela-lista').innerHTML =
    convidados.map(p => {
      const nomes = [
        p['Nome do Convidado (a)'],
        p['Acompanhante'],
        p['Nome Filho (a)'], p['Nome Filho (a).1'], p['Nome Filho (a).2']
      ].filter(Boolean).join(', ');
      return `<p><strong>${nomes}</strong> — Mesa ${p['Nº Mesa']}</p>`;
    }).join('');
}

/**
 * Renderiza QR Codes
 */
function renderQR() {
  const container = document.getElementById('qr');
  container.innerHTML = '';
  convidados.forEach(p => {
    const canvas = document.createElement('canvas');
    const info = [
      p['Nome do Convidado (a)'],
      p['Acompanhante'],
      p['Nome Filho (a)'], p['Nome Filho (a).1'], p['Nome Filho (a).2']
    ].filter(Boolean).join(', ') + ' — Mesa ' + p['Nº Mesa'];
    QRCode.toCanvas(canvas, info);
    container.appendChild(canvas);
  });
}

/**
 * Renderiza contagem de check-in por faixa etária
 */
function renderCheckin() {
  let c1 = 0, c2 = 0, c3 = 0;
  convidados.forEach(p =>
    ['Idade','Idade.1','Idade.2'].forEach(k => {
      const i = parseInt(p[k]);
      if (!isNaN(i)) {
        if (i <= 4) c1++;
        else if (i <= 9) c2++;
        else c3++;
      }
    })
  );
  document.getElementById('checkin').innerHTML =
    `<p>Total de convidados: ${convidados.length}</p>
     <p>1-4 anos: ${c1}</p>
     <p>5-9 anos: ${c2}</p>
     <p>10+ anos: ${c3}</p>`;
}
