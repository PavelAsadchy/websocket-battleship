import { roomsDB } from '../db/rooms';
import { IRoom } from '../models/room.model';

interface IUpdateRoom {
  type: 'update_room';
  data: string;
  id: 0;
}

export default function updateRoom(): IUpdateRoom {
  const roomsList = [] as IRoom[];
  for (const [roomId, roomUsers] of roomsDB.rooms) {
    if (roomId > 0) roomsList.push({ roomId, roomUsers });
  }

  return {
    type: 'update_room',
    data: JSON.stringify(roomsList),
    id: 0,
  };
}
