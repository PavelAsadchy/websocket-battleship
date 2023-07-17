import { Server as WebSocketServer, WebSocket } from 'ws';
import { roomsDB } from '../db/rooms';
import updateRoom from './room-update';
import { win } from './attack';
import { usersDB } from '../db/users';
import { WebSocketWithId } from '../http_server/websocket';

export default function logout(wss: WebSocketServer, userID: number) {
  for (const [key, value] of roomsDB.rooms) {
    if (value.some((i) => i.index === userID)) {
      const secondUser = value.find((i) => i.index !== userID);
      const withBot = secondUser ? !secondUser.index : false;

      if (value.length < 2 || withBot) {
        roomsDB.removeRoom(key);
        wss.clients.forEach((e: WebSocket) =>
          e.send(JSON.stringify(updateRoom())),
        );

        break;
      } else {
        if (!secondUser) break;

        for (const i of wss.clients) {
          const client = i as WebSocketWithId;
          if (client.id === secondUser.index) {
            win(secondUser, [client.id, userID], key, client.id, wss, client);
          }
        }
      }
    }
  }

  usersDB.exitPlayer(userID);
}
