// src/services/pdf.service.js
import { PdfReader } from 'pdfreader';

// --- DADOS DO DESTINATÁRIO PARA VALIDAÇÃO ---
const VALID_RECIPIENT_NAME = "MARCIO GUILHERME MANUEL";
const VALID_BFA_IBAN_NORMALIZED = "000600006564273630198";
const VALID_ATLANTICO_IBAN_NORMALIZED = "005500000225454910173";
const VALID_PHONE_NUMBER_NORMALIZED = "946043956";
const HORAS_VALIDADE_COMPROVATIVO = 24; // Define que o comprovativo é válido por 24 horas

const normalizeText = (text) => {
  return text.replace(/\s/g, '').toUpperCase();
};

export const analyzePaymentPDF = async (pdfBuffer) => {
  return new Promise((resolve, reject) => {
    let fullText = '';
    new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
      if (err) {
        return reject(new Error('Erro ao ler o arquivo PDF.'));
      }
      if (!item) { // Fim do arquivo
        console.log("\n--- TEXTO EXTRAÍDO DO PDF ---\n", fullText, "\n-----------------------------\n");

        try {
          // --- REGEX PARA EXTRAIR TODOS OS DADOS ---
          const montanteRegex = /Montante:?\s*([\d.,]+)\s*Kz/i;
          const totalRegex = /Total:?\s*([\d.,]+)\s*Kz/i;
          const destinatarioRegex = /Destinatário\s*([A-Z\s]+)/;
          const ibanRegex = /IBAN\s*([A-Z0-9\.]+)/;
          const telemovelRegex = /Nº de Telemóvel Destinatário\s*(\d[\d\s]+)/;
          const dataRegex = /Data - Hora\s*(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/; // Regex para a data

          // --- EXTRAÇÃO ---
          const montanteMatch = fullText.match(montanteRegex);
          const totalMatch = fullText.match(totalRegex);
          const destinatarioMatch = fullText.match(destinatarioRegex);
          const ibanMatch = fullText.match(ibanRegex);
          const telemovelMatch = fullText.match(telemovelRegex);
          const dataMatch = fullText.match(dataRegex); // Extrai a data

          // --- VALIDAÇÃO 1: DATA E HORA ---
          if (dataMatch && dataMatch[1]) {
            const dataTransacao = new Date(dataMatch[1]);
            const agora = new Date();
            const diffMs = agora.getTime() - dataTransacao.getTime();
            const diffHoras = diffMs / (1000 * 60 * 60);

            if (diffHoras < 0 || diffHoras > HORAS_VALIDADE_COMPROVATIVO) {
              return resolve({ success: false, message: `Comprovativo inválido. A data da transação (${dataTransacao.toLocaleString()}) não é recente.`, detectedValue: null });
            }
            console.log(`✅ Validação de Data: OK (${diffHoras.toFixed(1)} horas atrás)`);
          } else {
            return resolve({ success: false, message: 'Não foi possível encontrar a data da transação no comprovativo.', detectedValue: null });
          }
          
          // --- VALIDAÇÃO 2: VALOR ENCONTRADO ---
          if (!montanteMatch || !montanteMatch[1]) {
            return resolve({ success: false, message: 'Não foi possível encontrar o campo "Montante" no comprovativo.', detectedValue: null });
          }
          const detectedValueString = montanteMatch[1].replace(/\./g, '').replace(',', '.');
          const detectedValue = parseFloat(detectedValueString);
          console.log(`✅ Valor do Montante encontrado: ${detectedValue}`);

          // --- VALIDAÇÃO 3: CONSISTÊNCIA MONTANTE VS TOTAL ---
          if (totalMatch && totalMatch[1]) {
            const totalValueString = totalMatch[1].replace(/\./g, '').replace(',', '.');
            const totalValue = parseFloat(totalValueString);
            if (detectedValue !== totalValue) {
              return resolve({ success: false, message: `Inconsistência encontrada: o Montante (${detectedValue} Kz) é diferente do Total (${totalValue} Kz).`, detectedValue });
            }
            console.log('✅ Consistência Montante vs. Total: OK');
          }

          // --- VALIDAÇÃO 4: DESTINATÁRIO ---
          let recipientVerified = false;
          if (destinatarioMatch && normalizeText(destinatarioMatch[1]).includes(normalizeText(VALID_RECIPIENT_NAME))) {
            recipientVerified = true;
            console.log('✅ Destinatário (Nome) verificado: OK');
          }
          if (ibanMatch && (normalizeText(ibanMatch[1]).includes(VALID_BFA_IBAN_NORMALIZED) || normalizeText(ibanMatch[1]).includes(VALID_ATLANTICO_IBAN_NORMALIZED))) {
            recipientVerified = true;
            console.log('✅ Destinatário (IBAN) verificado: OK');
          }
          if (telemovelMatch && normalizeText(telemovelMatch[1]).includes(VALID_PHONE_NUMBER_NORMALIZED)) {
            recipientVerified = true;
            console.log('✅ Destinatário (Telefone) verificado: OK');
          }

          if (!recipientVerified) {
            return resolve({ success: false, message: 'O destinatário do pagamento (Nome, IBAN ou Telefone) não corresponde aos nossos registos.', detectedValue });
          }

          // --- SUCESSO EM TODAS AS VALIDAÇÕES ---
          resolve({ success: true, message: 'Comprovativo validado com sucesso.', detectedValue });

        } catch (error) {
          reject(error);
        }
      } else if (item.text) {
        fullText += item.text + ' ';
      }
    });
  });
};