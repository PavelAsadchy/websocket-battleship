import { Server as WebSocketServer, WebSocket } from 'ws';
import { roomsDB } from '../db/rooms';
import updateRoom from './room-update';
import { usersDB } from '../db/users';
import { IUser } from '../models/user.model';

export default function singlePlayer(
  wss: WebSocketServer,
  ws: WebSocket,
  userId: number,
) {
  for (const [key, value] of roomsDB.rooms) {
    if (value.some((i) => i.index === userId)) {
      roomsDB.removeRoom(key);
      wss.clients.forEach((e: WebSocket) =>
        e.send(JSON.stringify(updateRoom())),
      );

      break;
    }
  }

  const thisUser = usersDB.getPlayerByID(userId) as IUser;
  const indexRoom = roomsDB.createRoom(
    {
      name: thisUser.name,
      index: thisUser.currentID,
      isTurn: true,
    },
    true,
  );
  roomsDB.addUserToRoom(indexRoom, 0);

  const response = {
    type: 'create_game',
    data: JSON.stringify({
      idGame: indexRoom,
      idPlayer: userId,
    }),
    id: 0,
  };
  ws.send(JSON.stringify(response));
}
