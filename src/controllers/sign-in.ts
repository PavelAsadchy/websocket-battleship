import { WebSocket } from 'ws';
import { usersDB } from '../db/users';
import { roomsDB } from '../db/rooms';
import updateRoom from './room-update';

function reg(
  ws: WebSocket,
  name: string,
  index: number,
  error = false,
  errorText = '',
) {
  const response = {
    type: 'reg',
    data: JSON.stringify({ name, index, error, errorText }),
    id: 0,
  };
  ws.send(JSON.stringify(response));
}

export default function signIn(data: string, ws: WebSocket, userId: number) {
  const { name, password } = JSON.parse(data);
  const isSign = usersDB.getPlayerByName(name);

  if (isSign) {
    if (password === isSign.password) {
      if (isSign.currentID > 0) {
        reg(ws, name, -1, true, 'Player with this name already exists');
      } else {
        usersDB.updateId(name, userId);
        reg(ws, name, userId);

        if (roomsDB.rooms.size) {
          ws.send(JSON.stringify(updateRoom()));
        }
      }
    } else {
      reg(ws, name, -1, true, 'Incorrect password');
    }
  } else {
    usersDB.addPlayer(name, password, userId);
    reg(ws, name, userId);

    if (roomsDB.rooms.size) {
      ws.send(JSON.stringify(updateRoom()));
    }
  }
}
