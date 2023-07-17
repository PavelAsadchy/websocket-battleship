import { usersDB } from '../users';
import { IRoomPlayers, IShip, TAttack } from '../../models/room.model';
import { IUser } from '../../models/user.model';

const allCells = new Array(10)
  .fill(0)
  .map((_, i) =>
    new Array(10).fill(0).map((_, j) => JSON.stringify({ x: i, y: j })),
  )
  .flat(1);

export const roomsDB = {
  rooms: new Map() as Map<number, IRoomPlayers[]>,

  createRoom(user: IRoomPlayers, bot?: boolean): number {
    const roomId = Date.now() * (bot ? -1 : 1);
    const roomUsers = [user] as IRoomPlayers[];
    this.rooms.set(roomId, roomUsers);

    return roomId;
  },

  addUserToRoom(roomId: number, userId: number): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      const userName = (usersDB.getPlayerByID(userId) as IUser).name;
      const isAdded = room.find((user) => user.index === userId);
      if (isAdded || room.length >= 2) return false;

      room.push({
        name: userName,
        index: userId,
        isTurn: false,
      });

      return true;
    }

    return false;
  },

  setShips(
    roomId: number,
    userId: number,
    ships: IShip[],
    shipsCells: Set<string>[],
  ): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    const user = room.find((user) => user.index === userId);
    if (!user) return 0;

    user.ships = ships;
    user.shipsCells = shipsCells;
    user.attackVariations = new Set<string>(allCells);

    return room.reduce((s, c) => s + +!!c.ships, 0);
  },

  setAttack(roomId: number, userId: number, position: string): TAttack {
    let res: TAttack = 'empty';
    const room = this.rooms.get(roomId);
    if (!room) return res;

    const user = room.find((user) => user.index === userId);
    const currentUser = room.find(
      (user) => user.index !== userId,
    ) as IRoomPlayers;
    if (!user) return res;

    const ships = user.shipsCells;
    if (!ships) return res;

    res = 'miss';
    const variations = currentUser.attackVariations;
    if (variations) {
      if (variations.has(position)) variations.delete(position);
    }

    for (let i = 0; i < ships.length; i += 1) {
      const shipCells = ships[i];
      if (!shipCells) continue;

      if (shipCells.has(position)) {
        res = 'shot';
        shipCells.delete(position);
        if (!shipCells.size) {
          ships.splice(i, 1);
          res = 'killed';
          break;
        }
      }
    }
    if (!ships.length) res = 'win';

    return res;
  },

  setTurn(roomId: number, userId: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.find((user) => user.index === userId);
    if (!user) return;

    user.isTurn = !user.isTurn;
    return user.isTurn;
  },

  setAttackMap(roomId: number, userId: number, position: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.find((user) => user.index === userId);
    if (!user) return;

    if (!user.attackMap) user.attackMap = new Set<string>();
    user.attackMap.add(position);
  },

  removeRoom(roomId: number) {
    if (this.rooms.get(roomId)) this.rooms.delete(roomId);
  },
};
