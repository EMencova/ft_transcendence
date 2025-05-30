type Paddle = {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
};

type AI = {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    calculateMove: (gameState: any) => any
};

type Ball = {
    x: number;
    y: number;
    radius: number;
    velocityX: number;
    velocityY: number;
    speed: number;
};

type GameState1 = {
    gameType: string;
    player1: Paddle;
    player2: AI;
    ball: Ball;
    score1: number;
    score2: number;
};

type GameState2 = {
    gameType: string;
    player1: Paddle;
    player2: Paddle;
    ball: Ball;
    score1: number;
    score2: number;
};

type GameState4 = {
    gameType: string;
    player1: Paddle;
    player2: Paddle;
    player3: Paddle;
    player4: Paddle;
    ball: Ball;
    score1: number;
    score2: number;
    score3: number;
    score4: number;
};

export type { Paddle, Ball, AI, GameState1, GameState2, GameState4 };