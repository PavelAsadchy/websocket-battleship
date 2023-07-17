import { IShip, TShip } from '../models/room.model';

function getPosition(): { x: number; y: number } {
  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);

  return { x, y };
}

function getLength(type: TShip): number {
  switch (type) {
    case 'small':
      return 1;
    case 'medium':
      return 2;
    case 'large':
      return 3;
    case 'huge':
      return 4;
    default:
      return 0;
  }
}

//TODO
//need fixes for logic
function isValidShip(ship: IShip, ships: IShip[], length: number): boolean {
  const { x, y } = ship.position;

  if (ship.direction) {
    if (y < 0 || y + length > 10) {
      return false;
    }
  } else {
    if (x < 0 || x + length > 10) {
      return false;
    }
  }

  const cells = new Set<string>();
  for (const item of ships) {
    const { x, y } = item.position;
    for (let i = -1; i <= item.length; i += 1) {
      const cell1 = JSON.stringify(
        item.direction ? { x, y: y + i } : { x: x + i, y },
      );
      const cell2 = JSON.stringify(
        item.direction ? { x: x + 1, y: y + i } : { x: x + i, y: y + 1 },
      );
      const cell3 = JSON.stringify(
        item.direction ? { x: x - 1, y: y + i } : { x: x + i, y: y - 1 },
      );
      cells.add(cell1);
      cells.add(cell2);
      cells.add(cell3);
    }
  }

  for (let i = 0; i < ship.length; i += 1) {
    const cell = JSON.stringify(
      ship.direction ? { x, y: y + i } : { x: x + i, y },
    );

    if (cells.has(cell)) return false;
  }

  return true;
}

export default function randomShips(): IShip[] {
  const ships: IShip[] = [];
  const shipTypes: TShip[] = ['small', 'medium', 'large', 'huge'];
  const shipCounts = { huge: 1, large: 2, medium: 3, small: 4 };

  for (const type of shipTypes) {
    const count = shipCounts[type];

    for (let i = 0; i < count; i++) {
      const len = getLength(type);
      const ship: IShip = {
        position: getPosition(),
        direction: !Math.round(Math.random()),
        type: type,
        length: len,
      };

      while (!isValidShip(ship, ships, len)) {
        ship.position = getPosition();
        ship.direction = !Math.round(Math.random());
      }

      ships.push(ship);
    }
  }

  return ships;
}
