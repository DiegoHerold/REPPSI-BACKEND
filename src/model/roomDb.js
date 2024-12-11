

const { connect, ObjectId } = require('./db');

const ROOM_COLLECTION = 'Salas';

// Criar uma sala
async function createRoom(data) {
  const db = await connect();
  return db.collection(ROOM_COLLECTION).insertOne(data);
}

// Buscar uma sala por `channelName`
async function findRoomByChannelName(channelName) {
  const db = await connect();
  return db.collection(ROOM_COLLECTION).findOne({ channelName });
}

// Marcar uma sala como inativa
async function deactivateRoom(channelName) {
  const db = await connect();
  return db.collection(ROOM_COLLECTION).updateOne(
    { channelName },
    { $set: { isActive: false } }
  );
}

// Remover salas expiradas
async function removeExpiredRooms() {
  const db = await connect();
  const now = new Date();
  return db.collection(ROOM_COLLECTION).deleteMany({ expiresAt: { $lt: now } });
}

module.exports = {
  createRoom,
  findRoomByChannelName,
  deactivateRoom,
  removeExpiredRooms,
};
