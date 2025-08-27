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
    player1: Paddle; // Left side, top quarter
    player2: Paddle; // Right side, top quarter  
    player3: Paddle; // Left side, bottom quarter
    player4: Paddle; // Right side, bottom quarter
    ball: Ball;
    teamLeftScore: number;  // Team 1 (players 1 & 3)
    teamRightScore: number; // Team 2 (players 2 & 4)
};

export type { Paddle, Ball, AI, GameState1, GameState2, GameState4 };