// netlify/functions/send-invites.js

exports.handler = async function(event, context) {
  try {
    // 1) Parse do corpo recebido
    const { inst, tok, convidados } = JSON.parse(event.body);
    console.log('Function: inst=', inst, 'tok=', tok, 'convidados count=', convidados.length);

    // 2) Loop de envio
    const failures = [];
    for (const p of convidados) {
      const nomes = [
        p['Nome do Convidado (a)'],
        p['Acompanhante'],
        p['Nome Filho (a)'], p['Nome Filho (a).1'], p['Nome Filho (a).2']
      ].filter(Boolean).join(', ');
      const phone   = '55' + String(p['Número WhatsApp']).replace(/\D/g, '');
      const message = encodeURIComponent(`${nomes}\n${p['Texto do Convite']}`);

      console.log(`Function → enviando para ${phone}: "${message}"`);
      const response = await fetch(
        `https://api.z-api.io/instances/${inst}/token/${tok}/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': tok
          },
          body: JSON.stringify({ phone, message })
        }
      );

      const json = await response.json();
      console.log('Function → resposta:', response.status, json);
      if (!response.ok || !json.success) {
        failures.push(nomes);
      }
    }

    // 3) Retorno 200 com lista de falhas (vazia = sucesso total)
    return {
      statusCode: 200,
      body: JSON.stringify({ failures })
    };

  } catch (err) {
    console.error('Function Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
