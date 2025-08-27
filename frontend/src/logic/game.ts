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
let pauseStateListener: ((e: any) => void) | null = null

// Win conditions
let WIN_SCORE = 5 // Default win score

export function startGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gameType: string, difficulty: string, winScore: number = 5) {
  WIN_SCORE = winScore // Set the win score for this game

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
    // 4-player team mode: 2v2 like table tennis
    // Left team: Player 1 (top quarter) + Player 3 (bottom quarter)  
    // Right team: Player 2 (top quarter) + Player 4 (bottom quarter)
    const quarterHeight = canvas.height / 4
    state = {
      gameType: "Pong4",
      // Left side paddles
      player1: { x: 0, y: quarterHeight - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 }, // Left top
      player3: { x: 0, y: 3 * quarterHeight - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 }, // Left bottom
      // Right side paddles  
      player2: { x: canvas.width - paddleWidth, y: quarterHeight - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 }, // Right top
      player4: { x: canvas.width - paddleWidth, y: 3 * quarterHeight - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 7 }, // Right bottom
      ball: { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, velocityX: 4, velocityY: 4, speed: 5 },
      teamLeftScore: 0,  // Team 1: Players 1 & 3
      teamRightScore: 0, // Team 2: Players 2 & 4
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
  
  // Remove existing pause listener if it exists
  if (pauseStateListener) {
    window.removeEventListener('pauseStateChanged', pauseStateListener)
  }
  
  // Create and add new pause listener
  pauseStateListener = (e: any) => {
    const oldState = gamePaused
    gamePaused = e.detail.paused
    console.log(`Game pause state changed: ${oldState} -> ${gamePaused}`) // Enhanced debug log
  }
  window.addEventListener('pauseStateChanged', pauseStateListener)

  function movePaddles() {
    if (state.gameType === "Pong1") {
      // 1-player mode: only Player 1 controlled by human
      if (keysPressed["w"] && state.player1.y > 0) state.player1.y -= state.player1.speed
      if (keysPressed["s"] && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed
    } else if (state.gameType === "Pong2") {
      // 2-player mode: both players controlled by humans
      if (keysPressed["w"] && state.player1.y > 0) state.player1.y -= state.player1.speed
      if (keysPressed["s"] && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed
      
      if (keysPressed["ArrowUp"] && state.player2.y > 0) state.player2.y -= state.player2.speed
      if (keysPressed["ArrowDown"] && state.player2.y < canvas.height - state.player2.height) state.player2.y += state.player2.speed
    } else if (state.gameType === "Pong4") {
      // 4-player team mode: constrained movement for each quarter
      const s = state as GameState4
      
      // Player 1 (left side, top quarter) - W/S keys
      if (keysPressed["w"] && s.player1.y > 0) s.player1.y -= s.player1.speed
      if (keysPressed["s"] && s.player1.y < canvas.height / 2 - s.player1.height) s.player1.y += s.player1.speed
      
      // Player 2 (right side, top quarter) - Arrow Up/Down keys
      if (keysPressed["ArrowUp"] && s.player2.y > 0) s.player2.y -= s.player2.speed
      if (keysPressed["ArrowDown"] && s.player2.y < canvas.height / 2 - s.player2.height) s.player2.y += s.player2.speed
      
      // Player 3 (left side, bottom quarter) - Z/X keys  
      if (keysPressed["z"] && s.player3.y > canvas.height / 2) s.player3.y -= s.player3.speed
      if (keysPressed["x"] && s.player3.y < canvas.height - s.player3.height) s.player3.y += s.player3.speed
      
      // Player 4 (right side, bottom quarter) - N/M keys
      if (keysPressed["n"] && s.player4.y > canvas.height / 2) s.player4.y -= s.player4.speed
      if (keysPressed["m"] && s.player4.y < canvas.height - s.player4.height) s.player4.y += s.player4.speed
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

  function checkWinCondition() {
    if (state.gameType === "Pong1" || state.gameType === "Pong2") {
      const s = state as GameState1 | GameState2
      if (s.score1 >= WIN_SCORE) {
        endGame("Player 1 Wins!")
        return true
      } else if (s.score2 >= WIN_SCORE) {
        endGame(state.gameType === "Pong1" ? "AI Wins!" : "Player 2 Wins!")
        return true
      }
    } else if (state.gameType === "Pong4") {
      const s = state as GameState4
      if (s.teamLeftScore >= WIN_SCORE) {
        endGame("Left Team Wins! (Players 1 & 3)")
        return true
      } else if (s.teamRightScore >= WIN_SCORE) {
        endGame("Right Team Wins! (Players 2 & 4)")
        return true
      }
    }
    return false
  }

  function endGame(winnerMessage: string) {
    gamePaused = true
    setTimeout(() => {
      alert(winnerMessage)
      window.dispatchEvent(new CustomEvent('resetGame'))
    }, 500) // Small delay to show the final score
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
    
    // Wall collisions for 2-player games
    if (state.gameType !== "Pong4") {
      if (state.ball.y < 0 || state.ball.y > canvas.height) state.ball.velocityY *= -1
    }
    
    // Paddle collisions
    if (detectCollision(state.player1, state.ball)) {
      state.ball.velocityX = Math.abs(state.ball.velocityX)
    } else if (detectCollision(state.player2, state.ball)) {
      state.ball.velocityX = -Math.abs(state.ball.velocityX)
    }
    
    // 4-player team mode collisions
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      if (detectCollision(s.player3, state.ball)) {
        state.ball.velocityX = Math.abs(state.ball.velocityX)
      } else if (detectCollision(s.player4, state.ball)) {
        state.ball.velocityX = -Math.abs(state.ball.velocityX)
      }
    }
    
    // Team-based scoring for 4-player mode
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      
      // Ball bounces off top and bottom walls
      if (state.ball.y < 0 || state.ball.y > canvas.height) {
        state.ball.velocityY *= -1
      }
      
      // Team scoring when ball goes past left or right walls
      if (state.ball.x < 0) {
        // Ball went past left team, right team scores
        s.teamRightScore++
        if (!checkWinCondition()) {
          resetBall()
        }
      } else if (state.ball.x > canvas.width) {
        // Ball went past right team, left team scores  
        s.teamLeftScore++
        if (!checkWinCondition()) {
          resetBall()
        }
      }
    } else {
      // Original scoring for 1P/2P modes
      if (state.ball.x < 0) {
        if (state.gameType === "Pong1" || state.gameType === "Pong2") {
          const s = state as GameState1 | GameState2
          s.score2++
        }
        if (!checkWinCondition()) {
          resetBall()
        }
      } else if (state.ball.x > canvas.width) {
        if (state.gameType === "Pong1" || state.gameType === "Pong2") {
          const s = state as GameState1 | GameState2
          s.score1++
        }
        if (!checkWinCondition()) {
          resetBall()
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Fill background
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw paddles
    ctx.fillStyle = "orange"
    ctx.fillRect(state.player1.x, state.player1.y, state.player1.width, state.player1.height)
    ctx.fillRect(state.player2.x, state.player2.y, state.player2.width, state.player2.height)
    
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      ctx.fillRect(s.player3.x, s.player3.y, s.player3.width, s.player3.height)
      ctx.fillRect(s.player4.x, s.player4.y, s.player4.width, s.player4.height)
    }

    // Draw ball
    ctx.beginPath()
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()

    // Draw middle line
    ctx.strokeStyle = "white"
    ctx.setLineDash([10, 15])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()

    // Draw scores
    ctx.font = "30px Arial"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    
    if (state.gameType === "Pong4") {
      const s = state as GameState4
      // Team-based score layout for 4-player mode
      ctx.fillText(`Left Team: ${s.teamLeftScore}`, canvas.width / 4, 50)
      ctx.fillText(`Right Team: ${s.teamRightScore}`, (3 * canvas.width) / 4, 50)
      
      // Show player assignments
      ctx.font = "14px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fillText(`Players 1 & 3`, canvas.width / 4, 75)
      ctx.fillText(`Players 2 & 4`, (3 * canvas.width) / 4, 75)
    } else {
      // Individual score layout for 1P/2P modes
      const s = state as GameState1 | GameState2
      ctx.fillText(`${s.score1}`, canvas.width / 4, 50)
      ctx.fillText(`${s.score2}`, (3 * canvas.width) / 4, 50)
    }
    
    // Draw target score indicator
    ctx.font = "16px Arial"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.textAlign = "center"
    ctx.fillText(`First to ${WIN_SCORE}`, canvas.width / 2, canvas.height - 20)
    
    // Show team controls in 4-player mode
    if (state.gameType === "Pong4") {
      ctx.font = "12px Arial"
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
      ctx.textAlign = "left"
      ctx.fillText("Left Team: Player 1 (W/S), Player 3 (Z/X)", 10, canvas.height - 40)
      ctx.textAlign = "right"
      ctx.fillText("Right Team: Player 2 (↑/↓), Player 4 (N/M)", canvas.width - 10, canvas.height - 40)
      ctx.textAlign = "center"
    }
    
    // Reset line dash for other drawings
    ctx.setLineDash([])
  }

  function loop() {
    if (!gamePaused) update()
    draw()
    animationId = requestAnimationFrame(loop)
  }
  
  // Start the game loop
  console.log('Starting game with initial pause state:', gamePaused) // Debug log
  gamePaused = false
  loop()
}

export function stopGame() {
  cancelAnimationFrame(animationId)
  
  // Clean up the pause state listener
  if (pauseStateListener) {
    window.removeEventListener('pauseStateChanged', pauseStateListener)
    pauseStateListener = null
  }
  
  // Reset pause state
  gamePaused = true
}