export type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
};

export type Ball = {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
};

export type GameState = {
  player1: Paddle;
  player2: Paddle;
  ball: Ball;
  score1: number;
  score2: number;
};