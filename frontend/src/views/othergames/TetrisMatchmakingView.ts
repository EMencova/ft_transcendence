import { currentUser, currentUserId } from "../../logic/auth"
import { initTetrisGame } from "../../logic/tetrisGame"
import { tetrisMatchmakingService } from "../../services/tetrisMatchmakingService"

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
            
            <!-- Pending Matches Section -->
            <div id="pendingMatchesSection" class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-orange-700 mb-6 hidden">
                <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                    🔔 Pending Matches
                </h4>
                <p class="text-gray-300 mb-4">Matches waiting for action</p>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Waiting for You -->
                    <div class="bg-orange-900/10 border border-orange-500/30 rounded-lg p-4">
                        <h5 class="text-orange-400 font-semibold mb-3 flex items-center">
                            🎮 Your Turn
                        </h5>
                        <div id="waitingForYouList" class="space-y-3">
                            <!-- Matches waiting for user will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Waiting for Opponent -->
                    <div class="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4">
                        <h5 class="text-blue-400 font-semibold mb-3 flex items-center">
                            ⏳ Waiting for Opponent
                        </h5>
                        <div id="waitingForOpponentList" class="space-y-3">
                            <!-- Matches waiting for opponent will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            🗑️ Remove Match
                        </button>
                    </div>
                    
                    <div id="matchmakingStatus" class="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded hidden">
                        <div class="flex items-center justify-center space-x-2">
                            <span class="text-green-400">✅</span>
                            <p id="statusMessage" class="text-green-300 font-medium">Match created successfully!</p>
                        </div>
                        <p class="text-green-200 text-sm text-center mt-1">Other players can now join your match</p>
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

            <!-- Join Match Options Modal -->
            <div id="joinMatchModal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden z-50">
                <div class="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                    <h3 class="text-xl font-bold text-white mb-4">🎮 Join Match</h3>
                    <div id="matchDetails" class="mb-6">
                        <p class="text-gray-300 mb-4">Choose how you want to play this match:</p>
                        <div class="bg-zinc-800 p-4 rounded border border-gray-600 mb-4">
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
                        
                        <!-- Play Options -->
                        <div class="space-y-3">
                            <div class="bg-green-900/20 border border-green-500/30 rounded-lg p-4 hover:bg-green-900/30 transition-colors cursor-pointer" id="playNowOption">
                                <div class="flex items-center space-x-3">
                                    <span class="text-2xl">⚡</span>
                                    <div>
                                        <h4 class="text-green-400 font-semibold">Play Now (Both Present)</h4>
                                        <p class="text-gray-300 text-sm">Play simultaneously if both players are available</p>
                                        <p class="text-green-200 text-xs mt-1">⚠️ Opponent must confirm with password</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-900/30 transition-colors cursor-pointer" id="playLaterOption">
                                <div class="flex items-center space-x-3">
                                    <span class="text-2xl">⏰</span>
                                    <div>
                                        <h4 class="text-blue-400 font-semibold">Play Later (Turn-based)</h4>
                                        <p class="text-gray-300 text-sm">Take turns playing when convenient</p>
                                        <p class="text-blue-200 text-xs mt-1">✅ No need for opponent to be online</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button id="cancelJoinBtn" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Opponent Password Confirmation Modal -->
            <div id="passwordConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden z-50">
                <div class="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                    <h3 class="text-xl font-bold text-white mb-4">🔐 Opponent Confirmation</h3>
                    <div class="mb-6">
                        <p class="text-gray-300 mb-4">To play simultaneously, <span id="confirmOpponentName" class="text-orange-400 font-semibold">opponent</span> must confirm they are present:</p>
                        <div class="bg-zinc-800 p-4 rounded border border-gray-600">
                            <label class="block text-gray-400 text-sm mb-2">Opponent's Password:</label>
                            <input type="password" id="opponentPasswordInput" class="w-full bg-zinc-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-orange-400 focus:outline-none" placeholder="Enter opponent's password">
                            <p class="text-gray-500 text-xs mt-2">⚠️ This confirms both players are present</p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button id="confirmPasswordBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold">
                            ✅ Confirm & Play Now
                        </button>
                        <button id="cancelPasswordBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `

	initializeMatchmaking()
}

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
	loadPendingMatches()

	// Check current user status to restore proper UI state (async, after DOM is ready)
	setTimeout(() => {
		checkUserMatchmakingStatus().catch(error => {
			console.error('Failed to check user status:', error)
		})
	}, 100)

	// Set up automatic queue refresh
	queueRefreshInterval = window.setInterval(loadQueue, 10000) // Refresh every 10 seconds
}

async function checkUserMatchmakingStatus() {
	try {
		console.log('Checking user matchmaking status...')
		const status = await tetrisMatchmakingService.getMatchmakingStatus()
		console.log('User status response:', status)

		if (status.status === 'in_queue') {
			console.log('User is in queue, restoring UI state')

			// User is already in queue, show the "Remove Match" state
			const createMatchBtn = document.getElementById('createMatchBtn')
			const cancelMatchBtn = document.getElementById('cancelMatchBtn')
			const matchmakingStatus = document.getElementById('matchmakingStatus')
			const statusMessage = document.getElementById('statusMessage')

			const mode = TOURNAMENT_MODES.find(m => m.id === status.mode)
			console.log('Found mode:', mode)

			if (createMatchBtn) createMatchBtn.classList.add('hidden')
			if (cancelMatchBtn) cancelMatchBtn.classList.remove('hidden')
			if (matchmakingStatus) matchmakingStatus.classList.remove('hidden')
			if (statusMessage && mode) {
				statusMessage.textContent = `Match created in ${mode.name}!`
			}

			// Update skill level if available
			if (status.skillLevel) {
				const skillLevelEl = document.getElementById('playerSkillLevel')
				if (skillLevelEl) {
					skillLevelEl.textContent = status.skillLevel.toString()
				}
			}
		} else {
			console.log('User is not in queue, keeping default state')
		}
	} catch (error) {
		console.error('Error checking user status:', error)
		// If error, assume user is not in queue (default state)
	}
}

function setupWebSocketListeners() {
	// Listen for match found events
	tetrisMatchmakingService.on('match_found', (data: any) => {
		console.log('Match found via WebSocket:', data)
		showMatchFoundNotification(data)
	})

	// Listen for tournament start events
	tetrisMatchmakingService.on('tournament_start', (data: any) => {
		console.log('Simultaneous match starting:', data)
		// Start the real simultaneous match with both players
		const selectedMode = TOURNAMENT_MODES.find(mode => mode.id === data.mode)
		if (selectedMode) {
			// Use our new simultaneous match function instead of tournament
			startSimultaneousMatch({
				mode: selectedMode.id,
				opponent: data.opponent.username,
				winCondition: selectedMode.description
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
		// Create match in the queue
		const result = await tetrisMatchmakingService.joinQueue(selectedTournamentMode)
		console.log('Joined matchmaking queue:', result)

		// Update skill level display
		const skillLevelEl = document.getElementById('playerSkillLevel')
		if (skillLevelEl) {
			skillLevelEl.textContent = result.skillLevel.toString()
		}

		// Show success message and update UI
		createMatchBtn.classList.add('hidden')
		cancelMatchBtn.classList.remove('hidden')
		matchmakingStatus.classList.remove('hidden')

		// Update status message
		const statusMessage = document.getElementById('statusMessage')
		if (statusMessage) {
			statusMessage.textContent = `Match created in ${selectedMode.name}!`
		}

		// Refresh the queue to show the current match
		loadQueue()

		// If match was found immediately (someone joined right away)
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
		loadQueue() // Refresh to remove the match from the list
		console.log('Removed match from queue')
	} catch (error) {
		console.error('Failed to remove match from queue:', error)
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
		console.log('Loading player skill level...')
		const status = await tetrisMatchmakingService.getMatchmakingStatus()
		console.log('Skill level status response:', status)

		if (status.skillLevel !== undefined && status.skillLevel !== null) {
			skillLevelEl.textContent = status.skillLevel.toString()
			console.log('Skill level set to:', status.skillLevel)
		} else {
			skillLevelEl.textContent = 'New Player'
			console.log('No skill level found, defaulting to "New Player"')
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

			const isOwnMatch = player.id === currentUserId
			const cardClasses = isOwnMatch
				? "match-card flex justify-between items-center p-3 bg-zinc-800 rounded border border-gray-500 opacity-75"
				: "match-card flex justify-between items-center p-3 bg-zinc-700 rounded cursor-pointer hover:bg-zinc-600 transition-colors border border-gray-600 hover:border-orange-400"

			return `
                <div class="${cardClasses}"
                     data-player-id="${player.id}" 
                     data-username="${player.username}" 
                     data-mode="${player.mode}" 
                     data-skill="${player.skillLevel}"
                     data-is-own="${isOwnMatch}">
                    <div class="flex items-center space-x-3">
                        <span class="w-8 h-8 ${isOwnMatch ? 'bg-gray-500' : 'bg-orange-500'} rounded-full flex items-center justify-center text-white text-sm font-bold">
                            ${player.username.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <p class="text-white font-medium">${player.username} ${isOwnMatch ? '(You)' : ''}</p>
                            <p class="text-gray-400 text-sm">${getModeDisplayName(player.mode)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="${isOwnMatch ? 'text-gray-400' : 'text-orange-400'} font-semibold">Level ${player.skillLevel}</p>
                        <p class="text-gray-400 text-xs">Waiting ${waitTimeStr}</p>
                        ${isOwnMatch
					? '<p class="text-gray-500 text-xs">Your match</p>'
					: '<p class="text-green-400 text-xs font-medium">👆 Click to Join</p>'
                        }
                    </div>
                </div>
            `
		}).join('')

		// Add click listeners to match cards (only for other players' matches)
		document.querySelectorAll('.match-card').forEach(card => {
			const isOwnMatch = card.getAttribute('data-is-own') === 'true'

			if (!isOwnMatch) {
				card.addEventListener('click', () => {
					const playerId = card.getAttribute('data-player-id')
					const username = card.getAttribute('data-username')
					const mode = card.getAttribute('data-mode')
					const skill = card.getAttribute('data-skill')

					if (playerId && username && mode && skill) {
						showJoinMatchModal(playerId, username, mode, skill)
					}
				})
			}
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
		// Get real completed matches from the API
		const completedMatches = await tetrisMatchmakingService.getCompletedMatches()

		if (completedMatches.length === 0) {
			recentMatches.innerHTML = `
				<div class="text-center py-4">
					<p class="text-gray-400">No recent matches</p>
					<p class="text-gray-500 text-sm mt-1">Play some matches to see your history here</p>
				</div>
			`
			return
		}

		recentMatches.innerHTML = completedMatches.map(match => {
			const matchDate = new Date(match.completedAt)
			const resultColor = match.result === 'won' ? 'green' : match.result === 'lost' ? 'red' : 'gray'
			const resultIcon = match.result === 'won' ? '🏆' : match.result === 'lost' ? '💔' : '⚖️'
			const playTypeIcon = match.playType === 'turn_based' ? '⏰' : '⚡'

			return `
				<div class="flex justify-between items-center p-3 bg-zinc-700 rounded border-l-4 border-${resultColor}-500">
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<span class="text-lg">${resultIcon}</span>
							<p class="text-white font-medium">vs ${match.opponent}</p>
							<span class="text-xs text-gray-400">${playTypeIcon} ${match.playType === 'turn_based' ? 'Turn-based' : 'Simultaneous'}</span>
						</div>
						<p class="text-gray-400 text-sm">${matchDate.toLocaleDateString()} at ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
						<p class="text-gray-500 text-xs">${getModeDisplayName(match.mode)}</p>
					</div>
					<div class="text-right">
						<p class="text-${resultColor}-400 font-semibold capitalize">${match.result === 'won' ? 'Victory' : match.result === 'lost' ? 'Defeat' : 'Tie'}</p>
						<p class="text-white text-sm">${match.userScore} - ${match.opponentScore}</p>
						<p class="text-gray-400 text-xs">${match.userLines} lines cleared</p>
					</div>
				</div>
			`
		}).join('')

	} catch (error) {
		console.error('Failed to load recent matches:', error)
		recentMatches.innerHTML = `
			<div class="text-center py-4 text-red-400">
				<p>❌ Failed to load recent matches</p>
				<p class="text-sm text-gray-500 mt-1">Please try refreshing</p>
			</div>
		`
	}
}

async function loadPendingMatches() {
	const pendingSection = document.getElementById('pendingMatchesSection')
	const waitingForYouList = document.getElementById('waitingForYouList')
	const waitingForOpponentList = document.getElementById('waitingForOpponentList')
	if (!pendingSection || !waitingForYouList || !waitingForOpponentList) return

	try {
		// Get real pending matches from the API
		const pendingMatches = await tetrisMatchmakingService.getPendingMatches()

		// Separate matches by status
		const waitingForYou = pendingMatches.filter(match => match.status === 'waiting_for_you')
		const waitingForOpponent = pendingMatches.filter(match => match.status === 'waiting_for_opponent')

		// Show/hide section based on whether there are any pending matches
		if (pendingMatches.length === 0) {
			pendingSection.classList.add('hidden')
			return
		}

		pendingSection.classList.remove('hidden')

		// Populate "Waiting for You" list
		if (waitingForYou.length === 0) {
			waitingForYouList.innerHTML = `
				<div class="text-center py-6 text-orange-300">
					<p class="text-sm">🎯 No matches waiting</p>
					<p class="text-xs text-gray-400 mt-1">All caught up!</p>
				</div>
			`
		} else {
			waitingForYouList.innerHTML = waitingForYou.map(match => `
				<div class="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 cursor-pointer hover:bg-orange-900/30 transition-colors" 
					 data-match-id="${match.id}">
					<div class="flex justify-between items-start">
						<div>
							<h6 class="text-white font-semibold text-sm">vs ${match.opponent}</h6>
							<p class="text-gray-400 text-xs">${getModeDisplayName(match.mode)}</p>
							<p class="text-orange-400 text-xs font-medium mt-1">🎮 Your turn!</p>
						</div>
						<div class="text-right text-xs">
							<p class="text-gray-300">Target to beat:</p>
							<p class="text-orange-400 font-bold">${match.opponentScore} pts</p>
							<p class="text-gray-400">${match.opponentLines} lines</p>
							<p class="text-gray-500 mt-1">${new Date(match.created).toLocaleTimeString()}</p>
						</div>
					</div>
					<p class="text-orange-300 text-xs mt-2 text-center">👆 Click to play</p>
				</div>
			`).join('')

			// Add click listeners for "waiting for you" matches
			waitingForYouList.querySelectorAll('[data-match-id]').forEach(card => {
				card.addEventListener('click', () => {
					const matchId = card.getAttribute('data-match-id')
					if (matchId) {
						startPendingMatch(matchId)
					}
				})
			})
		}

		// Populate "Waiting for Opponent" list
		if (waitingForOpponent.length === 0) {
			waitingForOpponentList.innerHTML = `
				<div class="text-center py-6 text-blue-300">
					<p class="text-sm">⏳ No pending results</p>
					<p class="text-xs text-gray-400 mt-1">Start some matches!</p>
				</div>
			`
		} else {
			waitingForOpponentList.innerHTML = waitingForOpponent.map(match => `
				<div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
					<div class="flex justify-between items-start">
						<div>
							<h6 class="text-white font-semibold text-sm">vs ${match.opponent}</h6>
							<p class="text-gray-400 text-xs">${getModeDisplayName(match.mode)}</p>
							<p class="text-blue-400 text-xs font-medium mt-1">⏳ Waiting for opponent</p>
						</div>
						<div class="text-right text-xs">
							<p class="text-gray-300">Your result:</p>
							<p class="text-blue-400 font-bold">${match.yourScore} pts</p>
							<p class="text-gray-400">${match.yourLines} lines</p>
							<p class="text-gray-500 mt-1">${new Date(match.created).toLocaleTimeString()}</p>
						</div>
					</div>
				</div>
			`).join('')
		}

	} catch (error) {
		console.error('Failed to load pending matches:', error)
		pendingSection.classList.add('hidden')
	}
}

function startPendingMatch(matchId: string) {
	// Find the match in the pending matches to get the data
	tetrisMatchmakingService.getPendingMatches()
		.then(pendingMatches => {
			const match = pendingMatches.find(m => m.id === matchId)
			if (match) {
				const matchData = {
					matchId: matchId,
					opponent: match.opponent,
					mode: match.mode,
					isFirstPlayer: true, // This is your turn to play
					opponentScore: match.opponentScore,
					opponentLines: match.opponentLines
				}

				// Import and show the turn-based game view
				import('./TurnBasedGameView').then(({ TurnBasedGameView }) => {
					const mainContent = document.getElementById("mainContent")
					if (mainContent) {
						TurnBasedGameView(mainContent, matchData)
					}
				})
			} else {
				alert('Match not found. Please refresh and try again.')
			}
		})
		.catch(error => {
			console.error('Failed to load pending match:', error)
			alert('Failed to load match details. Please try again.')
		})
}

// Modal functions for joining matches
function showJoinMatchModal(playerId: string, username: string, mode: string, skill: string) {
	const modal = document.getElementById('joinMatchModal')
	const opponentName = document.getElementById('modalOpponentName')
	const matchMode = document.getElementById('modalMatchMode')
	const opponentSkill = document.getElementById('modalOpponentSkill')
	const cancelBtn = document.getElementById('cancelJoinBtn')
	const playNowOption = document.getElementById('playNowOption')
	const playLaterOption = document.getElementById('playLaterOption')

	if (!modal || !opponentName || !matchMode || !opponentSkill || !cancelBtn || !playNowOption || !playLaterOption) return

	// Populate modal data
	opponentName.textContent = username
	matchMode.textContent = getModeDisplayName(mode)
	opponentSkill.textContent = skill

	// Show modal
	modal.classList.remove('hidden')
	modal.classList.add('flex')

	// Set up event listeners for options
	playNowOption.onclick = () => {
		hideJoinMatchModal(modal)
		showPasswordConfirmModal(playerId, username, mode, skill)
	}

	playLaterOption.onclick = () => {
		joinMatchAsync(playerId, modal, 'turn_based')
	}

	cancelBtn.onclick = () => hideJoinMatchModal(modal)

	// Close modal when clicking outside
	modal.onclick = (e) => {
		if (e.target === modal) {
			hideJoinMatchModal(modal)
		}
	}
}

function showPasswordConfirmModal(playerId: string, username: string, mode: string, skill: string) {
	const modal = document.getElementById('passwordConfirmModal')
	const confirmOpponentName = document.getElementById('confirmOpponentName')
	const passwordInput = document.getElementById('opponentPasswordInput') as HTMLInputElement
	const confirmBtn = document.getElementById('confirmPasswordBtn')
	const cancelBtn = document.getElementById('cancelPasswordBtn')

	if (!modal || !confirmOpponentName || !passwordInput || !confirmBtn || !cancelBtn) return

	// Populate modal data
	confirmOpponentName.textContent = username
	passwordInput.value = ''

	// Show modal
	modal.classList.remove('hidden')
	modal.classList.add('flex')

	// Set up event listeners
	confirmBtn.onclick = async () => {
		const password = passwordInput.value.trim()
		if (!password) {
			alert('Please enter the opponent\'s password')
			return
		}

		try {
			// Verify password and join match for simultaneous play
			await joinMatchSimultaneous(playerId, password, modal)
		} catch (error) {
			console.error('Failed to verify password:', error)
			alert('Invalid password or failed to join match')
		}
	}

	cancelBtn.onclick = () => {
		hidePasswordConfirmModal(modal)
		// Return to join options modal
		showJoinMatchModal(playerId, username, mode, skill)
	}

	// Close modal when clicking outside
	modal.onclick = (e) => {
		if (e.target === modal) {
			hidePasswordConfirmModal(modal)
		}
	}

	// Focus on password input
	setTimeout(() => passwordInput.focus(), 100)
}

function hideJoinMatchModal(modal: HTMLElement) {
	modal.classList.add('hidden')
	modal.classList.remove('flex')
}

function hidePasswordConfirmModal(modal: HTMLElement) {
	modal.classList.add('hidden')
	modal.classList.remove('flex')
}

async function joinMatchAsync(playerId: string, modal: HTMLElement, playType: 'turn_based' | 'simultaneous') {
	try {
		// Get opponent info from the modal before joining
		const opponentName = document.getElementById('modalOpponentName')?.textContent || 'Unknown Player'

		// Join match for asynchronous/turn-based play
		const joinResult = await tetrisMatchmakingService.joinExistingMatch(playerId, selectedTournamentMode, playType)

		hideJoinMatchModal(modal)

		if (playType === 'turn_based') {
			// Navigate to turn-based game view
			const matchData = {
				matchId: joinResult.matchId || playerId, // Use the returned match ID or fallback
				opponent: opponentName,
				mode: selectedTournamentMode,
				isFirstPlayer: true, // Player joining is the one who plays first (player2 in database)
				opponentScore: undefined, // Will be loaded if opponent already played
				opponentLines: undefined
			}

			console.log('Navigating to turn-based game with data:', matchData)

			// Import and show the turn-based game view
			import('./TurnBasedGameView').then(({ TurnBasedGameView }) => {
				const mainContent = document.getElementById("mainContent")
				if (mainContent) {
					TurnBasedGameView(mainContent, matchData)
				}
			})
		} else {
			alert('Successfully joined the match for simultaneous play!')
		}

		// Refresh the queue to remove the joined match
		loadQueue()
		// Load pending matches for this user
		loadPendingMatches()
		// Load recent matches to show completed matches
		loadRecentMatches()

	} catch (error) {
		console.error('Failed to join match:', error)
		alert('Failed to join match. Please try again.')
	}
}

async function joinMatchSimultaneous(playerId: string, password: string, modal: HTMLElement) {
	try {
		// Verify password first
		const passwordVerification = await tetrisMatchmakingService.verifyOpponentPassword(playerId, password)

		if (!passwordVerification.valid) {
			alert('Invalid password. Please ask your opponent for the correct password.')
			return
		}

		// Join match for simultaneous play
		await tetrisMatchmakingService.joinExistingMatch(playerId, selectedTournamentMode, 'simultaneous')

		hidePasswordConfirmModal(modal)
		alert('Password confirmed! Both players can now play simultaneously.')

		// Refresh the queue to remove the joined match
		loadQueue()
		// Load recent matches to show completed matches
		loadRecentMatches()

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

// Function to create a Tetris game instance with unique IDs and custom controls
function createTetrisInstance(container: HTMLElement, playerId: string, controls: any, matchConfig?: any) {
	// Create unique IDs for this player that match the display IDs (above the game area)
	const canvasId = `tetrisCanvas_${playerId}`
	const scoreId = `${playerId}Score`
	const levelId = `${playerId}Level`
	const linesId = `${playerId}Lines`

	// Create the game HTML with unique IDs (no individual start button)
	container.innerHTML = `
		<div class="tetris-game-container flex flex-col items-center">
			<canvas id="${canvasId}" width="280" height="600" class="border border-gray-500 bg-black"></canvas>
		</div>
	`

	// Track game state for match monitoring
	let currentScore = 0
	let currentLevel = 1
	let currentLines = 0
	let gameEnded = false

	// Initialize the Tetris game using the modularized function
	const gameInstance = initTetrisGame({
		canvasId: canvasId,
		keyControls: {
			left: controls.moveLeft === 'KeyA' ? 'a' : 'ArrowLeft',
			right: controls.moveRight === 'KeyD' ? 'd' : 'ArrowRight',
			down: controls.softDrop === 'KeyS' ? 's' : 'ArrowDown',
			rotate: controls.rotate === 'KeyW' ? 'w' : 'ArrowUp'
		},
		saveScore: false,
		tournamentMode: false,
		showAlerts: false, // Disable individual alerts for simultaneous mode
		onScoreUpdate: (score: number, level: number, lines: number) => {
			// Update the main display elements for this player (above the game area)
			const scoreEl = document.getElementById(scoreId)
			const levelEl = document.getElementById(levelId)
			const linesEl = document.getElementById(linesId)

			if (scoreEl) scoreEl.textContent = score.toString()
			if (levelEl) levelEl.textContent = level.toString()
			if (linesEl) linesEl.textContent = lines.toString()

			// Update local tracking variables
			currentScore = score
			currentLevel = level
			currentLines = lines

			// Debug logging for speed progression
			console.log(`${playerId} - Score: ${score}, Level: ${level}, Lines: ${lines}`)

			// Check win condition for Sprint Mode
			if (matchConfig && matchConfig.mode === 'sprint' && lines >= 40 && !gameEnded) {
				gameEnded = true
				console.log(`🏆 ${playerId} won Sprint Mode with ${lines} lines!`)

				// Capture winner stats IMMEDIATELY before anything else
				const winnerStats = {
					score: score,
					level: level,
					lines: lines
				}
				console.log(`Capturing ${playerId} winner stats:`, winnerStats)

				// Stop this game immediately
				if (gameInstance && gameInstance.stopGame) {
					gameInstance.stopGame()
				}

				// End the match and show results with winner stats
				endSimultaneousMatch(playerId, matchConfig, winnerStats)
			}
		},
		onGameOver: (finalScore: number, finalLevel: number, finalLines: number) => {
			if (!gameEnded) {
				gameEnded = true
				// Update final stats
				currentScore = finalScore
				currentLevel = finalLevel
				currentLines = finalLines

				// Update display one last time
				const scoreEl = document.getElementById(scoreId)
				const levelEl = document.getElementById(levelId)
				const linesEl = document.getElementById(linesId)

				if (scoreEl) scoreEl.textContent = finalScore.toString()
				if (levelEl) levelEl.textContent = finalLevel.toString()
				if (linesEl) linesEl.textContent = finalLines.toString()

				// Determine winner based on mode
				if (matchConfig) {
					if (matchConfig.mode === 'survival') {
						// First to game over loses, so the other player wins
						const winner = playerId === 'player1' ? 'player2' : 'player1'
						// In survival mode, we don't have winner stats immediately, let the function get them
						endSimultaneousMatch(winner, matchConfig)
					}
				}
			}
		}
	})

	// Add method to get current stats
	if (gameInstance) {
		(gameInstance as any).getCurrentStats = () => ({
			score: currentScore,
			level: currentLevel,
			lines: currentLines,
			gameEnded: gameEnded
		})
	}

	return gameInstance
}
// Function to start a real simultaneous match with both players
function startSimultaneousMatch(config: { mode: string; opponent: string; winCondition: string }) {
	// Reset match ended flag for new match
	matchEnded = false

	const mainContent = document.getElementById("mainContent")
	if (!mainContent) return

	mainContent.innerHTML = `
        <div class="min-h-screen bg-gray-900 p-4">
            <!-- Match Header -->
            <div class="max-w-7xl mx-auto mb-6">
                <div class="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
                    <div class="grid grid-cols-3 gap-4 items-center">
                        <!-- Left Column: Match Info -->
                        <div class="text-left">
                            <h2 class="text-xl font-bold text-white mb-1">🎮 Simultaneous Match</h2>
                            <p class="text-gray-300 text-sm">Mode: ${getModeDisplayName(config.mode)}</p>
                            <p class="text-gray-400 text-xs">${config.winCondition}</p>
                        </div>
                        
                        <!-- Center Column: Timer & Controls -->
                        <div class="text-center">
                            <p class="text-green-400 font-bold text-lg">🟢 LIVE MATCH</p>
                            <p class="text-gray-400 text-xs mb-2">Both players active</p>
                            <div class="bg-gray-800 rounded-lg px-4 py-2 mb-3 inline-block">
                                <p class="text-white text-2xl font-bold" id="matchTimer">00:00</p>
                                <p class="text-gray-400 text-xs">Match Time</p>
                            </div>
                            <br>
                            <button id="startBothGamesBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                                🚀 Start Both Games
                            </button>
                        </div>
                        
                        <!-- Right Column: Match Controls -->
                        <div class="text-right">
                            <button id="endMatchBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                                🏳️ End Match
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dual Game Area -->
            <div class="max-w-7xl mx-auto">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Player 1 Area -->
                    <div class="bg-[#1a1a1a] rounded-lg p-4 border border-blue-500">
                        <div class="text-center mb-4">
                            <h3 class="text-xl font-bold text-blue-400">👤 You</h3>
                            <div class="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div class="bg-blue-900/20 p-2 rounded">
                                    <p class="text-blue-300">Score</p>
                                    <p id="player1Score" class="text-white font-bold">0</p>
                                </div>
                                <div class="bg-blue-900/20 p-2 rounded">
                                    <p class="text-blue-300">Level</p>
                                    <p id="player1Level" class="text-white font-bold">1</p>
                                </div>
                                <div class="bg-blue-900/20 p-2 rounded">
                                    <p class="text-blue-300">Lines</p>
                                    <p id="player1Lines" class="text-white font-bold">0</p>
                                </div>
                            </div>
                        </div>
                        <div id="player1GameArea" class="flex justify-center"></div>
                    </div>

                    <!-- Player 2 Area -->
                    <div class="bg-[#1a1a1a] rounded-lg p-4 border border-orange-500">
                        <div class="text-center mb-4">
                            <h3 class="text-xl font-bold text-orange-400">👥 ${config.opponent}</h3>
                            <div class="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div class="bg-orange-900/20 p-2 rounded">
                                    <p class="text-orange-300">Score</p>
                                    <p id="player2Score" class="text-white font-bold">0</p>
                                </div>
                                <div class="bg-orange-900/20 p-2 rounded">
                                    <p class="text-orange-300">Level</p>
                                    <p id="player2Level" class="text-white font-bold">1</p>
                                </div>
                                <div class="bg-orange-900/20 p-2 rounded">
                                    <p class="text-orange-300">Lines</p>
                                    <p id="player2Lines" class="text-white font-bold">0</p>
                                </div>
                            </div>
                        </div>
                        <div id="player2GameArea" class="flex justify-center"></div>
                    </div>
                </div>

                <!-- Match Instructions -->
                <div class="mt-6 bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 text-center">
                    <p class="text-white font-semibold mb-2">🎮 How to Play Simultaneous Mode</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                            <p class="text-blue-400 font-semibold">Player 1 Controls:</p>
                            <p>🔵 A/D: Move Left/Right</p>
                            <p>🔵 W: Rotate</p>
                            <p>🔵 S: Soft Drop</p>
                            <p>🔵 Space: Hard Drop</p>
                        </div>
                        <div>
                            <p class="text-orange-400 font-semibold">Player 2 Controls:</p>
                            <p>🟠 ←/→: Move Left/Right</p>
                            <p>🟠 ↑: Rotate</p>
                            <p>🟠 ↓: Soft Drop</p>
                            <p>🟠 Enter: Hard Drop</p>
                        </div>
                    </div>
                    <p class="text-gray-400 mt-4">Both players start together when you click the "Start Both Games" button in the header!</p>
                </div>
            </div>
        </div>
    `

	// Variables to store game instances and timer
	let gameInstance1: any = null
	let gameInstance2: any = null
	let timerInterval: any = null
	let matchStartTime: number

	// Start both games
	const player1GameArea = document.getElementById("player1GameArea")
	const player2GameArea = document.getElementById("player2GameArea")

	if (player1GameArea && player2GameArea) {
		// Create unique game instances with different control schemes
		gameInstance1 = createTetrisInstance(player1GameArea, 'player1', {
			moveLeft: 'KeyA',
			moveRight: 'KeyD',
			rotate: 'KeyW',
			softDrop: 'KeyS',
			hardDrop: 'Space',
			pause: 'Space'
		}, config)

		gameInstance2 = createTetrisInstance(player2GameArea, 'player2', {
			moveLeft: 'ArrowLeft',
			moveRight: 'ArrowRight',
			rotate: 'ArrowUp',
			softDrop: 'ArrowDown',
			hardDrop: 'Enter',
			pause: 'Enter'
		}, config)

			// Store game instances globally for access by endSimultaneousMatch
			; (window as any).simultaneousGameInstances = {
				player1: gameInstance1,
				player2: gameInstance2
			}
	}

	// Setup start both games button
	const startBothGamesBtn = document.getElementById("startBothGamesBtn") as HTMLButtonElement
	if (startBothGamesBtn) {
		startBothGamesBtn.addEventListener('click', () => {
			// Start both games simultaneously
			if (gameInstance1 && gameInstance1.startGame) {
				gameInstance1.startGame()
			}
			if (gameInstance2 && gameInstance2.startGame) {
				gameInstance2.startGame()
			}

			// Start match timer
			matchStartTime = Date.now()
			timerInterval = setInterval(() => {
				const elapsed = Date.now() - matchStartTime
				const minutes = Math.floor(elapsed / 60000)
				const seconds = Math.floor((elapsed % 60000) / 1000)
				const timerEl = document.getElementById("matchTimer")
				if (timerEl) {
					timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
				}
			}, 1000)

			// Update button text and disable
			startBothGamesBtn.textContent = '🎮 Games Running...'
			startBothGamesBtn.disabled = true
			startBothGamesBtn.classList.add('opacity-50', 'cursor-not-allowed')
		})
	}

	// Setup end match button
	const endMatchBtn = document.getElementById("endMatchBtn")
	if (endMatchBtn) {
		endMatchBtn.addEventListener('click', () => {
			if (confirm('Are you sure you want to end this match?')) {
				// Stop and cleanup both games
				if (gameInstance1 && gameInstance1.stopGame) {
					gameInstance1.stopGame()
				}
				if (gameInstance2 && gameInstance2.stopGame) {
					gameInstance2.stopGame()
				}

				// Clear timer
				if (timerInterval) {
					clearInterval(timerInterval)
					timerInterval = null
				}

				// Clear any remaining game intervals/timeouts
				// This helps prevent background Game Over alerts
				const highestId = setTimeout(() => { }, 0)
				for (let i = 0;i < highestId;i++) {
					clearTimeout(i)
					clearInterval(i)
				}

				// Clean up global references
				; (window as any).simultaneousGameInstances = null

				// Go back to matchmaking
				window.location.hash = '#othergames/matchmaking'
			}
		})
	}
}

// Global flag to prevent multiple match endings
let matchEnded = false

// Function to end simultaneous match and show results
function endSimultaneousMatch(winner: string, matchConfig: any, winnerStats?: any) {
	// Prevent multiple calls
	if (matchEnded) {
		console.log('Match already ended, ignoring subsequent call')
		return
	}
	matchEnded = true

	console.log('endSimultaneousMatch called with:', { winner, winnerStats })

	// Get final scores from both players BEFORE stopping the games
	const gameInstances = (window as any).simultaneousGameInstances
	let player1Stats = { score: 0, level: 1, lines: 0 }
	let player2Stats = { score: 0, level: 1, lines: 0 }

	// If winner stats are provided (from victory condition), use them directly
	if (winnerStats) {
		if (winner === 'player1') {
			player1Stats = winnerStats
			console.log('Using provided winner stats for player1:', player1Stats)
		} else {
			player2Stats = winnerStats
			console.log('Using provided winner stats for player2:', player2Stats)
		}
	}

	// Get stats from game instances for the other player
	if (gameInstances) {
		console.log('Game instances found:', gameInstances)
		if (gameInstances.player1 && gameInstances.player1.getCurrentStats && (!winnerStats || winner !== 'player1')) {
			const stats = gameInstances.player1.getCurrentStats()
			if (winner !== 'player1' || !winnerStats) {
				player1Stats = stats
			}
			console.log('Player1 stats from game instance:', stats)
		}
		if (gameInstances.player2 && gameInstances.player2.getCurrentStats && (!winnerStats || winner !== 'player2')) {
			const stats = gameInstances.player2.getCurrentStats()
			if (winner !== 'player2' || !winnerStats) {
				player2Stats = stats
			}
			console.log('Player2 stats from game instance:', stats)
		}
	} else {
		console.log('No game instances found')
	}

	// Fallback to DOM elements if game instances don't have stats
	if (player1Stats.score === 0 && player1Stats.lines === 0) {
		player1Stats = getPlayerStats('player1')
		console.log('Player1 stats from DOM fallback:', player1Stats)
	}
	if (player2Stats.score === 0 && player2Stats.lines === 0) {
		player2Stats = getPlayerStats('player2')
		console.log('Player2 stats from DOM fallback:', player2Stats)
	}

	console.log('Final stats before saving:', { player1Stats, player2Stats, winner })

	// Stop both games AFTER getting the stats
	if (gameInstances) {
		if (gameInstances.player1 && gameInstances.player1.stopGame) {
			gameInstances.player1.stopGame()
		}
		if (gameInstances.player2 && gameInstances.player2.stopGame) {
			gameInstances.player2.stopGame()
		}
	}

	// Show modal with results
	showSimultaneousGameOverModal(matchConfig, winner, player1Stats, player2Stats)

	// Save results to backend
	saveSimultaneousMatchResults(matchConfig, winner, player1Stats, player2Stats)
}

// Function to get current player stats
function getPlayerStats(playerId: string) {
	const scoreEl = document.getElementById(`${playerId}Score`)
	const levelEl = document.getElementById(`${playerId}Level`)
	const linesEl = document.getElementById(`${playerId}Lines`)

	return {
		score: parseInt(scoreEl?.textContent || '0'),
		level: parseInt(levelEl?.textContent || '1'),
		lines: parseInt(linesEl?.textContent || '0')
	}
}

// Function to show simultaneous game over modal
function showSimultaneousGameOverModal(matchConfig: any, winner: string, player1Stats: any, player2Stats: any) {
	const modal = document.createElement('div')
	modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'

	const isPlayer1Winner = winner === 'player1'

	modal.innerHTML = `
		<div class="bg-[#1a1a1a] rounded-lg p-8 max-w-lg w-full mx-4 border border-gray-700 text-center">
			<div class="mb-6">
				<span class="text-6xl">${isPlayer1Winner ? '🏆' : '💔'}</span>
				<h2 class="text-2xl font-bold text-white mt-4">
					${isPlayer1Winner ? 'Victory!' : 'Defeat!'}
				</h2>
				<p class="text-gray-400 mt-2">${matchConfig.mode.toUpperCase()} Mode</p>
			</div>
			
			<div class="grid grid-cols-2 gap-4 mb-6">
				<div class="bg-${isPlayer1Winner ? 'green' : 'red'}-900/20 rounded-lg p-4 border border-${isPlayer1Winner ? 'green' : 'red'}-500/30">
					<h3 class="text-${isPlayer1Winner ? 'green' : 'red'}-400 font-semibold mb-2">👤 You</h3>
					<div class="space-y-1">
						<p class="text-white"><span class="text-blue-400">Score:</span> ${player1Stats.score}</p>
						<p class="text-white"><span class="text-blue-400">Level:</span> ${player1Stats.level}</p>
						<p class="text-white"><span class="text-blue-400">Lines:</span> ${player1Stats.lines}</p>
					</div>
				</div>
				
				<div class="bg-${!isPlayer1Winner ? 'green' : 'red'}-900/20 rounded-lg p-4 border border-${!isPlayer1Winner ? 'green' : 'red'}-500/30">
					<h3 class="text-${!isPlayer1Winner ? 'green' : 'red'}-400 font-semibold mb-2">👥 ${matchConfig.opponent}</h3>
					<div class="space-y-1">
						<p class="text-white"><span class="text-orange-400">Score:</span> ${player2Stats.score}</p>
						<p class="text-white"><span class="text-orange-400">Level:</span> ${player2Stats.level}</p>
						<p class="text-white"><span class="text-orange-400">Lines:</span> ${player2Stats.lines}</p>
					</div>
				</div>
			</div>

			<div class="bg-gray-800 rounded-lg p-4 mb-6">
				<h3 class="text-white font-semibold mb-2">Match Result</h3>
				<p class="text-${isPlayer1Winner ? 'green' : 'red'}-400 font-bold">
					${isPlayer1Winner ? 'You won!' : `${matchConfig.opponent} won!`}
				</p>
				<p class="text-gray-400 text-sm mt-1">
					${matchConfig.mode === 'sprint' ?
			`First to reach 40 lines` :
			matchConfig.mode === 'survival' ?
				'Last player standing' :
				'Higher score wins'
		}
				</p>
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

	// Add event listeners
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

	// Auto-close after 30 seconds
	setTimeout(() => {
		if (modal.parentNode) {
			modal.remove()
			window.location.hash = '#othergames/matchmaking'
		}
	}, 30000)
}

// Function to save simultaneous match results
async function saveSimultaneousMatchResults(matchConfig: any, winner: string, player1Stats: any, player2Stats: any) {
	try {
		console.log('Saving simultaneous match results:', {
			matchConfig, winner, player1Stats, player2Stats
		})

		await tetrisMatchmakingService.submitSimultaneousResult({
			mode: matchConfig.mode,
			opponent: matchConfig.opponent,
			player1Score: player1Stats.score,
			player1Level: player1Stats.level,
			player1Lines: player1Stats.lines,
			player2Score: player2Stats.score,
			player2Level: player2Stats.level,
			player2Lines: player2Stats.lines,
			winner: winner as 'player1' | 'player2' | null
		})

		console.log('Simultaneous match results saved successfully')
	} catch (error) {
		console.error('Failed to save simultaneous match results:', error)
		// Don't show error to user as modal is more important
	}
}

// Expose function globally for testing (temporary)
; (window as any).testSimultaneousMatch = () => {
	startSimultaneousMatch({
		mode: 'sprint',
		opponent: 'TestPlayer',
		winCondition: 'First to clear 40 lines'
	})
}

	// Debug function to test the end match directly
	; (window as any).testEndMatch = () => {
		console.log('Testing end match directly...')

		// Reset match ended flag
		matchEnded = false

			// Set up mock game instances with stats
			; (window as any).simultaneousGameInstances = {
				player1: {
					getCurrentStats: () => ({ score: 1500, level: 3, lines: 25 })
				},
				player2: {
					getCurrentStats: () => ({ score: 2000, level: 4, lines: 30 })
				}
			}

		// Test with winner stats provided (like in Sprint mode)
		const winnerStats = { score: 7500, level: 4, lines: 42 }
		endSimultaneousMatch('player1', {
			mode: 'sprint',
			opponent: 'TestPlayer'
		}, winnerStats)
	}
