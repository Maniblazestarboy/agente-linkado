// src/models/conversation.model.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // O ID do usuário do WhatsApp (ex: 244946043956@c.us)
  userJid: {
    type: String,
    required: true,
    unique: true, // Cada usuário tem apenas um documento de conversa
    index: true,  // Para buscas rápidas
  },
  // O histórico de mensagens no formato que a API da OpenAI espera
  history: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant'], // Apenas 'user' ou 'assistant'
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
}, { timestamps: true }); // Adiciona os campos createdAt e updatedAt

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;