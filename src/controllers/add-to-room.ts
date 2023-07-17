import { roomsDB } from '../db/rooms';
import { WebSocketWithId } from '../http_server/websocket';
import { IRoomPlayers } from '../models/room.model';
import { Server as WebSocketServer } from 'ws';
import updateRoom from './room-update';

export default function addToRoom(
  data: string,
  wss: WebSocketServer,
  userId: number,
) {
  const { indexRoom } = JSON.parse(data);
  const success = roomsDB.addUserToRoom(indexRoom, userId);
  if (success) {
    const users = (roomsDB.rooms.get(indexRoom) as IRoomPlayers[]).map(
      (e) => e.index,
    );

    for (const i of wss.clients) {
      const client = i as WebSocketWithId;
      if (users.includes(client.id)) {
        const response = {
          type: 'create_game',
          data: JSON.stringify({
            idGame: indexRoom,
            idPlayer: client.id,
          }),
          id: 0,
        };
        client.send(JSON.stringify(response));
      } else {
        client.send(JSON.stringify(updateRoom()));
      }
    }
  }
}
