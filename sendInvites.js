// sendInvites.js
// CommonJS style — funciona direto com `node sendInvites.js`

const XLSX = require('xlsx')
const axios = require('axios')
require('dotenv').config()

// --- pega o nome do arquivo da linha de comando
const file = process.argv[2]
if (!file) {
  console.error('❌ Use: node sendInvites.js <planilha.xlsx>')
  process.exit(1)
}

// --- checa vars de ambiente
const { ZAPI_INSTANCE_ID: INSTANCE, ZAPI_TOKEN: TOKEN, ZAPI_CLIENT_TOKEN: CLIENT_TOKEN } = process.env
if (!INSTANCE || !TOKEN || !CLIENT_TOKEN) {
  console.error('❌ Defina ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN no seu .env')
  process.exit(1)
}

let workbook
try {
  workbook = XLSX.readFile(file)
} catch (err) {
  console.error(`❌ Erro ao ler a planilha: ${err.message}`)
  process.exit(1)
}

// converte a primeira aba em JSON
const sheetName = workbook.SheetNames[0]
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })

// cabeçalho esperado na primeira linha:
const header = rows.shift()
const idxName  = header.indexOf('Nome do Convidado (a)')
const idxPhone = header.indexOf('Número WhatsApp')
// (ajuste esses nomes se você tiver usado outro)

// monta array de objetos { name, phone, ... }
const data = rows.map(r => ({
  name: r[idxName],
  rawPhone: r[idxPhone]
})).filter(r => r.name && r.rawPhone)

console.log(`➡️ Total de registros na planilha: ${data.length}`)

(async () => {
  const failures = []

  for (const { name, rawPhone } of data) {
    // normaliza telefone
    const raw = String(rawPhone).replace(/\D/g, '')
    const phone = raw.startsWith('55') ? raw : '55' + raw

    const message = `Olá ${name}, você está convidado(a)!`

    console.log(`📱 Enviando para ${name}: ${phone}`)
    try {
      const res = await axios.post(
        `https://api.z-api.io/instances/${INSTANCE}/send-text`,
        { phone, message },
        { headers: { 'Client-Token': CLIENT_TOKEN, 'Content-Type': 'application/json' } }
      )
      if (res.data?.success) {
        console.log(`✅ Enviado para ${name}`)
      } else {
        console.error(`❌ Falha para ${name}:`, res.data)
        failures.push(name)
      }
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${name}:`, err.response?.data || err.message)
      failures.push(name)
    }
  }

  if (failures.length) {
    console.error(`\n❗ Convites falharam para: ${failures.join(', ')}`)
    process.exit(1)
  } else {
    console.log('\n🎉 Todos os convites enviados com sucesso!')
  }
})()