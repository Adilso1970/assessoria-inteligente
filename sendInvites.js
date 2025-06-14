import axios from 'axios';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const [,, file] = process.argv;
if (!file) return console.error('❌ Use: node sendInvites.js <planilha.xlsx>');

const { ZAPI_INSTANCE_ID: INSTANCE, ZAPI_TOKEN: TOKEN, ZAPI_CLIENT_TOKEN: CLIENT_TOKEN } = process.env;
if (!INSTANCE || !TOKEN || !CLIENT_TOKEN) {
  return console.error('❌ Defina ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN no seu .env');
}

(async () => {
  const wb = XLSX.readFile(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`➡️ Total de registros na planilha: ${data.length}`);

  const failures = [];
  for (const row of data) {
    const name = row['Nome do Convidado (a)'];
    const phoneRaw = String(row['Número WhatsApp'] || '').replace(/\D/g, '');
    if (!phoneRaw) {
      console.warn(`⚠️ Telefone ausente para "${name}". Pulando.`);
      continue;
    }
    const raw = phoneRaw.startsWith('55') ? phoneRaw : `55${phoneRaw}`;
    const message = row['Texto do Convite'] ||
      `Olá ${name}, você está convidado(a)!`;

    console.log(`📱 Payload => raw: "${raw}", phone: "${raw}", message: "${message}"`);
    try {
      const res = await axios.post(
        `https://api.z-api.io/instances/${INSTANCE}/send-text`,
        { phone: raw, message },
        { headers: { 'Client-Token': CLIENT_TOKEN, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        console.log(`✅ Enviado para ${name} (messageId: ${res.data.id})`);
      } else {
        throw res.data;
      }
    } catch (err) {
      const status = err.response?.status || err.error || 'ERROR';
      const body = err.response?.data || err;
      console.error(`❌ Falha para ${name}: ${status} –`, body);
      failures.push(name);
    }
  }

  if (failures.length) {
    console.error(`\n❗ Convites falharam para: ${failures.join(', ')}`);
  }
})();