// logic/initGameUI.ts
import { startGame, stopGame } from './game'

export function initializeGameUI() {
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	const context = canvas?.getContext('2d')
	const startMenu = document.getElementById('startMenu')
	const gameContainer = document.getElementById('gameContainer') // ✅ Added gameContainer
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement
	const modeSelect = document.getElementById('modeSelect') as HTMLSelectElement
	const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement
	const winScoreSelect = document.getElementById('winScoreSelect') as HTMLSelectElement // ✅ Added winScore
	const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement
	const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement

	let gameRunning = false
	let gamePaused = false

	if (canvas && context) {
		context.fillStyle = "orange"
		context.fillRect(0, 0, canvas.width, canvas.height)

		startBtn.addEventListener('click', () => {
			const gameType = modeSelect.value
			const difficulty = difficultySelect.value
			const winScore = winScoreSelect ? parseInt(winScoreSelect.value) : 5 // ✅ Get winScore

			// ✅ Hide start menu and show game container
			startMenu!.classList.add('hidden')
			gameContainer!.classList.remove('hidden')

			gameRunning = true
			startGame(canvas, context, gameType, difficulty, winScore) // ✅ Pass winScore
		})

		pauseBtn.addEventListener('click', () => {
			window.dispatchEvent(new CustomEvent('togglePause'))
		})

		resetBtn.addEventListener('click', () => {
			window.dispatchEvent(new CustomEvent('resetGame'))
		})

		window.addEventListener('togglePause', () => {
			if (gameRunning) {
				gamePaused = !gamePaused
				pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause'
				window.dispatchEvent(new CustomEvent('pauseStateChanged', {
					detail: { paused: gamePaused }
				}))
			}
		})

		window.addEventListener('resetGame', () => {
			if (gameRunning) {
				stopGame()
				startMenu!.classList.remove('hidden')
				gameContainer!.classList.add('hidden') // ✅ Hide game container instead of individual elements
				pauseBtn!.textContent = 'Pause'

				gameRunning = false
				gamePaused = false
				context.clearRect(0, 0, canvas.width, canvas.height)
			}
		})
	} else {
		console.error("Canvas or context not found")
	}
}