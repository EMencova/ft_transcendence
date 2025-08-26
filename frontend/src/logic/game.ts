import type { AI, Ball, GameState1, GameState2, GameState4, Paddle } from "../../types/types.ts"

const keysPressed: Record<string, boolean> = {}

const DIFFICULTY = {
  easy: { errorRange: 100 },
  medium: { errorRange: 40 },
  hard: { errorRange: 10 }
}

const paddleWidth = 10, paddleHeight = 100, ballRadius = 10

let gamePaused = true
let animationId: number

export function startGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gameType: string, difficulty: string) {

  const AI_DIFFICULTY = DIFFICULTY[difficulty as keyof typeof DIFFICULTY]

  let state: GameState1 | GameState2 | GameState4

  if (gameType === "Pong1") {
    state = {
      gameType: "Pong1",
      player1: { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
      player2: {
        x: canvas.width - paddleWidth,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        speed: 7,
        calculateMove: (gameState) => {
          const ai = gameState.player2
          const ball = gameState.ball
          const bias = (Math.random() - 0.5) * AI_DIFFICULTY.errorRange
          const targetY = ball.y + bias
          if (ai.y + ai.height / 2 < targetY) return { direction: 'down' }
          else if (ai.y + ai.height / 2 > targetY) return { direction: 'up' }
          return { direction: 'none' }
        }
      },
      ball: { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, velocityX: 4, velocityY: 4, speed: 5 },
      score1: 0,
      score2: 0,
    }
  } else if (gameType === "Pong2") {
    state = {
      gameType: "Pong2",
      player1: { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
      player2: { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
      ball: { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, velocityX: 4, velocityY: 4, speed: 5 },
      score1: 0,
      score2: 0,
    }
  } else {
    state = {
      gameType: "Pong4",
      player1: { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
      player2: { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 },
      player3: { x: canvas.width / 2 - 50, y: 0, width: 100, height: 10, speed: 7 },
      player4: { x: canvas.width / 2 - 50, y: canvas.height - 10, width: 100, height: 10, speed: 7 },
      ball: { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, velocityX: 4, velocityY: 4, speed: 5 },
      score1: 0,
      score2: 0,
      score3: 0,
      score4: 0,
    }
  }

    document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    keysPressed[e.key] = true;
  });

  document.addEventListener("keyup", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    keysPressed[e.key] = false;
  });
  
  // document.addEventListener("keydown", (e) => (keysPressed[e.key] = true))
  // document.addEventListener("keyup", (e) => (keysPressed[e.key] = false))
  window.addEventListener('pauseStateChanged', (e: any) => {
    gamePaused = e.detail.paused
  })

  function movePaddles() {
    if (keysPressed["w"] && state.player1.y > 0) state.player1.y -= state.player1.speed
    if (keysPressed["s"] && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed

    if (state.gameType === "Pong2") {
      if (keysPressed["ArrowUp"] && state.player2.y > 0) state.player2.y -= state.player2.speed
      if (keysPressed["ArrowDown"] && state.player2.y < canvas.height - state.player2.height) state.player2.y += state.player2.speed
    }

    if (state.gameType === "Pong4") {
      const s = state as GameState4
      if (keysPressed["z"] && s.player3.x > 0) s.player3.x -= s.player3.speed
      if (keysPressed["x"] && s.player3.x < canvas.width - s.player3.width) s.player3.x += s.player3.speed
      if (keysPressed["n"] && s.player4.x > 0) s.player4.x -= s.player4.speed
      if (keysPressed["m"] && s.player4.x < canvas.width - s.player4.width) s.player4.x += s.player4.speed
    }

    if (state.gameType === "Pong1") {
      const move = (state.player2 as AI).calculateMove(state)
      if (move.direction === 'up' && state.player2.y > 0) state.player2.y -= state.player2.speed
      if (move.direction === 'down' && state.player2.y < canvas.height - state.player2.height) state.player2.y += state.player2.speed
    }
  }

  function resetBall() {
    state.ball.x = canvas.width / 2
    state.ball.y = canvas.height / 2
    state.ball.velocityX = -state.ball.velocityX
    state.ball.velocityY = 4 * (Math.random() > 0.5 ? 1 : -1)
  }

  function detectCollision(paddle: Paddle, ball: Ball): boolean {
    return (
      ball.x - ball.radius < paddle.x + paddle.width &&
      ball.x + ball.radius > paddle.x &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.y + ball.radius > paddle.y
    )
  }

  function update() {
    movePaddles()
    state.ball.x += state.ball.velocityX
    state.ball.y += state.ball.velocityY
    if (state.ball.y < 0 || state.ball.y > canvas.height) state.ball.velocityY *= -1
    if (detectCollision(state.player1, state.ball)) {
      state.ball.velocityX = Math.abs(state.ball.velocityX)
    } else if (detectCollision(state.player2, state.ball)) {
      state.ball.velocityX = -Math.abs(state.ball.velocityX)
    }
    if (state.ball.x < 0) {
      state.score2++
      resetBall()
    } else if (state.ball.x > canvas.width) {
      state.score1++
      resetBall()
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "orange"
    ctx.fillRect(state.player1.x, state.player1.y, state.player1.width, state.player1.height)
    ctx.fillRect(state.player2.x, state.player2.y, state.player2.width, state.player2.height)
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      ctx.fillRect(s.player3.x, s.player3.y, s.player3.width, s.player3.height)
      ctx.fillRect(s.player4.x, s.player4.y, s.player4.width, s.player4.height)
    }

    // draw ball
    ctx.beginPath()
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()

    //middle line
    ctx.strokeStyle = "white"
    ctx.setLineDash([10, 15])

    //write scores
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    ctx.font = "30px Arial"
    ctx.fillText(`${state.score1}`, canvas.width / 4, 50)
    ctx.fillText(`${state.score2}`, 3 * canvas.width / 4, 50)
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      ctx.fillText(`${s.score3}`, canvas.width * 2 / 3, 50)
      ctx.fillText(`${s.score4}`, 3 * canvas.width / 8, 50)
    }
  }

  function loop() {
    if (!gamePaused) update()
    draw()
    animationId = requestAnimationFrame(loop)
  }
  // Start the game loop
  gamePaused = false
  loop()
}

export function stopGame() {
  cancelAnimationFrame(animationId)
}