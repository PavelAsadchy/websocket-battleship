import { httpServer } from './index';
import { WebSocket, Server as WebSocketServer } from 'ws';
import signIn from '../controllers/sign-in';
import createRoom from '../controllers/room-create';
import addToRoom from '../controllers/add-to-room';
import addShips from '../controllers/add-ships';
import attack from '../controllers/attack';
import singlePlayer from '../controllers/single-play';
import logout from '../controllers/logout';

export interface WebSocketWithId extends WebSocket {
  id: number;
}

export default function addWebsocket() {
  const wss: WebSocketServer = new WebSocket.Server({ server: httpServer });

  wss.on('connection', function connection(ws: WebSocketWithId) {
    ws.id = Date.now();
    ws.on('message', function incoming(message: string) {
      try {
        const mes = JSON.parse(message);
        console.log(mes.type);

        switch (mes.type) {
          case 'reg':
            signIn(mes.data, ws, ws.id);
            break;
          case 'create_room':
            createRoom(wss, ws.id);
            break;
          case 'add_user_to_room':
            addToRoom(mes.data, wss, ws.id);
            break;
          case 'add_ships':
            addShips(mes.data, wss, ws);
            break;
          case 'attack':
            attack(mes.data, wss, ws);
            break;
          case 'randomAttack':
            attack(mes.data, wss, ws, true);
            break;
          case 'single_play':
            singlePlayer(wss, ws, ws.id);
            break;
          default:
            console.log('Unknown message:', mes.type);
            break;
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });

    ws.on('close', function () {
      logout(wss, ws.id);
    });
  });
}
