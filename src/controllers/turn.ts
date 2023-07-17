interface ITurn {
  type: 'turn';
  data: string;
  id: 0;
}

export default function turn(userID: number): ITurn {
  return {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: userID,
    }),
    id: 0,
  };
}
