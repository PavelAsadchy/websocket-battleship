import { Server as WebSocketServer, WebSocket } from 'ws';
import { roomsDB } from '../db/rooms';
import { IRoomPlayers, TAttack } from '../models/room.model';
import { WebSocketWithId } from '../http_server/websocket';
import { winnersDB } from '../db/winners';
import updateRoom from './room-update';
import turn from './turn';

export function win(
  currentUser: IRoomPlayers,
  users: number[],
  gameId: number,
  indexPlayer: number,
  wss: WebSocketServer,
  ws: WebSocket,
  isSingle?: boolean,
): void {
  winnersDB.addWinner(currentUser.name);
  roomsDB.removeRoom(gameId);
  const winners = [];

  if (isSingle) {
    const response = {
      type: 'finish',
      data: JSON.stringify({
        winPlayer: indexPlayer,
      }),
      id: 0,
    };
    ws.send(JSON.stringify(response));

    return;
  }

  for (const [name, wins] of winnersDB.winners) winners.push({ name, wins });
  const responseWinners = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  for (const i of wss.clients) {
    const client = i as WebSocketWithId;
    if (users.includes(client.id)) {
      const client = i as WebSocketWithId;
      const response = {
        type: 'finish',
        data: JSON.stringify({
          winPlayer: indexPlayer,
        }),
        id: 0,
      };
      client.send(JSON.stringify(response));
    }
    client.send(JSON.stringify(updateRoom()));
    client.send(JSON.stringify(responseWinners));
  }
}

function reAttack(
  currentUser: IRoomPlayers,
  users: number[],
  gameId: number,
  pos: string,
  index: number,
  wss: WebSocketServer,
): boolean {
  let isReAttack = false;
  if (currentUser.attackMap) {
    isReAttack = currentUser.attackMap.has(pos);

    if (isReAttack) {
      for (const i of wss.clients) {
        const client = i as WebSocketWithId;

        if (users.includes(client.id)) {
          const client = i as WebSocketWithId;
          const responseTurn = {
            type: 'turn',
            data: JSON.stringify({
              currentPlayer: index,
            }),
            id: 0,
          };
          client.send(JSON.stringify(responseTurn));
          roomsDB.setTurn(gameId, client.id);
        }
      }
    }
  }

  return isReAttack;
}

export default function attack(
  data: string,
  wss: WebSocketServer,
  ws: WebSocket,
  random?: boolean,
) {
  const { gameId, x, y, indexPlayer } = JSON.parse(data);
  const room = roomsDB.rooms.get(gameId) as IRoomPlayers[];
  const currentUser = room.find((e) => e.index === indexPlayer) as IRoomPlayers;
  if (!currentUser.isTurn) return;

  let pos: string;
  if (random) {
    const variations = [...(currentUser.attackVariations as Set<string>)];
    const item = Math.floor(Math.random() * variations.length);
    pos = variations[item] as string;
  } else {
    pos = JSON.stringify({ x, y });
  }

  const users = room.map((e) => e.index);
  const index = users.find((e) => e !== indexPlayer) as number;
  const attackResult = roomsDB.setAttack(gameId, index, pos);
  const isSinglePlay = room.some((e) => !e.index);

  if (attackResult === 'empty') return;

  if (attackResult === 'win') {
    win(currentUser, users, gameId, indexPlayer, wss, ws, isSinglePlay);

    return;
  }

  if (isSinglePlay) {
    const isReAttack = !!currentUser.attackMap?.has(pos);
    if (!isReAttack) {
      const response = {
        type: 'attack',
        data: JSON.stringify({
          position: JSON.parse(pos),
          currentPlayer: indexPlayer,
          status: attackResult,
        }),
        id: 0,
      };
      ws.send(JSON.stringify(response));
    }

    if (attackResult === 'miss' || isReAttack) {
      const bot = room.find((e) => !e.index) as IRoomPlayers;
      const variationsBot = [...(bot.attackVariations as Set<string>)];
      let botAttack: TAttack = 'empty';

      while (botAttack !== 'miss') {
        ws.send(JSON.stringify(turn(0)));
        const itemBot = Math.floor(Math.random() * variationsBot.length);
        const botPos = variationsBot.splice(itemBot, 1)[0] as string;
        botAttack = roomsDB.setAttack(gameId, indexPlayer, botPos);

        if (botAttack === 'win') {
          const response = {
            type: 'finish',
            data: JSON.stringify({
              winPlayer: 0,
            }),
            id: 0,
          };
          ws.send(JSON.stringify(response));

          return;
        }

        const response = {
          type: 'attack',
          data: JSON.stringify({
            position: JSON.parse(botPos),
            currentPlayer: 0,
            status: botAttack,
          }),
          id: 0,
        };
        ws.send(JSON.stringify(response));
      }
    }

    ws.send(JSON.stringify(turn(indexPlayer)));
    roomsDB.setAttackMap(gameId, indexPlayer, pos);

    return;
  }

  if (reAttack(currentUser, users, gameId, pos, index, wss)) return;
  roomsDB.setAttackMap(gameId, indexPlayer, pos);

  for (const i of wss.clients) {
    const client = i as WebSocketWithId;
    if (users.includes(client.id)) {
      const response = {
        type: 'attack',
        data: JSON.stringify({
          position: JSON.parse(pos),
          currentPlayer: indexPlayer,
          status: attackResult,
        }),
        id: 0,
      };
      client.send(JSON.stringify(response));

      client.send(
        JSON.stringify(turn(attackResult === 'miss' ? index : indexPlayer)),
      );

      if (attackResult === 'miss') {
        roomsDB.setTurn(gameId, client.id);
      }
    }
  }
}
