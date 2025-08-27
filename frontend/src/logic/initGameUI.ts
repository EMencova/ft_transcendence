// logic/initGameUI.ts
import { startGame, stopGame } from './game'

// Store event handlers to prevent duplicate listeners
let togglePauseHandler: (() => void) | null = null
let resetGameHandler: (() => void) | null = null
let isInitialized = false

export function initializeGameUI() {
	if (isInitialized) {
		console.log('initializeGameUI already called, skipping...')
		return
	}
	
	console.log('Initializing game UI...')
	
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	const context = canvas?.getContext('2d')
	const startMenu = document.getElementById('startMenu')
	const gameContainer = document.getElementById('gameContainer')
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement
	const modeSelect = document.getElementById('modeSelect') as HTMLSelectElement
	const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement
	const winScoreSelect = document.getElementById('winScoreSelect') as HTMLSelectElement
	const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement
	const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement
	const controlsDisplay = document.getElementById('controlsDisplay')
	const currentControls = document.getElementById('currentControls')
	const difficultyWrapper = document.getElementById('difficultyWrapper')

	let gameRunning = false
	let gamePaused = false

	// Clean up existing event listeners first
	if (togglePauseHandler) {
		window.removeEventListener('togglePause', togglePauseHandler)
	}
	if (resetGameHandler) {
		window.removeEventListener('resetGame', resetGameHandler)
	}

	// Update controls display based on selected mode
	function updateControlsDisplay(mode: string) {
		if (!controlsDisplay) return
		
		const controlsInfo = {
			'Pong1': `
				<div class="font-medium text-white mb-1">1 Player Mode:</div>
				<div>Player 1: <span class="bg-gray-700 px-2 py-1 rounded">W</span> / <span class="bg-gray-700 px-2 py-1 rounded">S</span></div>
				<div class="text-gray-400">AI controls Player 2</div>
			`,
			'Pong2': `
				<div class="font-medium text-white mb-1">2 Player Mode:</div>
				<div>Player 1: <span class="bg-gray-700 px-2 py-1 rounded">W</span> / <span class="bg-gray-700 px-2 py-1 rounded">S</span></div>
				<div>Player 2: <span class="bg-gray-700 px-2 py-1 rounded">↑</span> / <span class="bg-gray-700 px-2 py-1 rounded">↓</span></div>
			`,
			'Pong4': `
				<div class="font-medium text-white mb-1">4 Player Team Mode (2v2):</div>
				<div class="grid grid-cols-2 gap-3 text-xs">
					<div class="bg-blue-900/30 p-2 rounded">
						<div class="font-medium text-blue-300 mb-1">Left Team:</div>
						<div>Player 1 (Top): <span class="bg-gray-700 px-1 py-0.5 rounded">W</span>/<span class="bg-gray-700 px-1 py-0.5 rounded">S</span></div>
						<div>Player 3 (Bottom): <span class="bg-gray-700 px-1 py-0.5 rounded">Z</span>/<span class="bg-gray-700 px-1 py-0.5 rounded">X</span></div>
					</div>
					<div class="bg-red-900/30 p-2 rounded">
						<div class="font-medium text-red-300 mb-1">Right Team:</div>
						<div>Player 2 (Top): <span class="bg-gray-700 px-1 py-0.5 rounded">↑</span>/<span class="bg-gray-700 px-1 py-0.5 rounded">↓</span></div>
						<div>Player 4 (Bottom): <span class="bg-gray-700 px-1 py-0.5 rounded">N</span>/<span class="bg-gray-700 px-1 py-0.5 rounded">M</span></div>
					</div>
				</div>
				<div class="text-xs text-yellow-400 mt-2">
					<strong>Team Play:</strong> 2 paddles per side, shared team score! Like 4-player table tennis.
				</div>
			`
		}
		
		controlsDisplay.innerHTML = controlsInfo[mode as keyof typeof controlsInfo] || controlsInfo['Pong1']
	}

	// Update current controls during game
	function updateCurrentControls(mode: string) {
		if (!currentControls) return
		
		const selectedWinScore = winScoreSelect ? winScoreSelect.value : '5'
		const controlsText = {
			'Pong1': `Player 1: W/S keys | AI plays as Player 2 | First to ${selectedWinScore} points wins!`,
			'Pong2': `Player 1: W/S keys | Player 2: Arrow Up/Down keys | First to ${selectedWinScore} points wins!`, 
			'Pong4': `Left Team (P1: W/S, P3: Z/X) vs Right Team (P2: ↑/↓, P4: N/M) | First team to ${selectedWinScore} wins!`
		}
		
		currentControls.textContent = controlsText[mode as keyof typeof controlsText] || controlsText['Pong1']
	}

	// Show/hide difficulty based on mode
	function updateDifficultyVisibility(mode: string) {
		if (difficultyWrapper) {
			difficultyWrapper.style.display = mode === 'Pong1' ? 'block' : 'none'
		}
	}

	// Initialize
	updateControlsDisplay('Pong1')
	updateDifficultyVisibility('Pong1')

	// Mode change handler
	modeSelect.addEventListener('change', () => {
		const selectedMode = modeSelect.value
		updateControlsDisplay(selectedMode)
		updateDifficultyVisibility(selectedMode)
	})

	if (canvas && context) {
		context.fillStyle = "orange"
		context.fillRect(0, 0, canvas.width, canvas.height)

		startBtn.addEventListener('click', () => {
			const gameType = modeSelect.value
			const difficulty = difficultySelect.value
			const winScore = parseInt(winScoreSelect.value)

			// Hide start menu and show game
			startMenu!.classList.add('hidden')
			gameContainer!.classList.remove('hidden')
			
			updateCurrentControls(gameType)

			// Initialize game state
			gameRunning = true
			gamePaused = false // Game starts unpaused
			pauseBtn.textContent = 'Pause'
			
			console.log('Starting game, UI pause state:', gamePaused) // Debug log
			startGame(canvas, context, gameType, difficulty, winScore)
		})

		pauseBtn.addEventListener('click', () => {
			console.log('Pause button clicked') // Debug log
			window.dispatchEvent(new CustomEvent('togglePause'))
		})

		resetBtn.addEventListener('click', () => {
			window.dispatchEvent(new CustomEvent('resetGame'))
		})

		// Define event handlers to prevent duplicates
		let pauseToggleCount = 0
		togglePauseHandler = () => {
			if (gameRunning) {
				pauseToggleCount++
				gamePaused = !gamePaused
				console.log(`UI pause state toggled #${pauseToggleCount}:`, gamePaused) // Enhanced debug log
				pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause'
				window.dispatchEvent(new CustomEvent('pauseStateChanged', {
					detail: { paused: gamePaused }
				}))
			}
		}

		resetGameHandler = () => {
			if (gameRunning) {
				stopGame()
				startMenu!.classList.remove('hidden')
				gameContainer!.classList.add('hidden')
				pauseBtn!.textContent = 'Pause'

				gameRunning = false
				gamePaused = false
				context.clearRect(0, 0, canvas.width, canvas.height)
			}
		}

		// Add the event listeners
		window.addEventListener('togglePause', togglePauseHandler)
		window.addEventListener('resetGame', resetGameHandler)
		
		isInitialized = true
		console.log('Game UI initialized successfully')
	} else {
		console.error("Canvas or context not found")
	}
}
