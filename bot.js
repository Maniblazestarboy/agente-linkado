// bot.js (na raiz do projeto)
import 'dotenv/config'; // Carrega as variáveis de ambiente do arquivo .env
import connectDB from './src/config/db.js';
import { initializeWhatsAppClient } from './src/services/whatsapp.client.js';

// Conectar ao Banco de Dados (opcional para o bot, mas bom para salvar logs/conversas)
connectDB();

// Inicia o bot
initializeWhatsAppClient();