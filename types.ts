
export interface User {
  email: string;
  isPaid: boolean;
  password?: string;
  gameProgress: number;
  ownedModules?: string[];
}

export enum GameState {
  THE_DIVE = 'THE_DIVE',
  PLAYING = 'PLAYING',
}

export interface LevelData {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
}
