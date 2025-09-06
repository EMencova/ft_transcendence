import { currentUser, currentUserId } from "../../logic/auth"
import { apiService } from "../../services/apiService"

interface TetrisHistoryEntry {
	id: number
	score: number
	level: number
	lines_cleared: number
	game_date: string
}export function TetrisHistoryView(container: HTMLElement) {
	if (!currentUser) {
		container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400 text-lg" data-translate="please_log_in">🔒 Please log in to view your game history</p>
                <p class="text-gray-500 text-sm mt-2" data-translate="login_to_save_history">Your Tetris scores and statistics will be saved when you're logged in.</p>
            </div>
        `
		return
	}

	container.innerHTML = `
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-white text-center mb-8" data-translate="tetris_history_title">Tetris History</h1>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 text-center">
                    <h3 class="text-sm font-medium text-gray-400 mb-2" data-translate="total_games">Total Games</h3>
                    <p id="totalGames" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 text-center">
                    <h3 class="text-sm font-medium text-gray-400 mb-2" data-translate="best_score">Best Score</h3>
                    <p id="bestScore" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 text-center">
                    <h3 class="text-sm font-medium text-gray-400 mb-2" data-translate="best_level">Best Level</h3>
                    <p id="bestLevel" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 text-center">
                    <h3 class="text-sm font-medium text-gray-400 mb-2" data-translate="total_lines">Total Lines</h3>
                    <p id="totalLines" class="text-2xl font-bold text-white">0</p>
                </div>
            </div>

            <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <h2 class="text-xl font-bold text-white mb-4" data-translate="recent_games">Recent Games</h2>
                <div id="historyList" class="space-y-3">
                    <p class="text-gray-400 text-center py-8" data-translate="loading_history">Loading history...</p>
                </div>
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
                    <p data-translate="history_load_failed">❌ Failed to load game history</p>
                    <p class="text-sm text-gray-500 mt-1" data-translate="try_refresh">Please try refreshing the page</p>
                </div>
            `
		}
	}
}

function displayHistoryStats(history: TetrisHistoryEntry[]) {
	const totalGamesEl = document.getElementById('totalGames')
	const bestScoreEl = document.getElementById('bestScore')
	const bestLevelEl = document.getElementById('bestLevel')
	const totalLinesEl = document.getElementById('totalLines')

	if (!totalGamesEl || !bestScoreEl || !bestLevelEl || !totalLinesEl) return

	const totalGames = history.length
	const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0
	const bestLevel = history.length > 0 ? Math.max(...history.map(h => h.level || 1)) : 0
	const totalLines = history.length > 0 ? history.reduce((sum, h) => sum + (h.lines_cleared || 0), 0) : 0

	totalGamesEl.textContent = totalGames.toString()
	bestScoreEl.textContent = bestScore.toString()
	bestLevelEl.textContent = bestLevel.toString()
	totalLinesEl.textContent = totalLines.toString()
} function displayHistoryList(history: TetrisHistoryEntry[]) {
	const historyList = document.getElementById('historyList')
	if (!historyList) return

	if (history.length === 0) {
		historyList.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-lg" data-translate="no_games_yet">🎮 No games played yet</p>
                <p class="text-sm mt-2" data-translate="start_playing">Start playing Tetris to build your history!</p>
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
                        <div class="flex space-x-4 text-gray-400 text-sm">
                            <span>Level: ${entry.level || 1}</span>
                            <span>Lines: ${entry.lines_cleared || 0}</span>
                        </div>
                        <p class="text-gray-400 text-sm">${date}</p>
                    </div>
                </div>
                ${isNewRecord ? '<span class="text-orange-400 text-sm font-semibold" data-translate="best_label">🏆 Best</span>' : ''}
            </div>
        `
	}).join('')
}

// Function to save a new Tetris score (to be called from TetrisView)
export async function saveTetrisScore(score: number, level: number, linesCleared: number): Promise<boolean> {
	try {
		if (!currentUserId) {
			console.warn('Cannot save score: user not logged in')
			return false
		}

		await apiService.post('/tetris/history', {
			player_id: currentUserId,
			score: score,
			level: level,
			lines_cleared: linesCleared
		})

		return true
	} catch (error) {
		console.error('Failed to save Tetris score:', error)
		return false
	}
}
