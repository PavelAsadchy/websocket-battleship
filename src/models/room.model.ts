export interface IShipPos {
  x: number;
  y: number;
}
export type TShip = 'small' | 'medium' | 'large' | 'huge';

export interface IShip {
  position: IShipPos;
  direction: boolean;
  length: number;
  type: TShip;
}

export interface IRoomPlayers {
  name: string;
  index: number;
  ships?: IShip[];
  shipsCells?: Set<string>[];
  attackMap?: Set<string>;
  attackVariations?: Set<string>;
  isTurn: boolean;
}
export interface IRoom {
  roomId: number;
  roomUsers: IRoomPlayers[];
}

export type TAttack = 'miss' | 'killed' | 'shot' | 'win' | 'empty';
