// app.js
import Fastify from 'fastify';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import whatsappRoutes from './src/api/routes/whatsapp.routes.js';

dotenv.config();

// Conectar ao Banco de Dados
connectDB();

const fastify = Fastify({
  logger: true, // Habilita logs para debug
});

// Registrar rotas
fastify.register(whatsappRoutes, { prefix: '/api/whatsapp' });

// Iniciar o servidor
const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Servidor rodando na porta ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();