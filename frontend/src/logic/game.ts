import type { AI, Ball, GameState1, GameState2, GameState4, Paddle } from "../../types/types.ts"

const keysPressed: Record<string, boolean> = {}

const DIFFICULTY = {
  easy: { 
    errorRange: 120,
    reactionDelay: 15,    // AI takes 15 frames to react to ball direction changes
    predictionAccuracy: 0.3,  // 30% chance to predict ball trajectory correctly
    maxSpeed: 4,         // Slower than human players
    lagTime: 3,          // Additional lag every few frames
    missChance: 0.15     // 15% chance to completely miss fast balls
  },
  medium: { 
    errorRange: 100,
    reactionDelay: 8,
    predictionAccuracy: 0.45,
    maxSpeed: 5,
    lagTime: 2,
    missChance: 0.13
  },
  hard: { 
    errorRange: 80,
    reactionDelay: 3,
    predictionAccuracy: 0.5,
    maxSpeed: 6,
    lagTime: 1,
    missChance: 0.10
  }
}

const paddleWidth = 10, paddleHeight = 100, ballRadius = 10

let gamePaused = true
let animationId: number
let pauseStateListener: ((e: any) => void) | null = null

// AI state tracking
let aiState = {
  lastBallX: 0,
  lastBallY: 0,
  reactionCounter: 0,
  targetY: 0,
  isTracking: false,
  lagCounter: 0,
  lastBallVelocityX: 0,
  currentMovementMultiplier: 1.0, // Track current lag state
  jitterOffset: 0, // Small random movement during lag
  jitterDirection: 1 // Direction of jitter movement
}

// Win conditions
let WIN_SCORE = 5 // Default win score

export function startGame(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, gameType: string, difficulty: string, winScore: number = 5) {
  WIN_SCORE = winScore // Set the win score for this game
  
  // Reset AI state for new game
  aiState = {
    lastBallX: 0,
    lastBallY: 0,
    reactionCounter: 0,
    targetY: 0,
    isTracking: false,
    lagCounter: 0,
    lastBallVelocityX: 0,
    currentMovementMultiplier: 1.0,
    jitterOffset: 0,
    jitterDirection: 1
  }

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
        speed: AI_DIFFICULTY.maxSpeed, // AI has limited speed
// Replace the entire calculateMove function with this improved version
calculateMove: (gameState) => {
  const ai = gameState.player2
  const ball = gameState.ball
  
  // Reset AI state when ball is in center area
  const ballInCenter = Math.abs(ball.x - canvas.width / 2) < 50 && Math.abs(ball.y - canvas.height / 2) < 50
  if (ballInCenter) {
    aiState.lastBallX = ball.x
    aiState.lastBallY = ball.y
    aiState.reactionCounter = 0
    aiState.targetY = ai.y + ai.height / 2
    aiState.isTracking = false
    aiState.lagCounter = 0
    aiState.lastBallVelocityX = ball.velocityX
    aiState.jitterOffset = 0
    aiState.jitterDirection = 1
  }
  
  // Check if ball direction changed significantly
  const directionChanged = Math.abs(aiState.lastBallVelocityX - ball.velocityX) > 1
  if (directionChanged) {
    aiState.reactionCounter = AI_DIFFICULTY.reactionDelay
    aiState.isTracking = false
  }
  
  // AI reaction delay - can't immediately respond to direction changes
  if (aiState.reactionCounter > 0) {
    aiState.reactionCounter--
    
    // During reaction delay, add subtle movement instead of complete freeze
    const currentCenter = ai.y + ai.height / 2
    const centerY = canvas.height / 2
    
    // If we don't have a good target, go to center with subtle movement
    if (!aiState.targetY || Math.abs(aiState.targetY - centerY) > 200) {
      aiState.targetY = centerY
    }
    
    // Add small random movements during reaction delay to avoid complete stillness
    if (Math.random() < 0.3) { // 30% chance to add micro-movement
      aiState.targetY += (Math.random() - 0.5) * 15 // Small random adjustment
    }
    
    if (Math.abs(currentCenter - aiState.targetY) > 10) {
      if (currentCenter < aiState.targetY) return { direction: 'down' }
      else if (currentCenter > aiState.targetY) return { direction: 'up' }
    }
    
    // Even when close to target, add occasional micro-movements
    if (Math.random() < 0.2) { // 20% chance for small movement
      if (Math.random() < 0.5) return { direction: 'down' }
      else return { direction: 'up' }
    }
    
    return { direction: 'none' }
  }
  
  // Add subtle performance variations instead of obvious lag
  aiState.lagCounter++
  let movementMultiplier = 1.0 // Normal speed
  
  // More subtle performance variations
  if (aiState.lagCounter >= AI_DIFFICULTY.lagTime * 6) {
    aiState.lagCounter = 0
    // Instead of dramatic slowdown, use smaller variations
    movementMultiplier = 0.8 + Math.random() * 0.3 // Between 0.8 and 1.1
  }
  
  // Add natural jitter/micro-movements
  aiState.jitterOffset += aiState.jitterDirection * (0.3 + Math.random() * 0.4)
  if (Math.abs(aiState.jitterOffset) > 4) {
    aiState.jitterDirection *= -1 // Reverse jitter direction
  }
  
  // Store in AI state for use in movePaddles
  aiState.currentMovementMultiplier = movementMultiplier
  
  // Only track ball when it's coming towards AI
  const ballComingTowardsAI = ball.velocityX > 0
  if (!ballComingTowardsAI) {
    // Ball going away - AI moves to center position
    const centerY = canvas.height / 2
    const currentCenter = ai.y + ai.height / 2
    
    // Add natural jitter to center target
    const jitteredCenterY = centerY + aiState.jitterOffset
    const distanceFromCenter = Math.abs(currentCenter - jitteredCenterY)
    
    if (distanceFromCenter > 25) { // Slightly larger threshold
      aiState.targetY = jitteredCenterY
      if (currentCenter < jitteredCenterY) return { direction: 'down' }
      else return { direction: 'up' }
    }
    
    // Add more frequent micro-movements when idle
    if (Math.random() < 0.3) { // 30% chance for small movement
      if (Math.random() < 0.5) return { direction: 'down' }
      else return { direction: 'up' }
    }
    
    return { direction: 'none' }
  }
  
  // Ball is coming towards AI - try to intercept
  aiState.isTracking = true
  
  // Miss chance for very fast balls
  const ballSpeed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY)
  if (ballSpeed > 7 && Math.random() < AI_DIFFICULTY.missChance) {
    // AI "loses" the ball briefly
    const randomError = (Math.random() - 0.5) * AI_DIFFICULTY.errorRange
    aiState.targetY = ball.y + randomError
    
    // Add some recovery time with small movements
    if (Math.random() < 0.4) {
      const currentCenter = ai.y + ai.height / 2
      if (currentCenter < aiState.targetY) return { direction: 'down' }
      else return { direction: 'up' }
    }
    return { direction: 'none' }
  } else {
    // Predict where ball will be
    let predictedY = ball.y
    
    if (Math.random() < AI_DIFFICULTY.predictionAccuracy) {
      // Good prediction: account for ball trajectory
      const timeToReachPaddle = Math.abs(ball.x - ai.x) / Math.abs(ball.velocityX)
      predictedY = ball.y + (ball.velocityY * timeToReachPaddle)
      
      // Account for wall bounces
      if (predictedY < 0) predictedY = Math.abs(predictedY)
      if (predictedY > canvas.height) predictedY = canvas.height - (predictedY - canvas.height)
    }
    
    // Add error/bias with more natural distribution
    const error = (Math.random() - 0.5) * AI_DIFFICULTY.errorRange * 0.7 // Reduced error
    aiState.targetY = predictedY + error
  }
  
  // Update tracking state
  aiState.lastBallX = ball.x
  aiState.lastBallY = ball.y
  aiState.lastBallVelocityX = ball.velocityX
  
  // Move towards target with more natural movement patterns
  const currentCenter = ai.y + ai.height / 2
  
  // Apply natural jitter to target
  const jitteredTargetY = aiState.targetY + aiState.jitterOffset
  const difference = Math.abs(currentCenter - jitteredTargetY)
  
  // Use a dynamic threshold based on ball distance
  const ballDistance = Math.abs(ball.x - ai.x)
  const dynamicThreshold = Math.max(10, Math.min(30, ballDistance / 20))
  
  // Always have subtle movement to appear alive
  if (difference < dynamicThreshold) {
    // When close to target, still make small adjustments
    if (Math.random() < 0.4) { // 40% chance for micro-adjustment
      if (currentCenter < jitteredTargetY) return { direction: 'down' }
      else return { direction: 'up' }
    }
    return { direction: 'none' }
  }
  
  // Normal movement decision
  if (currentCenter < jitteredTargetY) return { direction: 'down' }
  else if (currentCenter > jitteredTargetY) return { direction: 'up' }
  
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
    // 4-player team mode: 2v2
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
  
  // Remove previous pause listener if it exists
  if (pauseStateListener) {
    window.removeEventListener('pauseStateChanged', pauseStateListener)
  }
  
  //new pause listener
  pauseStateListener = (e: any) => {
    const oldState = gamePaused
    gamePaused = e.detail.paused
    console.log(`Game pause state changed: ${oldState} -> ${gamePaused}`)
  }
  window.addEventListener('pauseStateChanged', pauseStateListener)

  function movePaddles() {
    if (state.gameType === "Pong1") {
      // 1-player mode
      if (keysPressed["w"] && state.player1.y > 0) state.player1.y -= state.player1.speed
      if (keysPressed["s"] && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed
    } else if (state.gameType === "Pong2") {
      // 2-player mode
      if (keysPressed["w"] && state.player1.y > 0) state.player1.y -= state.player1.speed
      if (keysPressed["s"] && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed
      
      if (keysPressed["ArrowUp"] && state.player2.y > 0) state.player2.y -= state.player2.speed
      if (keysPressed["ArrowDown"] && state.player2.y < canvas.height - state.player2.height) state.player2.y += state.player2.speed
    } else if (state.gameType === "Pong4") {
      // 4-player team mode
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
      const aiSpeed = state.player2.speed * aiState.currentMovementMultiplier // Apply lag effect to speed
      if (move.direction === 'up' && state.player2.y > 0) state.player2.y -= aiSpeed
      if (move.direction === 'down' && state.player2.y < canvas.height - state.player2.height) state.player2.y += aiSpeed
    }
  }

  function resetBall() {
    state.ball.x = canvas.width / 2
    state.ball.y = canvas.height / 2
    state.ball.velocityX = -state.ball.velocityX
    state.ball.velocityY = 4 * (Math.random() > 0.5 ? 1 : -1)
    
    // Reset AI state after each point
    if (state.gameType === "Pong1") {
      aiState.reactionCounter = 0
      aiState.targetY = canvas.height / 2  // Reset to center
      aiState.isTracking = false
      aiState.lagCounter = 0
      aiState.lastBallVelocityX = state.ball.velocityX
      aiState.lastBallX = state.ball.x
      aiState.lastBallY = state.ball.y
      aiState.currentMovementMultiplier = 1.0
      aiState.jitterOffset = 0
      aiState.jitterDirection = 1
    }
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
      // scoring for 1P/2P modes
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
    
    // Draw target score indicator - sorry but i am not translating this so lets keep it out
   // ctx.font = "16px Arial"
   // ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    //ctx.textAlign = "center"
   // ctx.fillText(`First to ${WIN_SCORE}`, canvas.width / 2, canvas.height - 20)
    
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