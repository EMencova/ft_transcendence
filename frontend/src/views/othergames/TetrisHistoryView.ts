import { currentUser, currentUserId } from "../../logic/auth"
import { apiService } from "../../services/apiService"

interface TetrisHistoryEntry {
	id: number
	score: number
	game_date: string
}

export function TetrisHistoryView(container: HTMLElement) {
	if (!currentUser) {
		container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400 text-lg">🔒 Please log in to view your game history</p>
                <p class="text-gray-500 text-sm mt-2">Your Tetris scores and statistics will be saved when you're logged in.</p>
            </div>
        `
		return
	}

	container.innerHTML = `
        <div class="max-w-4xl mx-auto p-6">
            <h3 class="text-xl font-bold mb-6 text-white">📊 Your Tetris History</h3>
            
            <div id="historyStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold">Games Played</h4>
                    <p id="totalGames" class="text-2xl font-bold text-white">-</p>
                </div>
                <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold">Best Score</h4>
                    <p id="bestScore" class="text-2xl font-bold text-white">-</p>
                </div>
                <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md border border-gray-700">
                    <h4 class="text-orange-400 font-semibold">Average Score</h4>
                    <p id="avgScore" class="text-2xl font-bold text-white">-</p>
                </div>
            </div>

            <div class="bg-[#1a1a1a] rounded-lg p-6 shadow-md border border-gray-700">
                <h4 class="text-white font-semibold mb-4">Recent Games</h4>
                <div id="historyList" class="space-y-2">
                    <div class="text-center py-4">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <p class="text-gray-400 mt-2">Loading your game history...</p>
                    </div>
                </div>
                <button id="loadMoreBtn" class="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded hidden">
                    Load More Games
                </button>
            </div>
        </div>
    `

	loadTetrisHistory()
}

async function loadTetrisHistory() {
	try {
		if (!currentUserId) {
			throw new Error("User not logged in")
		}

		const response = await apiService.get<{ history: TetrisHistoryEntry[] }>(`/tetris/history/${currentUserId}`)
		const history = response.history || []

		displayHistoryStats(history)
		displayHistoryList(history)
	} catch (error) {
		console.error('Failed to load Tetris history:', error)
		const historyList = document.getElementById('historyList')
		if (historyList) {
			historyList.innerHTML = `
                <div class="text-center py-4 text-red-400">
                    <p>❌ Failed to load game history</p>
                    <p class="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
                </div>
            `
		}
	}
}

function displayHistoryStats(history: TetrisHistoryEntry[]) {
	const totalGamesEl = document.getElementById('totalGames')
	const bestScoreEl = document.getElementById('bestScore')
	const avgScoreEl = document.getElementById('avgScore')

	if (!totalGamesEl || !bestScoreEl || !avgScoreEl) return

	const totalGames = history.length
	const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0
	const avgScore = history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) : 0

	totalGamesEl.textContent = totalGames.toString()
	bestScoreEl.textContent = bestScore.toString()
	avgScoreEl.textContent = avgScore.toString()
}

function displayHistoryList(history: TetrisHistoryEntry[]) {
	const historyList = document.getElementById('historyList')
	if (!historyList) return

	if (history.length === 0) {
		historyList.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-lg">🎮 No games played yet</p>
                <p class="text-sm mt-2">Start playing Tetris to build your history!</p>
            </div>
        `
		return
	}

	historyList.innerHTML = history.map((entry, index) => {
		const date = new Date(entry.game_date).toLocaleString()
		const isNewRecord = entry.score === Math.max(...history.map(h => h.score))

		return `
            <div class="flex justify-between items-center p-3 bg-zinc-700 rounded hover:bg-zinc-600 transition-colors ${isNewRecord ? 'border-l-4 border-orange-500' : ''}">
                <div class="flex items-center space-x-3">
                    <span class="text-gray-400 text-sm w-8">#${index + 1}</span>
                    <div>
                        <p class="text-white font-medium">Score: ${entry.score.toLocaleString()}</p>
                        <p class="text-gray-400 text-sm">${date}</p>
                    </div>
                </div>
                ${isNewRecord ? '<span class="text-orange-400 text-sm font-semibold">🏆 Best</span>' : ''}
            </div>
        `
	}).join('')
}

// Function to save a new Tetris score (to be called from TetrisView)
export async function saveTetrisScore(score: number): Promise<boolean> {
	try {
		if (!currentUserId) {
			console.warn('Cannot save score: user not logged in')
			return false
		}

		await apiService.post('/tetris/history', {
			player_id: currentUserId,
			score: score
		})

		return true
	} catch (error) {
		console.error('Failed to save Tetris score:', error)
		return false
	}
}
