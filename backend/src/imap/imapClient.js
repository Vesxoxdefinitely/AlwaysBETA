const Imap = require('imap');
const { simpleParser } = require('mailparser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Communication = require('../models/Communication');

function processUnseen(imap) {
  imap.openBox('INBOX', false, function(err, box) {
    if (err) {
      console.error('IMAP openBox error:', err);
      imap.end();
      return;
    }
    imap.search(['UNSEEN'], function(err, results) {
      if (err) {
        console.error('IMAP search error:', err);
        imap.end();
        return;
      }
      if (!results || !results.length) {
        // console.log('IMAP: новых писем нет');
        imap.end();
        return;
      }
      const f = imap.fetch(results, { bodies: '' });
      f.on('message', function(msg, seqno) {
        msg.on('body', function(stream) {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              console.error('Ошибка парсинга письма:', err);
              return;
            }
            console.log('--- Новое входящее письмо ---');
            console.log('От:', parsed.from.text, parsed.from.value[0].address);
            console.log('Тема:', parsed.subject);
            console.log('Текст:', parsed.text);
            if (parsed.from.value[0].address === process.env.YANDEX_USER) {
              console.log('Письмо от себя — пропущено');
              return;
            }
            function normalizeSubject(subject) {
              return (subject || '')
                .replace(/^(Re:|Fwd:|FW:|RE:)+/gi, '')
                .replace(/\[.*?\]/g, '')
                .trim()
                .toLowerCase();
            }
            function extractReplyOnly(text) {
              if (!text) return '';
              const markers = [
                /^On .+ wrote:/mi,
                /^От: /mi,
                /^С: /mi,
                /^> /m,
                /^-----Original Message-----/mi
              ];
              let minIdx = text.length;
              for (const marker of markers) {
                const match = text.match(marker);
                if (match && match.index < minIdx) {
                  minIdx = match.index;
                }
              }
              return text.slice(0, minIdx).trim();
            }
            const incomingSubject = normalizeSubject(parsed.subject);
            const replyText = extractReplyOnly(parsed.text || '');
            let comm = await Communication.findOne({
              clientEmail: parsed.from.value[0].address,
              $expr: {
                $eq: [
                  { $toLower: { $trim: { input: '$subject' } } },
                  incomingSubject
                ]
              }
            });
            if (comm) {
              comm.messages.push({
                author: parsed.from.value[0].address,
                authorType: 'client',
                text: replyText || '[без текста]',
                createdAt: parsed.date || new Date()
              });
              await comm.save();
              console.log('Письмо добавлено в существующую коммуникацию:', comm.subject);
            } else {
              await Communication.create({
                organization: '665b1e2f8e4a2c001e3e4a1b', // <-- ID организации по умолчанию
                clientName: parsed.from.text,
                clientEmail: parsed.from.value[0].address,
                subject: parsed.subject || '(без темы)',
                status: 'new',
                messages: [{
                  author: parsed.from.value[0].address,
                  authorType: 'client',
                  text: replyText || '[без текста]',
                  createdAt: parsed.date || new Date()
                }],
                createdAt: parsed.date || new Date()
              });
              console.log('Письмо сохранено как новая коммуникация:', parsed.subject);
            }
          });
        });
        msg.once('attributes', function(attrs) {
          imap.addFlags(attrs.uid, '\\Seen', function(err) {
            if (err) console.log('Ошибка пометки письма как прочитанного:', err);
          });
        });
      });
      f.once('end', function() {
        console.log('IMAP: обработка новых писем завершена');
        imap.end();
      });
    });
  });
}

function startImapWatcher() {
  function run() {
    const imap2 = new Imap({
      user: process.env.YANDEX_USER,
      password: process.env.YANDEX_PASS,
      host: 'imap.yandex.ru',
      port: 993,
      tls: true
    });
    imap2.once('ready', function() {
      // console.log('IMAP: подключение готово, проверяю новые письма...');
      processUnseen(imap2);
    });
    imap2.once('error', function(err) {
      console.log('IMAP ошибка:', err);
    });
    imap2.once('end', function() {
      // console.log('IMAP: соединение закрыто, жду следующую проверку...');
      setTimeout(run, 15000); // Проверять каждые 15 секунд
    });
    imap2.connect();
  }
  run();
}

function startImap() {
  startImapWatcher();
}

module.exports = { startImap };
