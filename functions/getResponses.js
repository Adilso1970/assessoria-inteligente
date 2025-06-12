// functions/getResponses.js
exports.handler = async function() {
  // Retorna o objeto global.responses
  const data = global.responses || {};
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
