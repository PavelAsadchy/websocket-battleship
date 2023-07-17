export const winnersDB = {
  winners: new Map() as Map<string, number>,

  addWinner(name: string): void {
    const winners = this.winners;
    winners.set(name, (winners.get(name) || 0) + 1);
  },
};
