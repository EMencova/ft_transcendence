import { currentUser } from "../../logic/auth"
import { initTetrisGame } from "../../logic/tetrisGame"
import { tetrisMatchmakingService } from "../../services/tetrisMatchmakingService"

interface MatchData {
	matchId: string
	opponent: string
	mode: string
	targetScore?: number
	targetLines?: number
	opponentScore?: number
	opponentLines?: number
	isFirstPlayer: boolean
}

export function TurnBasedGameView(container: HTMLElement, matchData: MatchData) {
	if (!currentUser) {
		container.innerHTML = `
			<div class="text-center py-8">
				<p class="text-gray-400 text-lg">🔒 Please log in to play</p>
			</div>
		`
		return
	}

	const isWaitingForOpponent = matchData.isFirstPlayer
	const hasOpponentScore = matchData.opponentScore !== undefined

	container.innerHTML = `
		<div class="min-h-screen bg-gray-900 p-4">
			<!-- Match Header -->
			<div class="max-w-6xl mx-auto mb-6">
				<div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
					<div class="grid grid-cols-3 gap-4 items-center">
						<!-- Left Column: Match Info -->
						<div class="text-left">
							<h2 class="text-xl font-bold text-white mb-1">⏰ Turn-Based Match</h2>
							<p class="text-gray-300 text-sm">vs ${matchData.opponent}</p>
							<p class="text-gray-400 text-xs">Mode: ${getModeDisplayName(matchData.mode)}</p>
						</div>
						
						<!-- Center Column: Match Status -->
						<div class="text-center">
							${isWaitingForOpponent ? `
								<p class="text-orange-400 font-bold text-lg">🎮 Your Turn</p>
								<p class="text-gray-400 text-xs mb-2">Play your best game!</p>
								${hasOpponentScore ? `
									<div class="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2 mb-3 inline-block">
										<p class="text-red-400 text-sm font-bold">Target to Beat:</p>
										<p class="text-white text-xl font-bold">${matchData.opponentScore} pts</p>
										<p class="text-gray-400 text-xs">${matchData.opponentLines} lines cleared</p>
									</div>
								` : `
									<div class="bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-2 mb-3 inline-block">
										<p class="text-blue-400 text-sm font-bold">First Player</p>
										<p class="text-white text-lg">Set the score to beat!</p>
									</div>
								`}
							` : `
								<p class="text-blue-400 font-bold text-lg">⏳ Waiting</p>
								<p class="text-gray-400 text-xs mb-2">Opponent's turn</p>
								<div class="bg-gray-800 rounded-lg px-4 py-2 mb-3 inline-block">
									<p class="text-gray-400 text-sm">Your Score:</p>
									<p class="text-white text-xl font-bold">${matchData.targetScore || 0} pts</p>
									<p class="text-gray-400 text-xs">${matchData.targetLines || 0} lines cleared</p>
								</div>
							`}
						</div>
						
						<!-- Right Column: Controls -->
						<div class="text-right">
							<button id="backToMatchmakingBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mb-2">
								← Back to Matchmaking
							</button>
							${isWaitingForOpponent ? `
								<br>
								<button id="startGameBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
									🚀 Start Game
								</button>
							` : ''}
						</div>
					</div>
				</div>
			</div>

			${isWaitingForOpponent ? `
				<!-- Game Area -->
				<div class="max-w-4xl mx-auto">
					<div class="bg-[#1a1a1a] rounded-lg p-6 border border-blue-500">
						<div class="text-center mb-4">
							<h3 class="text-xl font-bold text-blue-400">🎮 Your Game</h3>
							<div class="grid grid-cols-3 gap-4 mt-4 max-w-md mx-auto">
								<div class="bg-blue-900/20 p-3 rounded">
									<p class="text-blue-300 text-sm">Score</p>
									<p id="gameScore" class="text-white font-bold text-xl">0</p>
								</div>
								<div class="bg-blue-900/20 p-3 rounded">
									<p class="text-blue-300 text-sm">Level</p>
									<p id="gameLevel" class="text-white font-bold text-xl">1</p>
								</div>
								<div class="bg-blue-900/20 p-3 rounded">
									<p class="text-blue-300 text-sm">Lines</p>
									<p id="gameLines" class="text-white font-bold text-xl">0</p>
								</div>
							</div>
						</div>
						<div id="gameArea" class="flex justify-center">
							<!-- Game canvas will be inserted here -->
						</div>
					</div>
				</div>

				<!-- Game Instructions -->
				<div class="max-w-4xl mx-auto mt-6 bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 text-center">
					<p class="text-white font-semibold mb-2">🎮 How to Play Turn-Based Mode</p>
					<div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
						<div>
							<p class="text-blue-400 font-semibold">Controls:</p>
							<p>🔵 ←/→: Move Left/Right</p>
							<p>🔵 ↑: Rotate</p>
							<p>🔵 ↓: Soft Drop</p>
							<p>🔵 Space: Hard Drop</p>
						</div>
						<div>
							<p class="text-orange-400 font-semibold">Objective:</p>
							<p>🏆 Play your best game</p>
							<p>📊 Score will be saved automatically</p>
							<p>⏳ Opponent plays after you finish</p>
							${hasOpponentScore ? `<p class="text-red-400 mt-2">🎯 Beat ${matchData.opponentScore} points!</p>` : ''}
						</div>
					</div>
				</div>
			` : `
				<!-- Waiting State -->
				<div class="max-w-4xl mx-auto">
					<div class="bg-[#1a1a1a] rounded-lg p-8 border border-gray-700 text-center">
						<div class="mb-6">
							<div class="inline-block animate-pulse">
								<span class="text-6xl">⏳</span>
							</div>
							<h3 class="text-2xl font-bold text-white mt-4 mb-2">Waiting for ${matchData.opponent}</h3>
							<p class="text-gray-400">Your opponent needs to complete their turn before you can play.</p>
						</div>
						
						<div class="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
							<h4 class="text-white font-semibold mb-3">Your Current Score:</h4>
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p class="text-blue-400">Points</p>
									<p class="text-white font-bold text-lg">${matchData.targetScore || 0}</p>
								</div>
								<div>
									<p class="text-blue-400">Lines</p>
									<p class="text-white font-bold text-lg">${matchData.targetLines || 0}</p>
								</div>
							</div>
						</div>
						
						<p class="text-gray-500 text-sm mt-4">You'll be notified when it's your turn again.</p>
					</div>
				</div>
			`}
		</div>
	`

	// Initialize the view
	initializeTurnBasedGame(matchData)
}

function getModeDisplayName(mode: string): string {
	const modes: { [key: string]: string } = {
		'sprint': '🏃 Sprint Mode',
		'ultra': '⚡ Ultra Mode',
		'survival': '💀 Survival Mode'
	}
	return modes[mode] || mode
}

function initializeTurnBasedGame(matchData: MatchData) {
	// Setup back button
	const backBtn = document.getElementById('backToMatchmakingBtn')
	if (backBtn) {
		backBtn.addEventListener('click', () => {
			window.location.hash = '#othergames/matchmaking'
		})
	}

	// If it's the player's turn, setup the game
	if (matchData.isFirstPlayer) {
		setupTurnBasedGame(matchData)
	}
}

function setupTurnBasedGame(matchData: MatchData) {
	const startGameBtn = document.getElementById('startGameBtn')
	const gameArea = document.getElementById('gameArea')

	let gameInstance: any = null
	let gameStarted = false

	if (startGameBtn && gameArea) {
		startGameBtn.addEventListener('click', () => {
			if (gameStarted) return

			// Create the game canvas
			gameArea.innerHTML = `
				<div class="tetris-game-container flex flex-col items-center">
					<canvas id="turnBasedTetrisCanvas" width="300" height="600" 
						class="border border-gray-500 bg-black focus:outline-none focus:border-blue-500" 
						tabindex="0" 
						style="outline: none;">
					</canvas>
				</div>
			`

			// Initialize the Tetris game
			gameInstance = initTetrisGame({
				canvasId: 'turnBasedTetrisCanvas',
				keyControls: {
					left: 'ArrowLeft',
					right: 'ArrowRight',
					down: 'ArrowDown',
					rotate: 'ArrowUp'
				},
				saveScore: false,
				tournamentMode: false,
				showAlerts: false, // Disable default game over alerts since we handle them custom
				onScoreUpdate: (score: number, level: number, lines: number) => {
					// Update the display elements
					const scoreEl = document.getElementById('gameScore')
					const levelEl = document.getElementById('gameLevel')
					const linesEl = document.getElementById('gameLines')

					if (scoreEl) scoreEl.textContent = score.toString()
					if (levelEl) levelEl.textContent = level.toString()
					if (linesEl) linesEl.textContent = lines.toString()
				},
				onGameOver: (finalScore: number, finalLevel: number, finalLines: number) => {
					// Game finished, save the results with the final values
					console.log('Game over callback triggered with values:', { finalScore, finalLevel, finalLines })
					setTimeout(() => {
						saveGameResults(matchData, finalScore, finalLevel, finalLines)
					}, 500)
				}
			})

			// Remove the old setInterval approach since we now use onGameOver callback

			// Start the game
			if (gameInstance && gameInstance.startGame) {
				gameInstance.startGame()
				gameStarted = true

					// Update button
					; (startGameBtn as HTMLButtonElement).textContent = '🎮 Game Running...'
					; (startGameBtn as HTMLButtonElement).disabled = true
				startGameBtn.classList.add('opacity-50', 'cursor-not-allowed')

				// Focus on the canvas to ensure keyboard events are captured
				const canvas = document.getElementById('turnBasedTetrisCanvas') as HTMLCanvasElement
				if (canvas) {
					canvas.focus()
					canvas.setAttribute('tabindex', '0') // Make canvas focusable
				}
			}
		})
	}
}

async function saveGameResults(matchData: MatchData, score: number, level: number, lines: number) {
	try {
		console.log('Saving turn-based game results:', { matchData, score, level, lines })

		// Show the game over modal first
		showGameOverModal(matchData, score, lines)

		// Save results to the backend
		console.log('Submitting turn result to backend...')
		const result = await tetrisMatchmakingService.submitTurnResult(matchData.matchId, {
			score: score,
			level: level,
			lines: lines
		})

		console.log('Turn result saved successfully:', result)

	} catch (error) {
		console.error('Failed to save game results:', error)
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : 'No stack trace',
			matchData: matchData
		})
		alert('Failed to save your game results. Please try again.')
	}
}

function showGameOverModal(matchData: MatchData, score: number, lines: number) {
	const modal = document.createElement('div')
	modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'

	const hasOpponentScore = matchData.opponentScore !== undefined
	const wonGame = hasOpponentScore && score > (matchData.opponentScore || 0)

	modal.innerHTML = `
		<div class="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700 text-center">
			<div class="mb-6">
				<span class="text-6xl">${hasOpponentScore ? (wonGame ? '🏆' : '💔') : '✅'}</span>
				<h2 class="text-2xl font-bold text-white mt-4">
					${hasOpponentScore ? (wonGame ? 'Victory!' : 'Defeat!') : 'Turn Complete!'}
				</h2>
			</div>
			
			<div class="bg-gray-800 rounded-lg p-4 mb-6">
				<h3 class="text-white font-semibold mb-3">Your Final Results:</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-blue-400 text-sm">Score</p>
						<p class="text-white font-bold text-xl">${score}</p>
					</div>
					<div>
						<p class="text-blue-400 text-sm">Lines</p>
						<p class="text-white font-bold text-xl">${lines}</p>
					</div>
				</div>
				
				${hasOpponentScore ? `
					<div class="mt-4 pt-4 border-t border-gray-600">
						<p class="text-gray-400 text-sm">Opponent's Score: ${matchData.opponentScore}</p>
						<p class="text-${wonGame ? 'green' : 'red'}-400 font-semibold">
							${wonGame ? 'You won!' : 'You lost!'} (${score - (matchData.opponentScore || 0)} points difference)
						</p>
					</div>
				` : `
					<div class="mt-4 pt-4 border-t border-gray-600">
						<p class="text-blue-400 text-sm">Waiting for ${matchData.opponent} to play their turn...</p>
					</div>
				`}
			</div>
			
			<div class="space-y-3">
				<button id="viewMatchmakingBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold">
					📋 View Matchmaking
				</button>
				<button id="playAgainBtn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold">
					🎮 Play Another Match
				</button>
			</div>
		</div>
	`

	document.body.appendChild(modal)

	// Setup button listeners
	const viewMatchmakingBtn = modal.querySelector('#viewMatchmakingBtn')
	const playAgainBtn = modal.querySelector('#playAgainBtn')

	viewMatchmakingBtn?.addEventListener('click', () => {
		modal.remove()
		window.location.hash = '#othergames/matchmaking'
	})

	playAgainBtn?.addEventListener('click', () => {
		modal.remove()
		window.location.hash = '#othergames/matchmaking'
	})

	// Auto close after 10 seconds if no interaction
	setTimeout(() => {
		if (document.body.contains(modal)) {
			modal.remove()
			window.location.hash = '#othergames/matchmaking'
		}
	}, 15000)
}

// Cleanup function
export function cleanupTurnBasedGame() {
	// Clear any remaining intervals or timeouts
	const highestId = setTimeout(() => { }, 0)
	for (let i = 0;i < highestId;i++) {
		clearTimeout(i)
		clearInterval(i)
	}
}
