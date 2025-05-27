import { Ball, Paddle, GameState } from "./types_del";

const keysPressed: Record<string, boolean> = {};

export function startGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const paddleWidth = 10, paddleHeight = 100, ballRadius = 10;
  let state: GameState = {
    player1: { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
    player2: { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
    ball: { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, velocityX: 4, velocityY: 4, speed: 5 },
    score1: 0,
    score2: 0,
  };

  document.addEventListener('keydown', e => keysPressed[e.key] = true);
  document.addEventListener('keyup', e => keysPressed[e.key] = false);

  function movePaddles() {
    // W/S for player 1
    if (keysPressed['w'] && state.player1.y > 0) {
      state.player1.y -= state.player1.speed;
    }
    if (keysPressed['s'] && state.player1.y < canvas.height - state.player1.height) {
      state.player1.y += state.player1.speed;
    }
    // Up/Down for player 2
    if (keysPressed['ArrowUp'] && state.player2.y > 0) {
      state.player2.y -= state.player2.speed;
    }
    if (keysPressed['ArrowDown'] && state.player2.y < canvas.height - state.player2.height) {
      state.player2.y += state.player2.speed;
    }
  }

  function resetBall() {
    state.ball.x = canvas.width / 2;
    state.ball.y = canvas.height / 2;
    state.ball.velocityX = -state.ball.velocityX;
    state.ball.velocityY = 4 * (Math.random() > 0.5 ? 1 : -1);
  }

  function detectCollision(paddle: Paddle, ball: Ball): boolean {
    return (
      ball.x - ball.radius < paddle.x + paddle.width &&
      ball.x + ball.radius > paddle.x &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.y + ball.radius > paddle.y
    );
  }

  function update() {
    movePaddles();

    state.ball.x += state.ball.velocityX;
    state.ball.y += state.ball.velocityY;

    // Wall collision
    if (state.ball.y < 0 || state.ball.y > canvas.height) state.ball.velocityY *= -1;

    // Paddle collisions
    if (detectCollision(state.player1, state.ball)) {
      state.ball.velocityX = Math.abs(state.ball.velocityX);
    } else if (detectCollision(state.player2, state.ball)) {
      state.ball.velocityX = -Math.abs(state.ball.velocityX);
    }

    // Scoring
    if (state.ball.x < 0) {
      state.score2++;
      resetBall();
    }
    if (state.ball.x > canvas.width) {
      state.score1++;
      resetBall();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";

    // paddles
    ctx.fillRect(state.player1.x, state.player1.y, state.player1.width, state.player1.height);
    ctx.fillRect(state.player2.x, state.player2.y, state.player2.width, state.player2.height);

    // ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // scores
    ctx.font = "30px Arial";
    ctx.fillText(`${state.score1}`, canvas.width / 4, 50);
    ctx.fillText(`${state.score2}`, 3 * canvas.width / 4, 50);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
}