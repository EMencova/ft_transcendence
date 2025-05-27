import { startGame } from './game';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  const startMenu = document.getElementById('startMenu');
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const modeSelect = document.getElementById('modeSelect') as HTMLSelectElement;
  const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement;
  const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  
  let gameRunning = false;
  let gamePaused = false;
  
  if (canvas && context) {
    context.fillStyle = "orange";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    startBtn.addEventListener('click', () => {
        const gameType = modeSelect.value;
        const difficulty = difficultySelect.value;
        
        if (startMenu) startMenu.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'block';
        if (resetBtn) resetBtn.style.display = 'block';

        gameRunning = true;
        startGame(canvas, context, gameType, difficulty);
    });

    pauseBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('togglePause'));
    });

    resetBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('resetGame'));
    });


    window.addEventListener('togglePause', () => {
      if (gameRunning) {
        gamePaused = !gamePaused;
        if (pauseBtn) {
          pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
        }
        
        window.dispatchEvent(new CustomEvent('pauseStateChanged', { 
          detail: { paused: gamePaused }
        }));
      }
    });

    // Reset game handler
    window.addEventListener('resetGame', () => {
      if (gameRunning) {
        // Reset to initial menu state
        if (startMenu) startMenu.style.display = 'flex';
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        
        gameRunning = false;
        gamePaused = false;
        
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  } else {
    console.error("Canvas not supported or context could not be retrieved");
  }
});