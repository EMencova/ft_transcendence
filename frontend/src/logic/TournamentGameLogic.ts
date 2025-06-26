//timer. when time is 2 minutes, stop game and ow winner with most points
// if points are equal, show draw message and restart game for 1 minute

import { recordMatchResult } from "../views/Tournament.ts";

import type { Ball, GameState2, Paddle } from "../../types/types.ts";

const keysPressed: Record<string, boolean> = {};

const paddleWidth = 10,
  paddleHeight = 100,
  ballRadius = 10;

let gamePaused = true;
let gameOver = false;
let animationId: number;



function PongGameTimer(
	state: GameState2,
	match: any,
	player1_id: string,
	player2_id: string
) {
  let timer = 120; // Default to 2 minutes
  const timerElement = document.getElementById("timer");
  if (!timerElement) {
    console.error("Timer element not found");
    return;
  }

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerElement.textContent = `Time left: ${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

  // Initialize the timer display at the start
    updateTimerDisplay();

  const interval = setInterval(async () => {
    if (!gamePaused) {
      timer--;
      updateTimerDisplay();

      // Update server with current time every 5 seconds
      if (timer % 5 === 0) {
        try {
          await fetch(`/api/tournaments/matches/${match.id}/update-time`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeRemaining: timer }),
          });
        } catch (err) {
          console.error("Error updating time:", err);
        }
      }

      if (timer <= 0) {
        gameOver = true;
        gamePaused = true;
        clearInterval(interval);

        // Determine winner
        let winner = "";
        let winnerid = "";
        if (state.score1 > state.score2) {
          winner = "Player 1";
          winnerid = player1_id;
        } else if (state.score2 > state.score1) {
          winner = "Player 2";
          winnerid = player2_id;
        } else {
          // Draw - restart game for 30 seconds
          gameOver = false;
          gamePaused = false;
          timer = 30;
          state.score1 = 0;
          state.score2 = 0;
          updateTimerDisplay();
          return;
        }

        alert(`${winner} wins!`);
        recordMatchResult(match.id, winnerid);
        window.dispatchEvent(new CustomEvent("resetGame"));
      }
    }
  }, 1000);

  window.addEventListener("resetGame", () => {
    clearInterval(interval);
  });
}

export function startPongGame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  match: any
) {
  let state: GameState2;
  const player1_id = match.player1_id;
  const player2_id = match.player2_id;

  const isGameCurrentlyRunning = !gamePaused && !gameOver;
  if (isGameCurrentlyRunning) {
    console.log("Game is already running, pausing it first");
    gamePaused = true;

    // Update UI to show paused state
    const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
    if (pauseBtn) {
      pauseBtn.textContent = "Resume";
      pauseBtn.style.display = "block";
    	}
	}

  state = {
    gameType: "Pong2",
    player1: {
      x: 0,
      y: canvas.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: 7,
    },
    player2: {
      x: canvas.width - paddleWidth,
      y: canvas.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: 7,
    },
    ball: {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: ballRadius,
      velocityX: 4,
      velocityY: 4,
      speed: 5,
    },
    score1: match.score1 || 0,
    score2: match.score2 || 0,
  };

  document.addEventListener("keydown", (e) => (keysPressed[e.key] = true));
  document.addEventListener("keyup", (e) => (keysPressed[e.key] = false));
  window.addEventListener("pauseStateChanged", (e: any) => {
    gamePaused = e.detail.paused;
  });

  function movePaddles() {
    if (keysPressed["w"] && state.player1.y > 0)
      state.player1.y -= state.player1.speed;
    if (
      keysPressed["s"] &&
      state.player1.y < canvas.height - state.player1.height
    )
      state.player1.y += state.player1.speed;

    if (keysPressed["ArrowUp"] && state.player2.y > 0)
      state.player2.y -= state.player2.speed;
    if (
      keysPressed["ArrowDown"] &&
      state.player2.y < canvas.height - state.player2.height
    )
      state.player2.y += state.player2.speed;
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
    if (state.ball.y < 0 || state.ball.y > canvas.height)
      state.ball.velocityY *= -1;
    if (detectCollision(state.player1, state.ball)) {
      state.ball.velocityX = Math.abs(state.ball.velocityX);
    } else if (detectCollision(state.player2, state.ball)) {
      state.ball.velocityX = -Math.abs(state.ball.velocityX);
    }
    if (state.ball.x < 0) {
      state.score2++;
	  recordMatchScore(match.id, state.score1, state.score2);
      resetBall();
    } else if (state.ball.x > canvas.width) {
		recordMatchScore(match.id, state.score1, state.score2);
      state.score1++;
      resetBall();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "orange";
    ctx.fillRect(
      state.player1.x,
      state.player1.y,
      state.player1.width,
      state.player1.height
    );
    ctx.fillRect(
      state.player2.x,
      state.player2.y,
      state.player2.width,
      state.player2.height
    );

    // draw ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    //middle line
    ctx.strokeStyle = "white";
    ctx.setLineDash([10, 15]);

    //write scores
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.font = "30px Arial";
    ctx.fillText(`${state.score1}`, canvas.width / 4, 50);
    ctx.fillText(`${state.score2}`, (3 * canvas.width) / 4, 50);
  }

  function loop() {
    if (!gamePaused) update();
    if (gameOver) {
      cancelAnimationFrame(animationId);
      return;
    }

    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Start the game loop
  if (match.status === "in_progress") {
    // If continuing a match, start paused so user can choose when to resume
    gamePaused = true;
    console.log("Continuing match - started in paused state");

    // Update button text
    const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
    const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
    if (startBtn) startBtn.textContent = "Resume";
    if (pauseBtn) {
      pauseBtn.textContent = "Resume";
      pauseBtn.style.display = "block";
    }
  } else {
    // New match - start immediately
    gamePaused = false;
    console.log("Starting new match");
  }


  gameOver = false;
  PongGameTimer(state, match, player1_id, player2_id);
  loop();
}

export function stopGame() {
  cancelAnimationFrame(animationId);
}

// Add this function to your Tournament.ts file
export async function recordMatchScore(matchId: number, score1: number, score2: number) {
	try {
	  console.log(`Updating score for match ${matchId}: ${score1}-${score2}`);

	  const response = await fetch(`/api/tournaments/matches/${matchId}/score`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
		  score1: score1,
		  score2: score2
		}),
	  });

	  if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
		console.error("API Error updating score:", errorData);
		throw new Error(`Failed to update score: ${errorData.error || response.statusText}`);
	  }

	  const result = await response.json();
	  console.log("Score updated successfully:", result);

	} catch (error) {
	  console.error("Error updating match score:", error);
	  // Don't throw the error - we don't want to stop the game if score saving fails
	}
  }

export function initializePongGameUI(match: any) {
  const canvas = document.getElementById(
    `pong-game-${match.id}`
  ) as HTMLCanvasElement;
  const context = canvas?.getContext("2d");
  const startMenu = document.getElementById("startMenu");
  const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;

  let gameRunning = false;
  let gamePaused = false;

  if (canvas && context) {
    context.fillStyle = "orange";
    context.fillRect(0, 0, canvas.width, canvas.height);

    startBtn.addEventListener("click", () => {
      canvas.classList.remove("hidden");
      canvas.classList.add("block");
      startMenu?.classList.add("hidden");
      pauseBtn.style.display = "block";
      stopBtn.style.display = "block";

      gameRunning = true;
      startPongGame(canvas, context, match);
    });

    pauseBtn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("togglePause"));
    });

    stopBtn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("resetGame"));
    });

    window.addEventListener("togglePause", () => {
      if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
        window.dispatchEvent(
          new CustomEvent("pauseStateChanged", {
            detail: { paused: gamePaused },
          })
        );
      }
    });

    window.addEventListener("resetGame", () => {
      if (gameRunning) {
        stopGame();
        startMenu?.classList.remove("hidden");
        pauseBtn.style.display = "none";
        stopBtn.style.display = "none";
        pauseBtn.textContent = "Pause";
        canvas.classList.remove("block");
        canvas.classList.add("hidden");

        gameRunning = false;
        gamePaused = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  } else {
    console.error("Canvas or context not found");
  }
}
