import { currentUser } from "../../logic/auth"

// interface MatchmakingPlayer {
// 	id: number
// 	username: string
// 	skill_level: number
// 	status: 'waiting' | 'in_game' | 'offline'
// }

interface MatchmakingQueue {
	id: number
	player_id: number
	username: string
	skill_level: number
	queue_time: string
}

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
        <div class="max-w-4xl mx-auto p-6">
            <h3 class="text-xl font-bold mb-6 text-white">⚔️ Tetris Matchmaking</h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Quick Match Section -->
                <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                        🎯 Quick Match
                    </h4>
                    <p class="text-gray-300 mb-4">Find an opponent based on your skill level</p>
                    
                    <div id="quickMatchStatus" class="mb-4">
                        <div class="flex items-center justify-between bg-zinc-700 p-3 rounded">
                            <span class="text-white">Your Skill Level:</span>
                            <span id="playerSkillLevel" class="text-orange-400 font-bold">-</span>
                        </div>
                    </div>
                    
                    <div id="matchmakingButtons" class="space-y-3">
                        <button id="findMatchBtn" class="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded font-semibold">
                            🔍 Find Match
                        </button>
                        <button id="cancelMatchBtn" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-semibold hidden">
                            ❌ Cancel Search
                        </button>
                    </div>
                    
                    <div id="matchmakingStatus" class="mt-4 text-center hidden">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <p class="text-gray-300 mt-2">Searching for opponent...</p>
                        <p id="searchTime" class="text-gray-400 text-sm">00:00</p>
                    </div>
                </div>

                <!-- Queue Status Section -->
                <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold mb-4 flex items-center">
                        👥 Current Queue
                    </h4>
                    <p class="text-gray-300 mb-4">Players currently looking for matches</p>
                    
                    <div id="queueList" class="space-y-2 max-h-60 overflow-y-auto">
                        <div class="text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            <p class="text-gray-400 mt-2 text-sm">Loading queue...</p>
                        </div>
                    </div>
                    
                    <button id="refreshQueueBtn" class="w-full mt-4 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded">
                        🔄 Refresh Queue
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
        </div>
    `

	initializeMatchmaking()
}

let searchStartTime: number | null = null
let searchInterval: number | null = null
let queueRefreshInterval: number | null = null

function initializeMatchmaking() {
	const findMatchBtn = document.getElementById('findMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const refreshQueueBtn = document.getElementById('refreshQueueBtn')

	if (findMatchBtn) {
		findMatchBtn.addEventListener('click', startMatchmaking)
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

async function startMatchmaking() {
	const findMatchBtn = document.getElementById('findMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const matchmakingStatus = document.getElementById('matchmakingStatus')

	if (!findMatchBtn || !cancelMatchBtn || !matchmakingStatus) return

	try {
		// Add player to matchmaking queue (this would be implemented in the backend)
		// For now, we'll simulate the matchmaking process

		findMatchBtn.classList.add('hidden')
		cancelMatchBtn.classList.remove('hidden')
		matchmakingStatus.classList.remove('hidden')

		searchStartTime = Date.now()
		searchInterval = window.setInterval(updateSearchTime, 1000)

		// Simulate finding a match after 5-15 seconds
		const matchTime = Math.random() * 10000 + 5000
		setTimeout(() => {
			if (searchInterval) {
				simulateMatchFound()
			}
		}, matchTime)

	} catch (error) {
		console.error('Failed to start matchmaking:', error)
		resetMatchmakingUI()
	}
}

function cancelMatchmaking() {
	resetMatchmakingUI()
	// Here you would remove the player from the matchmaking queue
}

function resetMatchmakingUI() {
	const findMatchBtn = document.getElementById('findMatchBtn')
	const cancelMatchBtn = document.getElementById('cancelMatchBtn')
	const matchmakingStatus = document.getElementById('matchmakingStatus')

	if (findMatchBtn) findMatchBtn.classList.remove('hidden')
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

function simulateMatchFound() {
	resetMatchmakingUI()

	// Show match found notification
	const container = document.querySelector('.max-w-4xl')
	if (container) {
		const notification = document.createElement('div')
		notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded shadow-lg z-50'
		notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-xl">🎉</span>
                <div>
                    <p class="font-semibold">Match Found!</p>
                    <p class="text-sm">Redirecting to game...</p>
                </div>
            </div>
        `
		document.body.appendChild(notification)

		setTimeout(() => {
			notification.remove()
			// Here you would redirect to the actual game
			alert('Match found! In a real implementation, this would start the game.')
		}, 3000)
	}
}

async function loadPlayerSkillLevel() {
	const skillLevelEl = document.getElementById('playerSkillLevel')
	if (!skillLevelEl) return

	try {
		// In a real implementation, this would fetch from the backend
		// For now, we'll simulate a skill level based on game history
		const skillLevel = Math.floor(Math.random() * 1000) + 100 // Random skill level between 100-1100
		skillLevelEl.textContent = skillLevel.toString()
	} catch (error) {
		console.error('Failed to load skill level:', error)
		skillLevelEl.textContent = 'Unknown'
	}
}

async function loadQueue() {
	const queueList = document.getElementById('queueList')
	if (!queueList) return

	try {
		// Simulate queue data (in real implementation, fetch from backend)
		const mockQueue: MatchmakingQueue[] = [
			{ id: 1, player_id: 2, username: 'Player123', skill_level: 850, queue_time: new Date(Date.now() - 30000).toISOString() },
			{ id: 2, player_id: 3, username: 'TetrisMaster', skill_level: 920, queue_time: new Date(Date.now() - 45000).toISOString() },
			{ id: 3, player_id: 4, username: 'BlockBuster', skill_level: 750, queue_time: new Date(Date.now() - 15000).toISOString() },
		]

		if (mockQueue.length === 0) {
			queueList.innerHTML = `
                <div class="text-center py-4 text-gray-400">
                    <p>No players in queue</p>
                    <p class="text-sm mt-1">Be the first to search for a match!</p>
                </div>
            `
			return
		}

		queueList.innerHTML = mockQueue.map(player => {
			const waitTime = Math.floor((Date.now() - new Date(player.queue_time).getTime()) / 1000)
			const waitMinutes = Math.floor(waitTime / 60)
			const waitSeconds = waitTime % 60

			return `
                <div class="flex justify-between items-center p-3 bg-zinc-700 rounded">
                    <div>
                        <p class="text-white font-medium">${player.username}</p>
                        <p class="text-gray-400 text-sm">Skill: ${player.skill_level}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-orange-400 text-sm">Waiting</p>
                        <p class="text-gray-400 text-xs">${waitMinutes}:${waitSeconds.toString().padStart(2, '0')}</p>
                    </div>
                </div>
            `
		}).join('')

	} catch (error) {
		console.error('Failed to load queue:', error)
		queueList.innerHTML = `
            <div class="text-center py-4 text-red-400">
                <p>Failed to load queue</p>
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
