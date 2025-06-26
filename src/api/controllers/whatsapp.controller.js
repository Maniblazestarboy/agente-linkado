// src/api/controllers/whatsapp.controller.js
import { getAIResponse } from '../../services/openrouter.service.js';
// Futuramente, você importará o whatsapp.service.js aqui para enviar a resposta

export const handleIncomingMessage = async (request, reply) => {
  // A estrutura do 'request.body' depende da API de WhatsApp que você usar.
  // Este é um exemplo baseado na API da Meta.
  const messageData = request.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (messageData && messageData.type === 'text') {
    const userMessage = messageData.text.body;
    const userPhoneNumber = messageData.from;

    console.log(`Mensagem recebida de ${userPhoneNumber}: "${userMessage}"`);

    // 1. Obter a resposta da IA
    const aiResponse = await getAIResponse(userMessage);
    console.log(`Resposta da IA: "${aiResponse}"`);

    // 2. Enviar a resposta de volta para o usuário (a lógica exata virá do whatsapp.service.js)
    // await sendWhatsAppMessage(userPhoneNumber, aiResponse);

    // Por enquanto, apenas retornamos o sucesso
    reply.code(200).send({ status: 'ok' });
  } else {
    // Se não for uma mensagem de texto, apenas confirme o recebimento
    reply.code(200).send({ status: 'event received' });
  }
};

// Este é o endpoint para a verificação do Webhook da Meta
export const verifyWebhook = (request, reply) => {
    const VERIFY_TOKEN = "SEU_TOKEN_DE_VERIFICACAO"; // Crie seu próprio token

    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
        reply.code(200).send(challenge);
    } else {
        reply.code(403).send('Failed validation. Make sure the validation tokens match.');
    }
};