import { Server as WebSocketServer, WebSocket } from 'ws';
import { roomsDB } from '../db/rooms';
import { IRoomPlayers, IShip } from '../models/room.model';
import { WebSocketWithId } from '../http_server/websocket';
import turn from './turn';
import randomShips from '../utils/random-ships';

export default function addShips(
  data: string,
  wss: WebSocketServer,
  ws: WebSocket,
) {
  const { gameId, ships, indexPlayer } = JSON.parse(data);
  const shipsList = getShipsList(ships);
  const shipsCount = roomsDB.setShips(gameId, indexPlayer, ships, shipsList);
  const room = roomsDB.rooms.get(gameId) as IRoomPlayers[];
  const isSinglePlay = room.some((e) => !e.index);

  if (isSinglePlay) {
    const random = randomShips();
    const randomList = getShipsList(random);
    roomsDB.setShips(gameId, 0, random, randomList);
    const response = {
      type: 'start_game',
      data: JSON.stringify({
        ships: ships,
        currentPlayerIndex: indexPlayer,
      }),
      id: 0,
    };
    ws.send(JSON.stringify(response));
    ws.send(JSON.stringify(turn(indexPlayer)));

    return;
  }

  if (shipsCount === 2) {
    const users = room.map((e) => e.index);
    const currentTurn: number = users[Math.round(Math.random())] as number;
    roomsDB.setTurn(gameId, currentTurn);

    for (const i of wss.clients) {
      const client = i as WebSocketWithId;
      if (users.includes(client.id)) {
        const thisShips = (
          room.find((e) => e.index === client.id) as IRoomPlayers
        ).ships;
        if (!thisShips) continue;

        const response = {
          type: 'start_game',
          data: JSON.stringify({
            ships: thisShips,
            currentPlayerIndex: client.id,
          }),
          id: 0,
        };
        client.send(JSON.stringify(response));
        client.send(JSON.stringify(turn(currentTurn)));
      }
    }
  }
}

function getShipsList(ships: IShip[]): Set<string>[] {
  const shipsList = [];
  for (const ship of ships) {
    const { x, y } = ship.position;
    const shipCells = new Set() as Set<string>;
    if (ship.direction) {
      for (let i = 0; i < ship.length; i += 1) {
        shipCells.add(JSON.stringify({ x, y: y + i }));
      }
    } else {
      for (let i = 0; i < ship.length; i += 1) {
        shipCells.add(JSON.stringify({ x: x + i, y }));
      }
    }
    shipsList.push(shipCells);
  }

  return shipsList;
}
