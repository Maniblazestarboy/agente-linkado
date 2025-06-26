// src/services/whatsapp.client.js (VERSÃO FINAL COM VALIDAÇÃO AVANÇADA)

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import { getAIResponse } from './openrouter.service.js';
import Conversation from '../models/conversation.model.js';
import { analyzePaymentPDF } from './pdf.service.js';

export const initializeWhatsAppClient = () => {
  console.log('Iniciando cliente do WhatsApp...');

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', (qr) => {
    console.log('QR Code recebido, escaneie com seu celular!');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ Cliente conectado e pronto para receber mensagens!');
  });

  client.on('auth_failure', msg => {
      console.error('❌ FALHA NA AUTENTICAÇÃO', msg);
  });

  client.on('message', async (message) => {
    const userJid = message.from;
    const chat = await message.getChat();

    // FLUXO 1: ANÁLISE DE DOCUMENTO
    if (message.hasMedia && message.type === 'document') {
      await chat.sendStateTyping();
      try {
        const media = await message.downloadMedia();
        if (media.mimetype === 'application/pdf') {
            console.log(`[FLUXO 1] PDF recebido de ${userJid}. Iniciando validação completa...`);
            const pdfBuffer = Buffer.from(media.data, 'base64');
            
            // Chama o nosso novo serviço de validação que retorna um objeto
            const validationResult = await analyzePaymentPDF(pdfBuffer);

            // VERIFICA O OBJETO DE RESULTADO DA VALIDAÇÃO
            if (validationResult.success) {
                // Se a validação do PDF foi um sucesso (destinatário, etc), agora comparamos o valor com o plano
                
                // TODO: Tornar este valor dinâmico, buscando o plano que o cliente escolheu.
                const expectedValue = 13000; 

                if (validationResult.detectedValue >= expectedValue) {
                    await client.sendMessage(userJid, `✅ Pagamento validado com sucesso!\n\nValor recebido: ${validationResult.detectedValue.toFixed(2)} Kz.\nDestinatário verificado.\n\nObrigado! Em breve receberá o formulário para iniciarmos o seu projeto.`);
                } else {
                    await client.sendMessage(userJid, `⚠️ Pagamento Válido, mas Insuficiente!\n\nO comprovativo é autêntico, mas o valor de ${validationResult.detectedValue.toFixed(2)} Kz é inferior ao do plano de ${expectedValue} Kz. Por favor, verifique o valor pago.`);
                }
            } else {
                // Se a validação falhou, envia a mensagem de erro específica retornada pelo serviço
                await client.sendMessage(userJid, `❌ Falha na Validação!\n\nMotivo: ${validationResult.message}`);
            }
        } else {
            await client.sendMessage(userJid, `Recebi um documento, mas ele não parece ser um PDF. Por favor, envie o comprovativo no formato PDF.`);
        }
      } catch (error) {
        console.error('Erro geral ao processar o documento:', error);
        await client.sendMessage(userJid, 'Ocorreu um erro ao processar seu arquivo. Por favor, tente novamente.');
      } finally {
        await chat.clearState();
      }
      return; // Encerra o processamento para não tratar como texto
    }

    // FLUXO 2: CONVERSA DE TEXTO COM MEMÓRIA
    if (message.body && message.from !== 'status@broadcast') {
        console.log(`[FLUXO 2] Mensagem de texto recebida de ${userJid}: "${message.body}"`);
        await chat.sendStateTyping();

        try {
            let conversation = await Conversation.findOne({ userJid: userJid });
            if (!conversation) {
            conversation = new Conversation({ userJid: userJid, history: [] });
            }

            conversation.history.push({ role: 'user', content: message.body });

            const historyLimit = 20;
            if (conversation.history.length > historyLimit) {
            conversation.history = conversation.history.slice(-historyLimit);
            }
            
            const aiResponse = await getAIResponse(conversation.history);
            console.log(`Resposta da IA: "${aiResponse}"`);

            conversation.history.push({ role: 'assistant', content: aiResponse });
            await conversation.save();

            await chat.clearState();
            client.sendMessage(userJid, aiResponse);

        } catch (error) {
            console.error('Erro no processamento da conversa:', error);
            client.sendMessage(userJid, 'Ocorreu um erro na minha conexão com a inteligência artificial. Por favor, tente novamente.');
        }
    }
  });

  client.initialize();
};