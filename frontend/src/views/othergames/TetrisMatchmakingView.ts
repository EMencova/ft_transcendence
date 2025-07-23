import { currentUser } from "../../logic/auth"
import { tetrisMatchmakingService } from "../../services/tetrisMatchmakingService"
import { startTournamentMatch as initTournament } from "./TetrisTournamentView"

interface TournamentMode {
	id: string
	name: string
	description: string
	duration: string
	winCondition: string
}

const TOURNAMENT_MODES: TournamentMode[] = [
	{
		id: 'sprint',
		name: '🏃 Sprint Mode',
		description: 'First to clear 40 lines wins',
		duration: '1-3 min',
		winCondition: 'lines_cleared >= 40'
	},
	{
		id: 'ultra',
		name: '⚡ Ultra Mode',
		description: 'Highest score in 2 minutes',
		duration: '2 min',
		winCondition: 'time_limit'
	},
	{
		id: 'survival',
		name: '💀 Survival Mode',
		description: 'Last player standing',
		duration: 'Until Game Over',
		winCondition: 'last_standing'
	}
]

export function TetrisMatchmakingView(container: HTMLElement) {
	if (!currentUser) {
		container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400 text-lg">🔒 Please log in to use matchmaking</p>
                <p class="text-gray-500 text-sm mt-2">Find opponents and compete in fair matches.</p>
            </div>
        `
		return
	}

	container.innerHTML = `
        <div class="max-w-6xl mx-auto p-6">
            <h3 class="text-xl font-bold mb-6 text-white">⚔️ Tetris Matchmaking</h3>
            
            <!-- Tournament Mode Selection -->
            <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700 mb-6">
                <h4 class="text-orange-400 font-semibold mb-4">🎮 Select Tournament Mode</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${TOURNAMENT_MODES.map(mode => `
                        <div class="mode-card bg-zinc-800 p-4 rounded-lg border border-gray-600 cursor-pointer hover:border-orange-400 transition-colors" data-mode="${mode.id}">
                            <h5 class="text-white font-semibold mb-2">${mode.name}</h5>
                            <p class="text-gray-300 text-sm mb-2">${mode.description}</p>
                            <div class="flex justify-between text-xs text-gray-400">
                                <span>⏱️ ${mode.duration}</span>
                                <span class="text-orange-300">🏆 Win Condition</span>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">${mode.winCondition.replace('_', ' ').replace('>=', '≥')}</p>
                        </div>
                    `).join('')}
                </div>
                <div id="selectedMode" class="mt-4 p-3 bg-orange-600 rounded text-white text-center hidden">
                    <span id="selectedModeText">Sprint Mode Selected</span>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Create Match Section -->
                <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                        ➕ Create Match
                    </h4>
                    <p class="text-gray-300 mb-4">Create a new match and wait for an opponent</p>
                    
                    <div id="createMatchStatus" class="mb-4">
                        <div class="flex items-center justify-between bg-zinc-700 p-3 rounded">
                            <span class="text-white">Your Skill Level:</span>
                            <span id="playerSkillLevel" class="text-orange-400 font-bold">-</span>
                        </div>
                    </div>
                    
                    <div id="matchmakingButtons" class="space-y-3">
                        <button id="createMatchBtn" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                            🎮 Create Match
                        </button>
                        <button id="cancelMatchBtn" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-semibold hidden">
                            ❌ Leave Queue
                        </button>
                    </div>
                    
                    <div id="matchmakingStatus" class="mt-4 text-center hidden">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <p class="text-gray-300 mt-2">Waiting for opponent...</p>
                        <p id="searchTime" class="text-gray-400 text-sm">00:00</p>
                    </div>
                </div>

                <!-- Available Matches Section -->
                <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                        🎯 Available Matches
                    </h4>
                    <p class="text-gray-300 mb-4">Join an existing match created by other players</p>
                    
                    <div id="queueList" class="space-y-2 max-h-60 overflow-y-auto">
                        <div class="text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            <p class="text-gray-400 mt-2 text-sm">Loading available matches...</p>
                        </div>
                    </div>
                    
                    <button id="refreshQueueBtn" class="w-full mt-4 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded">
                        🔄 Refresh Matches
                    </button>
                </div>
            </div>

            <!-- Match History Section -->
            <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700 mt-6">
                <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                    📜 Recent Matches
                </h4>
                <div id="recentMatches" class="space-y-2">
                    <div class="text-center py-4">
                        <p class="text-gray-400">No recent matches</p>
                        <p class="text-gray-500 text-sm mt-1">Play some matches to see your history here</p>
                    </div>
                </div>
            </div>

            <!-- Join Match Confirmation Modal -->
            <div id="joinMatchModal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden z-50">
                <div class="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                    <h3 class="text-xl font-bold text-white mb-4">🎮 Join Match</h3>
                    <div id="matchDetails" class="mb-6">
                        <p class="text-gray-300 mb-2">Do you want to join this match?</p>
                        <div class="bg-zinc-800 p-4 rounded border border-gray-600">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-400">Opponent:</span>
                                <span id="modalOpponentName" class="text-white font-semibold">-</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-400">Mode:</span>
                                <span id="modalMatchMode" class="text-orange-400">-</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-400">Skill Level:</span>
                                <span id="modalOpponentSkill" class="text-green-400">-</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button id="confirmJoinBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold">
                            ✅ Join Match
                        </button>
                        <button id="cancelJoinBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `

	initializeMatchmaking()
}

let searchStartTime: number | null = null
let searchInterval: number | null = null
let queueRefreshInterval: number | null = null
let selectedTournamentMode: string = 'sprint' // Default mode

function initializeMatchmaking() {
	const createMatchBtn = document.getElementById('createMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const refreshQueueBtn = document.getElementById('refreshQueueBtn')

	// Initialize mode selection
	initializeModeSelection()

	// Setup WebSocket listeners for real-time matchmaking events
	setupWebSocketListeners()

	if (createMatchBtn) {
		createMatchBtn.addEventListener('click', createMatch)
	}

	if (cancelMatchBtn) {
		cancelMatchBtn.addEventListener('click', cancelMatchmaking)
	}

	if (refreshQueueBtn) {
		refreshQueueBtn.addEventListener('click', loadQueue)
	}

	// Load initial data
	loadPlayerSkillLevel()
	loadQueue()
	loadRecentMatches()

	// Set up automatic queue refresh
	queueRefreshInterval = window.setInterval(loadQueue, 10000) // Refresh every 10 seconds
}

function setupWebSocketListeners() {
	// Listen for match found events
	tetrisMatchmakingService.on('match_found', (data: any) => {
		console.log('Match found via WebSocket:', data)
		showMatchFoundNotification(data)
	})

	// Listen for tournament start events
	tetrisMatchmakingService.on('tournament_start', (data: any) => {
		console.log('Tournament starting:', data)
		// Start the tournament with real opponent data
		const selectedMode = TOURNAMENT_MODES.find(mode => mode.id === data.mode)
		if (selectedMode) {
			initTournament({
				mode: selectedMode.id,
				opponent: data.opponent.username,
				winCondition: selectedMode.description,
				timeLimit: selectedMode.id === 'ultra' ? 120 : undefined,
				targetLines: selectedMode.id === 'sprint' ? 40 : undefined
			})
		}
	})

	// Listen for tournament end events
	tetrisMatchmakingService.on('tournament_end', (data: any) => {
		console.log('Tournament ended:', data)
		const isWinner = data.isWinner
		alert(`🏆 Tournament ${isWinner ? 'Victory!' : 'Defeat!'}\n\n` +
			`Final Result: ${data.winner ? 'Winner determined' : 'Draw'}\n` +
			`Your Stats: ${data.finalStats.player.score} points, ${data.finalStats.player.lines} lines\n` +
			`Opponent Stats: ${data.finalStats.opponent.score} points, ${data.finalStats.opponent.lines} lines`)
	})
}

function initializeModeSelection() {
	const modeCards = document.querySelectorAll('.mode-card')
	const selectedModeDiv = document.getElementById('selectedMode')
	const selectedModeText = document.getElementById('selectedModeText')
	const createMatchBtn = document.getElementById('createMatchBtn') as HTMLButtonElement

	// Initially disable create match button until mode is selected
	if (createMatchBtn) {
		createMatchBtn.disabled = true
		createMatchBtn.textContent = '🎮 Select a mode first'
	}

	modeCards.forEach(card => {
		card.addEventListener('click', () => {
			// Remove active class from all cards
			modeCards.forEach(c => {
				c.classList.remove('border-orange-400', 'bg-zinc-700')
				c.classList.add('border-gray-600', 'bg-zinc-800')
			})

			// Add active class to selected card
			card.classList.remove('border-gray-600', 'bg-zinc-800')
			card.classList.add('border-orange-400', 'bg-zinc-700')

			// Update selected mode
			selectedTournamentMode = card.getAttribute('data-mode') || 'sprint'
			const selectedMode = TOURNAMENT_MODES.find(mode => mode.id === selectedTournamentMode)

			if (selectedMode && selectedModeDiv && selectedModeText) {
				selectedModeDiv.classList.remove('hidden')
				selectedModeText.textContent = `${selectedMode.name} Selected - ${selectedMode.description}`
			}

			// Enable create match button
			if (createMatchBtn) {
				createMatchBtn.disabled = false
				createMatchBtn.textContent = '🎮 Create Match'
			}
		})
	})

	// Auto-select first mode (Sprint)
	if (modeCards.length > 0) {
		(modeCards[0] as HTMLElement).click()
	}
}

async function createMatch() {
	const createMatchBtn = document.getElementById('createMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const matchmakingStatus = document.getElementById('matchmakingStatus')

	if (!createMatchBtn || !cancelMatchBtn || !matchmakingStatus) return

	const selectedMode = TOURNAMENT_MODES.find(mode => mode.id === selectedTournamentMode)
	if (!selectedMode) {
		alert('Please select a tournament mode first!')
		return
	}

	try {
		// Update UI to show waiting state
		createMatchBtn.classList.add('hidden')
		cancelMatchBtn.classList.remove('hidden')
		matchmakingStatus.classList.remove('hidden')

		// Update status to show selected mode
		const statusText = matchmakingStatus.querySelector('p')
		if (statusText) {
			statusText.textContent = `Waiting for opponent to join ${selectedMode.name}...`
		}

		searchStartTime = Date.now()
		searchInterval = window.setInterval(updateSearchTime, 1000)

		// Create match in the queue
		const result = await tetrisMatchmakingService.joinQueue(selectedTournamentMode)
		console.log('Joined matchmaking queue:', result)

		// Update skill level display
		const skillLevelEl = document.getElementById('playerSkillLevel')
		if (skillLevelEl) {
			skillLevelEl.textContent = result.skillLevel.toString()
		}

		// If match was found immediately
		if (result.matchFound) {
			console.log('Match found immediately!')
		}

	} catch (error) {
		console.error('Failed to start matchmaking:', error)
		resetMatchmakingUI()
		alert('Failed to join matchmaking queue. Please try again.')
	}
}

async function cancelMatchmaking() {
	try {
		await tetrisMatchmakingService.leaveQueue()
		resetMatchmakingUI()
		console.log('Left matchmaking queue')
	} catch (error) {
		console.error('Failed to leave matchmaking queue:', error)
		resetMatchmakingUI()
	}
}

function resetMatchmakingUI() {
	const createMatchBtn = document.getElementById('createMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const matchmakingStatus = document.getElementById('matchmakingStatus')

	if (createMatchBtn) createMatchBtn.classList.remove('hidden')
	if (cancelMatchBtn) cancelMatchBtn.classList.add('hidden')
	if (matchmakingStatus) matchmakingStatus.classList.add('hidden')

	if (searchInterval) {
		clearInterval(searchInterval)
		searchInterval = null
	}
	searchStartTime = null
}

function updateSearchTime() {
	const searchTimeEl = document.getElementById('searchTime')
	if (!searchTimeEl || !searchStartTime) return

	const elapsed = Math.floor((Date.now() - searchStartTime) / 1000)
	const minutes = Math.floor(elapsed / 60)
	const seconds = elapsed % 60
	searchTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function showMatchFoundNotification(data: any) {
	resetMatchmakingUI()

	const selectedMode = TOURNAMENT_MODES.find(mode => mode.id === data.mode)
	const opponentName = data.opponent.username

	// Show match found notification
	const container = document.querySelector('.max-w-6xl')
	if (container) {
		const notification = document.createElement('div')
		notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded shadow-lg z-50 max-w-sm'
		notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-xl">🎉</span>
                <div>
                    <p class="font-semibold">Match Found!</p>
                    <p class="text-sm">Mode: ${selectedMode?.name || 'Unknown'}</p>
                    <p class="text-sm">Opponent: ${opponentName}</p>
                    <p class="text-xs text-green-200 mt-1">${selectedMode?.description}</p>
                </div>
            </div>
            <div class="mt-3 flex space-x-2">
                <button id="acceptMatchBtn" class="bg-green-800 hover:bg-green-900 px-3 py-1 rounded text-sm">
                    ✅ Accept
                </button>
                <button id="declineMatchBtn" class="bg-red-800 hover:bg-red-900 px-3 py-1 rounded text-sm">
                    ❌ Decline
                </button>
            </div>
        `
		document.body.appendChild(notification)

		// Add event listeners for accept/decline
		const acceptBtn = notification.querySelector('#acceptMatchBtn')
		const declineBtn = notification.querySelector('#declineMatchBtn')

		acceptBtn?.addEventListener('click', async () => {
			try {
				await tetrisMatchmakingService.respondToMatch(data.matchId, 'accept')
				notification.remove()
				// Tournament will start via WebSocket event
			} catch (error) {
				console.error('Failed to accept match:', error)
				alert('Failed to accept match')
			}
		})

		declineBtn?.addEventListener('click', async () => {
			try {
				await tetrisMatchmakingService.respondToMatch(data.matchId, 'decline')
				notification.remove()
				// Return to matchmaking
			} catch (error) {
				console.error('Failed to decline match:', error)
				notification.remove()
			}
		})

		// Auto-decline after 30 seconds
		setTimeout(() => {
			if (document.body.contains(notification)) {
				notification.remove()
				tetrisMatchmakingService.respondToMatch(data.matchId, 'decline').catch(console.error)
				alert('Match declined due to timeout')
			}
		}, 30000)
	}
}

function getModeDisplayName(mode: string): string {
	const modes: { [key: string]: string } = {
		'sprint': '🏃 Sprint',
		'ultra': '⚡ Ultra',
		'survival': '💀 Survival'
	}
	return modes[mode] || mode
}

async function loadPlayerSkillLevel() {
	const skillLevelEl = document.getElementById('playerSkillLevel')
	if (!skillLevelEl) return

	try {
		const status = await tetrisMatchmakingService.getMatchmakingStatus()
		if (status.skillLevel) {
			skillLevelEl.textContent = status.skillLevel.toString()
		} else {
			skillLevelEl.textContent = 'New Player'
		}
	} catch (error) {
		console.error('Failed to load skill level:', error)
		skillLevelEl.textContent = 'Unknown'
	}
}

async function loadQueue() {
	const queueList = document.getElementById('queueList')
	if (!queueList) return

	try {
		const response = await tetrisMatchmakingService.getQueueStatus()
		const queue = response.queue || []

		if (queue.length === 0) {
			queueList.innerHTML = `
                <div class="text-center py-4 text-gray-400">
                    <p>🎮 No matches available</p>
                    <p class="text-sm mt-1">Create a match to get started!</p>
                </div>
            `
			return
		}

		queueList.innerHTML = queue.map((player: any) => {
			const waitMinutes = Math.floor(player.waitTime / 60000)
			const waitSeconds = Math.floor((player.waitTime % 60000) / 1000)
			const waitTimeStr = `${waitMinutes}:${waitSeconds.toString().padStart(2, '0')}`

			return `
                <div class="match-card flex justify-between items-center p-3 bg-zinc-700 rounded cursor-pointer hover:bg-zinc-600 transition-colors border border-gray-600 hover:border-orange-400"
                     data-player-id="${player.id}" 
                     data-username="${player.username}" 
                     data-mode="${player.mode}" 
                     data-skill="${player.skillLevel}">
                    <div class="flex items-center space-x-3">
                        <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            ${player.username.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <p class="text-white font-medium">${player.username}</p>
                            <p class="text-gray-400 text-sm">${getModeDisplayName(player.mode)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-orange-400 font-semibold">Level ${player.skillLevel}</p>
                        <p class="text-gray-400 text-xs">Waiting ${waitTimeStr}</p>
                        <p class="text-green-400 text-xs font-medium">👆 Click to Join</p>
                    </div>
                </div>
            `
		}).join('')

		// Add click listeners to match cards
		document.querySelectorAll('.match-card').forEach(card => {
			card.addEventListener('click', () => {
				const playerId = card.getAttribute('data-player-id')
				const username = card.getAttribute('data-username')
				const mode = card.getAttribute('data-mode')
				const skill = card.getAttribute('data-skill')

				if (playerId && username && mode && skill) {
					showJoinMatchModal(playerId, username, mode, skill)
				}
			})
		})

	} catch (error) {
		console.error('Failed to load queue:', error)
		queueList.innerHTML = `
            <div class="text-center py-4 text-red-400">
                <p>❌ Failed to load matches</p>
                <p class="text-sm text-gray-500 mt-1">Please try refreshing</p>
            </div>
        `
	}
}

async function loadRecentMatches() {
	const recentMatches = document.getElementById('recentMatches')
	if (!recentMatches) return

	try {
		// Simulate recent matches data
		const mockMatches = [
			{ opponent: 'TetrisPro', result: 'win', score: '850 - 720', date: new Date(Date.now() - 3600000) },
			{ opponent: 'BlockMaster', result: 'loss', score: '640 - 890', date: new Date(Date.now() - 7200000) },
			{ opponent: 'LineClearer', result: 'win', score: '920 - 650', date: new Date(Date.now() - 10800000) },
		]

		if (mockMatches.length === 0) {
			return // Keep the default "No recent matches" message
		}

		recentMatches.innerHTML = mockMatches.map(match => `
            <div class="flex justify-between items-center p-3 bg-zinc-700 rounded">
                <div>
                    <p class="text-white font-medium">vs ${match.opponent}</p>
                    <p class="text-gray-400 text-sm">${match.date.toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-${match.result === 'win' ? 'green' : 'red'}-400 font-semibold capitalize">${match.result}</p>
                    <p class="text-gray-400 text-sm">${match.score}</p>
                </div>
            </div>
        `).join('')

	} catch (error) {
		console.error('Failed to load recent matches:', error)
	}
}

// Modal functions for joining matches
function showJoinMatchModal(playerId: string, username: string, mode: string, skill: string) {
	const modal = document.getElementById('joinMatchModal')
	const opponentName = document.getElementById('modalOpponentName')
	const matchMode = document.getElementById('modalMatchMode')
	const opponentSkill = document.getElementById('modalOpponentSkill')
	const confirmBtn = document.getElementById('confirmJoinBtn')
	const cancelBtn = document.getElementById('cancelJoinBtn')

	if (!modal || !opponentName || !matchMode || !opponentSkill || !confirmBtn || !cancelBtn) return

	// Populate modal data
	opponentName.textContent = username
	matchMode.textContent = getModeDisplayName(mode)
	opponentSkill.textContent = skill

	// Show modal
	modal.classList.remove('hidden')
	modal.classList.add('flex')

	// Set up event listeners
	confirmBtn.onclick = () => joinMatch(playerId, modal)
	cancelBtn.onclick = () => hideJoinMatchModal(modal)

	// Close modal when clicking outside
	modal.onclick = (e) => {
		if (e.target === modal) {
			hideJoinMatchModal(modal)
		}
	}
}

function hideJoinMatchModal(modal: HTMLElement) {
	modal.classList.add('hidden')
	modal.classList.remove('flex')
}

async function joinMatch(playerId: string, modal: HTMLElement) {
	try {
		// Here we would implement the logic to join an existing match
		// For now, we'll use the existing service but modify it to handle joining
		await tetrisMatchmakingService.joinExistingMatch(playerId, selectedTournamentMode)

		hideJoinMatchModal(modal)
		alert('Successfully joined the match! Tournament will start shortly.')

		// Refresh the queue to remove the joined match
		loadQueue()

	} catch (error) {
		console.error('Failed to join match:', error)
		alert('Failed to join match. Please try again.')
	}
}

// Cleanup function to be called when leaving the view
export function cleanupMatchmaking() {
	if (searchInterval) {
		clearInterval(searchInterval)
		searchInterval = null
	}
	if (queueRefreshInterval) {
		clearInterval(queueRefreshInterval)
		queueRefreshInterval = null
	}
}
