exports.handler = async function(event) {
  const payload = JSON.parse(event.body);
  if (payload.type === "onMessage") {
    global.responses = global.responses || {};
    global.responses[payload.chatId] = payload.body.trim().toLowerCase();
  }
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};