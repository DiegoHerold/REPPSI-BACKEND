const { v4: uuidv4 } = require('uuid');
const { RtcRole, RtcTokenBuilder } = require('agora-access-token');
const {
  createRoom,
  findRoomByChannelName,
  deactivateRoom,
} = require('../model/roomDb');

const APP_ID = '58f068d14f6e45e9b344403f92047fa8';
const APP_CERTIFICATE = '770ef9aa94c44969a677101313b54c57';

// Atualizar as URLs para usar o frontend correto e backend correto
const FRONTEND_URL = 'https://f8f5696faed6392fdace.vercel.app';
const BACKEND_URL = 'http://localhost:5000';

// Função para gerar tokens do Agora.io
const generateToken = (channelName, uid, role, expirationInSeconds) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};

// Criar uma sala
exports.createRoom = async (req, res) => {
  try {
    const channelName = uuidv4();
    const expirationInSeconds = 2 * 60 * 60; // 2 horas

    // Gera tokens para host e convidado
    const hostToken = generateToken(channelName, 1, RtcRole.PUBLISHER, expirationInSeconds);
    const guestToken = generateToken(channelName, 2, RtcRole.SUBSCRIBER, expirationInSeconds);

    // Salva a sala no banco
    await createRoom({
      channelName,
      hostToken,
      guestToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expirationInSeconds * 1000),
      isActive: true,
    });

    res.status(201).json({
      message: 'Sala criada com sucesso!',
      channelName,
      appId: APP_ID, // Adicionar appId na resposta
      host: {
        uid: 1, // Adicionar uid específico
        token: hostToken,
        role: 'host',
        url: `${FRONTEND_URL}/room/${channelName}?token=${hostToken}&role=host&uid=1`,
      },
      guest: {
        uid: 2, // Adicionar uid específico
        token: guestToken,
        role: 'guest',
        url: `${FRONTEND_URL}/room/${channelName}?token=${guestToken}&role=guest&uid=2`,
      },
      expirationInSeconds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar sala', error });
  }
};

// Verificar status de uma sala
exports.checkRoomStatus = async (req, res, next) => {
  try {
    const { channelName } = req.params;
    const room = await findRoomByChannelName(channelName);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Sala não encontrada ou expirada.' });
    }

    if (new Date() > room.expiresAt) {
      await deactivateRoom(channelName);
      return res.status(403).json({ message: 'Sala expirada.' });
    }

    next(); // Sala válida, continue
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar sala', error });
  }
};

// Adicionar novo endpoint para obter token
exports.getToken = async (req, res) => {
  try {
    const { channelName, uid, role } = req.query;
    const expirationInSeconds = 2 * 60 * 60; // 2 horas
    
    const rtcRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const token = generateToken(channelName, parseInt(uid), rtcRole, expirationInSeconds);

    res.status(200).json({
      token,
      appId: APP_ID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar token', error });
  }
};
