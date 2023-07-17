import { usersDB } from '../db/users';
import { roomsDB } from '../db/rooms';
import { WebSocket, Server as WebSocketServer } from 'ws';
import updateRoom from './room-update';
import { IUser } from '../models/user.model';

export default function createRoom(wss: WebSocketServer, userID: number) {
  for (const room of roomsDB.rooms.values()) {
    if (room.some((i) => i.index === userID)) return;
  }

  const thisUser = usersDB.getPlayerByID(userID) as IUser;
  roomsDB.createRoom({
    name: thisUser.name,
    index: thisUser.currentID,
    isTurn: false,
  });

  wss.clients.forEach((e: WebSocket) => e.send(JSON.stringify(updateRoom())));
}
