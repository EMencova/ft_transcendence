import { initTetrisGame } from "../../logic/tetrisGame"

interface TournamentConfig {
	mode: string
	opponent: string
	winCondition: string
	timeLimit?: number
	targetLines?: number
}

interface TournamentState {
	playerScore: number
	playerLevel: number
	playerLines: number
	opponentScore: number
	opponentLevel: number
	opponentLines: number
	startTime: number
	isActive: boolean
	winner?: string
}

let tournamentState: TournamentState | null = null
let tournamentConfig: TournamentConfig | null = null

export function startTournamentMatch(config: TournamentConfig) {
	tournamentConfig = config
	tournamentState = {
		playerScore: 0,
		playerLevel: 1,
		playerLines: 0,
		opponentScore: 0,
		opponentLevel: 1,
		opponentLines: 0,
		startTime: Date.now(),
		isActive: true
	}

	// Initialize tournament UI
	const mainContent = document.getElementById("mainContent")
	if (!mainContent) return

	mainContent.innerHTML = `
        <div class="min-h-screen bg-gray-900 p-4">
            <!-- Tournament Header -->
            <div class="max-w-7xl mx-auto mb-6">
                <div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <div class="flex justify-between items-center">
                        <div class="text-center">
                            <h2 class="text-2xl font-bold text-white mb-2">🏆 Tournament Match</h2>
                            <p class="text-orange-400">${getModeDisplayName(config.mode)} - ${config.winCondition}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Playing against</p>
                            <p class="text-white font-semibold">${config.opponent}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Time Elapsed</p>
                            <p id="tournamentTimer" class="text-white font-mono">00:00</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Game Area -->
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Player Side -->
                <div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <div class="text-center mb-4">
                        <h3 class="text-lg font-bold text-white">You</h3>
                        <div class="grid grid-cols-3 gap-4 mt-2">
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Score</p>
                                <p id="playerTournamentScore" class="text-white font-bold">0</p>
                            </div>
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Level</p>
                                <p id="playerTournamentLevel" class="text-orange-400 font-bold">1</p>
                            </div>
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Lines</p>
                                <p id="playerTournamentLines" class="text-green-400 font-bold">0</p>
                            </div>
                        </div>
                    </div>
                    <div id="playerGameArea">
                        <div class="flex flex-col items-center">
                            <canvas id="playerTetrisCanvas" class="border border-gray-700 bg-gray-900"></canvas>
                            <div class="flex justify-center text-center space-x-2 mt-2">
                                <button id="playerStartBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs">Start</button>
                                <button id="playerPauseBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed text-xs" disabled>Pause</button>
                                <button id="playerResetBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed text-xs" disabled>Reset</button>
                            </div>
                            <div class="mt-2 text-xs text-gray-400 text-center">
                                <p class="font-semibold mb-1">Controls (P1):</p>
                                <p>← → Move • ↓ Soft Drop • ↑ Rotate</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opponent Side -->
                <div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <div class="text-center mb-4">
                        <h3 class="text-lg font-bold text-white">${config.opponent}</h3>
                        <div class="grid grid-cols-3 gap-4 mt-2">
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Score</p>
                                <p id="opponentTournamentScore" class="text-white font-bold">0</p>
                            </div>
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Level</p>
                                <p id="opponentTournamentLevel" class="text-orange-400 font-bold">1</p>
                            </div>
                            <div class="bg-zinc-800 p-2 rounded">
                                <p class="text-xs text-gray-400">Lines</p>
                                <p id="opponentTournamentLines" class="text-green-400 font-bold">0</p>
                            </div>
                        </div>
                    </div>
                    <div id="opponentGameArea">
                        <div class="flex flex-col items-center">
                            <canvas id="opponentTetrisCanvas" class="border border-gray-700 bg-gray-900"></canvas>
                            <div class="flex justify-center text-center space-x-2 mt-2">
                                <button id="opponentStartBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs">Start</button>
                                <button id="opponentPauseBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed text-xs" disabled>Pause</button>
                                <button id="opponentResetBtn" class="w-16 bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed text-xs" disabled>Reset</button>
                            </div>
                            <div class="mt-2 text-xs text-gray-400 text-center">
                                <p class="font-semibold mb-1">Controls (P2):</p>
                                <p>A D Move • S Soft Drop • W Rotate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tournament Controls -->
            <div class="max-w-7xl mx-auto mt-6">
                <div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 text-center">
                    <button id="forfeitTournamentBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded">
                        🏳️ Forfeit Match
                    </button>
                </div>
            </div>
        </div>
    `

	// Start both players' games
	const playerGameArea = document.getElementById("playerGameArea")
	const opponentGameArea = document.getElementById("opponentGameArea")

	if (playerGameArea) {
		// Player 1 - Traditional controls (Arrow keys)
		initTetrisGame({
			canvasId: "playerTetrisCanvas",
			scoreId: "playerTournamentScore",
			levelId: "playerTournamentLevel",
			startButtonId: "playerStartBtn",
			pauseButtonId: "playerPauseBtn",
			resetButtonId: "playerResetBtn",
			keyControls: {
				left: "ArrowLeft",
				right: "ArrowRight",
				down: "ArrowDown",
				rotate: "ArrowUp"
			},
			saveScore: false,
			tournamentMode: true
		})
	}

	if (opponentGameArea) {
		// Player 2 - WASD controls
		initTetrisGame({
			canvasId: "opponentTetrisCanvas",
			scoreId: "opponentTournamentScore",
			levelId: "opponentTournamentLevel",
			startButtonId: "opponentStartBtn",
			pauseButtonId: "opponentPauseBtn",
			resetButtonId: "opponentResetBtn",
			keyControls: {
				left: "a",
				right: "d",
				down: "s",
				rotate: "w"
			},
			saveScore: false,
			tournamentMode: false, // Only player 1 should update tournament progress
			onScoreUpdate: updateOpponentTournamentProgress // Custom callback for opponent
		})
	}

	// Start tournament mechanics
	startTournamentTimer()
	setupTournamentControls()
}

function getModeDisplayName(mode: string): string {
	const modes: { [key: string]: string } = {
		'sprint': '🏃 Sprint Mode',
		'ultra': '⚡ Ultra Mode',
		'survival': '💀 Survival Mode'
	}
	return modes[mode] || mode
}

function startTournamentTimer() {
	const timerEl = document.getElementById("tournamentTimer")
	if (!timerEl || !tournamentState) return

	const updateTimer = () => {
		if (!tournamentState?.isActive) return

		const elapsed = Math.floor((Date.now() - tournamentState.startTime) / 1000)
		const minutes = Math.floor(elapsed / 60)
		const seconds = elapsed % 60
		timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

		// Check time limit for Ultra mode
		if (tournamentConfig?.mode === 'ultra' && elapsed >= 120) { // 2 minutes
			endTournament()
			return
		}

		requestAnimationFrame(updateTimer)
	}

	updateTimer()
}

function checkWinConditions() {
	if (!tournamentState?.isActive || !tournamentConfig) return

	let winner = null

	switch (tournamentConfig.mode) {
		case 'sprint':
			if (tournamentState.playerLines >= 40) winner = 'player'
			else if (tournamentState.opponentLines >= 40) winner = 'opponent'
			break
		case 'ultra':
			// Will be handled by timer
			break
		case 'survival':
			// Will be handled by game over events
			break
	}

	if (winner) {
		tournamentState.winner = winner
		endTournament()
	}
}

function endTournament() {
	if (!tournamentState) return

	tournamentState.isActive = false

	let winner = tournamentState.winner
	if (!winner && tournamentConfig?.mode === 'ultra') {
		// Determine winner by score in Ultra mode
		winner = tournamentState.playerScore > tournamentState.opponentScore ? 'player' : 'opponent'
	}

	const isWin = winner === 'player'

	alert(`🏆 Tournament ${isWin ? 'Victory!' : 'Defeat!'}\n\n` +
		`Final Scores:\n` +
		`You: ${tournamentState.playerScore} points, ${tournamentState.playerLines} lines\n` +
		`${tournamentConfig?.opponent}: ${tournamentState.opponentScore} points, ${tournamentState.opponentLines} lines`)

	// Return to matchmaking
	setTimeout(() => {
		window.location.hash = '#/othergames'
	}, 2000)
}

function setupTournamentControls() {
	const forfeitBtn = document.getElementById("forfeitTournamentBtn")
	forfeitBtn?.addEventListener('click', () => {
		if (confirm('Are you sure you want to forfeit this tournament match?')) {
			if (tournamentState) {
				tournamentState.winner = 'opponent'
				endTournament()
			}
		}
	})
}

// Export function to update tournament state from TetrisView
export function updateTournamentProgress(score: number, level: number, lines: number) {
	if (!tournamentState?.isActive) return

	tournamentState.playerScore = score
	tournamentState.playerLevel = level
	tournamentState.playerLines = lines

	// Update display
	const scoreEl = document.getElementById("playerTournamentScore")
	const levelEl = document.getElementById("playerTournamentLevel")
	const linesEl = document.getElementById("playerTournamentLines")

	if (scoreEl) scoreEl.textContent = score.toString()
	if (levelEl) levelEl.textContent = level.toString()
	if (linesEl) linesEl.textContent = lines.toString()

	checkWinConditions()
}

// Export function to update opponent tournament state
export function updateOpponentTournamentProgress(score: number, level: number, lines: number) {
	if (!tournamentState?.isActive) return

	tournamentState.opponentScore = score
	tournamentState.opponentLevel = level
	tournamentState.opponentLines = lines

	// Update display
	const scoreEl = document.getElementById("opponentTournamentScore")
	const levelEl = document.getElementById("opponentTournamentLevel")
	const linesEl = document.getElementById("opponentTournamentLines")

	if (scoreEl) scoreEl.textContent = score.toString()
	if (levelEl) levelEl.textContent = level.toString()
	if (linesEl) linesEl.textContent = lines.toString()

	checkWinConditions()
}

// Export function to handle tournament game over
export function handleTournamentGameOver() {
	if (!tournamentState?.isActive) return

	if (tournamentConfig?.mode === 'survival') {
		tournamentState.winner = 'opponent'
		endTournament()
	}
}
