// src/api/routes/whatsapp.routes.js
import { handleIncomingMessage, verifyWebhook } from '../controllers/whatsapp.controller.js';

const whatsappRoutes = async (fastify, options) => {
  // Rota para o WhatsApp enviar eventos (novas mensagens)
  fastify.post('/webhook', handleIncomingMessage);
  
  // Rota para a Meta verificar seu webhook
  fastify.get('/webhook', verifyWebhook);
};

export default whatsappRoutes;