//timer. when time is 2 minutes, stop game and ow winner with most points
// if points are equal, show draw message and restart game for 1 minute

import { recordMatchResult, TournamentView } from "../views/Tournament.ts";

import type { Ball, GameState2, Paddle } from "../../types/types.ts";

const keysPressed: Record<string, boolean> = {};

const paddleWidth = 10,
  paddleHeight = 100,
  ballRadius = 10;

let gamePaused = true;
let gameOver = false;
let animationId: number;
let gameInterval: number;
let pauseStateHandler: ((e: any) => void) | null = null;


window.addEventListener("cleanupGame", () => {
  if (typeof animationId !== 'undefined') {
    cancelAnimationFrame(animationId);
  }
  
  // Clear any timers
  if (typeof gameInterval !== 'undefined') {
    clearInterval(gameInterval);
  }
  
  // Remove pause state handler
  if (pauseStateHandler) {
    window.removeEventListener("pauseStateChanged", pauseStateHandler);
    pauseStateHandler = null;
  }
  
  // Reset game state
  gamePaused = true;
  gameOver = true;
});


window.addEventListener("pauseStateChanged", (e: any) => {
  gamePaused = e.detail.paused;
});

function PongGameTimer(
	state: GameState2,
	match: any,
	player1_id: string,
	player2_id: string
) {
  console.log(`match time from PongGameTimer is ${match.time_remaining}`);
  console.log(`${match} from PongGame Timer`);
  const timeRemaining = match.time_remaining || 120; // Default to 2 minutes if not provided
  console.log("Time remaining from Pong Game Timer:", timeRemaining);

  let timer = timeRemaining;
  const timerElement = document.getElementById("timer");
  if (!timerElement) {
    console.error("Timer element not found");
    return;
  }

  const updateTimerDisplay = (displayTimer: number) => {
    displayTimer = displayTimer || timer;
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerElement.textContent = `Time left: ${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  };

    updateTimerDisplay(timeRemaining);

  const interval = setInterval(async () => {
    if (!gamePaused) {
      timer--;
      updateTimerDisplay(timer);
      updateMatchTime(match.id, timer);
      console.log("Time remaining updated while playing", timer);

      // save time to server with current time every second
      if (timer) {
        try {
          console.log(`Just updated time with ${timer}`);
          await fetch(`/api/tournaments/matches/${match.id}/update-time`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timer }),
          });
        } catch (err) {
          console.error("Error updating time:", err);
        }
      }

      if (timer <= 0) {
        if (state.score1 > state.score2) {
            gameOver = true;
            gamePaused = true;
            clearInterval(interval);
            alert("Player 1 wins!");
            recordMatchResult(match.id, player1_id);
            window.dispatchEvent(new CustomEvent("gameFinished"));
        } else if (state.score2 > state.score1) {
            gameOver = true;
            gamePaused = true;
            clearInterval(interval);
            alert("Player 2 wins!");
            recordMatchResult(match.id, player2_id);
            window.dispatchEvent(new CustomEvent("gameFinished"));
        } else {
            alert("It's a draw! Restarting game for 30 seconds...");
            timer = 30;
            updateTimerDisplay(timer);
        }
      }
    }
  }, 1000);
  
  // Store the interval ID for cleanup
  gameInterval = interval;
}



// Store event handlers to allow proper cleanup
let gameEventHandlers: { [key: string]: (e: any) => void } = {};
let buttonHandlers: { [key: string]: () => void } = {};

// Initial Pong Game UI
export function initializePongGameUI(match: any) {

  console.log(`match time from initializePongGameUI is ${match.time_remaining}`);

  const canvas = document.getElementById(
    `pong-game-${match.id}`
  ) as HTMLCanvasElement;
  const context = canvas?.getContext("2d");
  const startMenu = document.getElementById("startMenu");
  const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;

  // Clean up any existing event listeners first
  if (gameEventHandlers.togglePause) {
    window.removeEventListener("togglePause", gameEventHandlers.togglePause);
  }
  if (gameEventHandlers.resetGame) {
    window.removeEventListener("resetGame", gameEventHandlers.resetGame);
  }
  if (gameEventHandlers.gameFinished) {
    window.removeEventListener("gameFinished", gameEventHandlers.gameFinished);
  }
  
  // Remove existing button event listeners
  if (buttonHandlers.startBtn && startBtn) {
    startBtn.removeEventListener("click", buttonHandlers.startBtn);
  }
  if (buttonHandlers.pauseBtn && pauseBtn) {
    pauseBtn.removeEventListener("click", buttonHandlers.pauseBtn);
  }
  if (buttonHandlers.stopBtn && stopBtn) {
    stopBtn.removeEventListener("click", buttonHandlers.stopBtn);
  }

  if (canvas && context) {
    context.fillStyle = "orange";
    context.fillRect(0, 0, canvas.width, canvas.height);

    pauseBtn.style.display = "none";
    stopBtn.style.display = "none";

    // Define button handlers
    buttonHandlers.startBtn = () => {
      canvas.classList.remove("hidden");
      canvas.classList.add("block");
      startMenu?.classList.add("hidden");
      pauseBtn.style.display = "block";
      stopBtn.style.display = "block";
      console.log(`Time remaining for this match: ${match.time_remaining}`);
      startPongGame(canvas, context, match);
    };

    buttonHandlers.pauseBtn = () => {
      window.dispatchEvent(new CustomEvent("togglePause"));
    };

    buttonHandlers.stopBtn = () => {
      window.dispatchEvent(new CustomEvent("resetGame"));
    };

    // Add button event listeners
    startBtn.addEventListener("click", buttonHandlers.startBtn);
    pauseBtn.addEventListener("click", buttonHandlers.pauseBtn);
    stopBtn.addEventListener("click", buttonHandlers.stopBtn);

    // Define event handlers
    gameEventHandlers.togglePause = () => {
      gamePaused = !gamePaused;
      //this *resume* when game is on and then paused
      pauseBtn.textContent = gamePaused ? "Resume5" : "Pause";
      window.dispatchEvent(
        new CustomEvent("pauseStateChanged", {
          detail: { paused: gamePaused },
        })
      );
    };

    gameEventHandlers.resetGame = () => {
      gamePaused = true;
      const ok = confirm("Are you sure you want to stop the game?");
      if (ok) {
        startMenu?.classList.remove("hidden");
        pauseBtn.style.display = "none";
        stopBtn.style.display = "none";
        pauseBtn.textContent = "Pause";
        stopGame();
        //destroy any ctx or canvas
        context?.clearRect(0, 0, canvas.width, canvas.height);
        canvas?.remove();
        window.dispatchEvent(new CustomEvent("cleanupGame"));
        TournamentView();
      }

      canvas.classList.remove("block");
      canvas.classList.add("hidden");
      context.clearRect(0, 0, canvas.width, canvas.height);
      startBtn.style.display = "block";

      //this *resume* when we stop game
      startBtn.textContent = "Resume1";
    };

    gameEventHandlers.gameFinished = () => {
      // Game finished naturally (winner found) - no confirmation needed
      gamePaused = true;
      startMenu?.classList.remove("hidden");
      pauseBtn.style.display = "none";
      stopBtn.style.display = "none";
      pauseBtn.textContent = "Pause";
      stopGame();
      //destroy any ctx or canvas
      context?.clearRect(0, 0, canvas.width, canvas.height);
      canvas?.remove();
      window.dispatchEvent(new CustomEvent("cleanupGame"));
      // TournamentView(); // Reload to show updated tournament state
    };

    // Add the event listeners
    window.addEventListener("togglePause", gameEventHandlers.togglePause);
    window.addEventListener("resetGame", gameEventHandlers.resetGame);
    window.addEventListener("gameFinished", gameEventHandlers.gameFinished);
    
    if (match.status === "in_progress") {
      //###
      startBtn.textContent = "Resume2";
    } else {
      startBtn.textContent = "Start Match";
    }
  } else {
    console.error("Canvas or context not found");
  }
}




export function startPongGame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  match: any
) {

  console.log(`match time from startPongGame is ${match.time_remaining}`);

  let state: GameState2;
  const player1_id = match.player1_id;
  const player2_id = match.player2_id;

  const startbtn = document.getElementById("startBtn") as HTMLButtonElement;
  if (startbtn)
    startbtn.style.display = "none";

  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
  if (stopBtn) {
    stopBtn.style.display = "block";
    //stops Match with the *resume* we are finding
    stopBtn.textContent = "Stop Match";
  }

  if (match.status === "in_progress") {
    gamePaused = true;
    console.log("Continuing match - started in paused state");

    const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
    if (pauseBtn) {
      //###
      pauseBtn.textContent = "Pause";
    }
  } else {
    gamePaused = true;
    console.log("Starting new match");
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

  // Remove existing pause state handler if it exists
  if (pauseStateHandler) {
    window.removeEventListener("pauseStateChanged", pauseStateHandler);
  }
  
  // Create and store new pause state handler
  pauseStateHandler = (e: any) => {
    gamePaused = e.detail.paused;
  };
  
  window.addEventListener("pauseStateChanged", pauseStateHandler);

  function movePaddles() {
    // recordMatchTime(match.id)

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
      // updateMatchTime(match.id, )
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
  if (match.status === "in_progress" || match.status === "scheduled") {
    // If continuing a match, start paused so user can choose when to resume
    gamePaused = true;
    console.log("Continuing match - started in paused state");

    const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
    const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
    if (startBtn) startBtn.textContent = "Resume3";
    if (pauseBtn) {
      //main *resume* on game continued (/start)
      pauseBtn.textContent = "Resume4";
      pauseBtn.style.display = "block";
      gamePaused = true
      window.dispatchEvent(new CustomEvent('pauseStateChanged', {
        detail: { paused: gamePaused }
      }));
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

// stop game and cancel animation frame

export function stopGame() {
  cancelAnimationFrame(animationId);
}

//Record Game Scorees
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
	}
}

export async function updateMatchTime(matchId: number, timeRemaining: number) {
	try {
		if (!Number.isFinite(matchId)) {
			throw new Error(`Invalid matchId: ${matchId}`);
		}
		if (!Number.isFinite(timeRemaining)) {
			throw new Error(`Invalid timeRemaining: ${timeRemaining}`);
		}

		console.log(`Updating time for match ${matchId}: ${timeRemaining}s`);

		const response = await fetch(`/api/tournaments/matches/${matchId}/update-time`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ timeRemaining }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
			console.error("API Error updating time:", errorData);
			throw new Error(`Failed to update time: ${errorData.error || response.statusText}`);
		}

		const result = await response.json();
		console.log("Time updated successfully:", result); // { message, timeRemaining }
		return result;
	} catch (error) {
		console.error("Error updating match time:", error);
	}
}



export function cleanupActiveGame() {
  console.log("Cleaning up active game");
  
  // Clear any game animations and intervals first
  window.dispatchEvent(new CustomEvent("cleanupGame"));
  
  // Remove all game event handlers
  if (gameEventHandlers.togglePause) {
    window.removeEventListener("togglePause", gameEventHandlers.togglePause);
    delete gameEventHandlers.togglePause;
  }
  if (gameEventHandlers.resetGame) {
    window.removeEventListener("resetGame", gameEventHandlers.resetGame);
    delete gameEventHandlers.resetGame;
  }
  if (gameEventHandlers.gameFinished) {
    window.removeEventListener("gameFinished", gameEventHandlers.gameFinished);
    delete gameEventHandlers.gameFinished;
  }
  
  // Remove all button handlers
  const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
  
  if (buttonHandlers.startBtn && startBtn) {
    startBtn.removeEventListener("click", buttonHandlers.startBtn);
    delete buttonHandlers.startBtn;
  }
  if (buttonHandlers.pauseBtn && pauseBtn) {
    pauseBtn.removeEventListener("click", buttonHandlers.pauseBtn);
    delete buttonHandlers.pauseBtn;
  }
  if (buttonHandlers.stopBtn && stopBtn) {
    stopBtn.removeEventListener("click", buttonHandlers.stopBtn);
    delete buttonHandlers.stopBtn;
  }
  
  // Get current match details if a game is active
  const gameContainer = document.getElementById("pong-game-container");
  if (gameContainer) {
    const matchIdElement = gameContainer.querySelector("[data-match-id]") as HTMLElement;
    if (matchIdElement) {
      const matchId = matchIdElement.dataset.matchId;
      if (matchId) {
        // Record the current state of the game if it's in progress
        const timerElement = document.getElementById("timer");
        const timeRemaining = timerElement?.textContent?.match(/\d+:\d+/)?.[0] || "0:00";
        
        // Parse time string (e.g., "1:30") to seconds
        const timeParts = timeRemaining.split(":");
        const seconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        
        // Save game state to server
        fetch(`/api/tournaments/matches/${matchId}/pause`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeRemaining: seconds })
        }).catch(err => console.error("Error saving game state:", err));
      }
    }
  }
}

