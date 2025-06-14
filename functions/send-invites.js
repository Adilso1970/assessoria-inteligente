const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { inst, token, convidados } = JSON.parse(event.body);
    const failures = [];

    for (const c of convidados) {
      const payload = {
        raw: c.telefone,
        phone: 55,
        body: \Olá \, seu convite para a mesa \ está aqui!\
      };

      const url = \https://api.z-api.io/instances/\/token/\/send-text\;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Envio para', c.telefone, data);
      if (!data.success) failures.push(\\ — \\);
    }

    return { statusCode: 200, body: JSON.stringify({ failures }) };
  } catch (err) {
    console.error('Erro na Function:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
