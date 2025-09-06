import { currentUser } from "../../logic/auth"
import { initTetrisGame } from "../../logic/tetrisGame"

export function TetrisView(push = true, container?: HTMLElement) {
    const target = container || document.getElementById("mainContent")
    if (!target) return

    target.innerHTML = `
        <div class="min-h-screen p-4">
            <!-- Game Area -->
            <div class="max-w-4xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-6 border border-orange-500">
                    <div class="text-center">
                        <h3 class="text-xl font-bold text-orange-400 mb-4" data-translate="tetris_title">🎮 Tetris Game</h3>
                        <div class="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
                            <div class="bg-gray-800 p-3 rounded">
                                <p class="text-gray-300 text-sm" data-translate="score_label">Score</p>
                                <p id="tetrisScore" class="text-white font-bold text-xl">0</p>
                            </div>
                            <div class="bg-gray-800 p-3 rounded">
                                <p class="text-gray-300 text-sm" data-translate="level_label">Level</p>
                                <p id="tetrisLevel" class="text-orange-400 font-bold text-xl">1</p>
                            </div>
                            <div class="bg-gray-800 p-3 rounded">
                                <p class="text-gray-300 text-sm" data-translate="lines_label">Lines</p>
                                <p id="tetrisLines" class="text-green-400 font-bold text-xl">0</p>
                            </div>
                            <div class="bg-gray-800 p-3 rounded">
                                <p class="text-gray-300 text-sm" data-translate="record_label">Record</p>
                                <p id="tetrisRecord" class="text-blue-400 font-bold text-xl">${currentUser ? '0' : 'Login'}</p>
                            </div>
                        </div>
                        <button id="startTetrisBtn" class="mb-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold text-lg" data-translate="start_game_button">
                            🚀 Start Game
                        </button>
                    </div>
                    <div class="flex justify-center mb-6">
                        <canvas id="tetrisCanvas" class="border border-gray-500 bg-black focus:outline-none focus:border-orange-500" 
                                tabindex="0" style="outline: none;">
                        </canvas>
                    </div>
                    <div class="flex justify-center text-center space-x-4 mb-4">
                        <button id="pauseBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled data-translate="pause_button">Pause</button>
                        <button id="resetBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled data-translate="reset_button">Reset</button>
                    </div>
                </div>
            </div>

            <!-- Game Instructions -->
            <div class="max-w-4xl mx-auto mt-6 bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 text-center">
                <p class="text-white font-semibold mb-2" data-translate="how_to_play_title">🎮 How to Play Tetris</p>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                        <p class="text-orange-400 font-semibold" data-translate="controls_label">Controls:</p>
                        <p data-translate="control_left_right">🟠 ←/→: Move Left/Right</p>
                        <p data-translate="control_rotate">🟠 ↑: Rotate</p>
                        <p data-translate="control_soft_drop">🟠 ↓: Soft Drop</p>
                        <p data-translate="control_hard_drop">🟠 Space: Hard Drop</p>
                    </div>
                    <div>
                        <p class="text-green-400 font-semibold" data-translate="objective_label">Objective:</p>
                        <p data-translate="objective_clear_lines">🏆 Clear lines to score points</p>
                        <p data-translate="objective_level_up">📊 Level increases every 10 lines</p>
                        <p data-translate="objective_speed">⚡ Speed increases with level</p>
                        ${currentUser ? '<p class="text-blue-400 mt-2" data-translate="best_score_saved">💾 Your best score is saved!</p>' : '<p class="text-yellow-400 mt-2" data-translate="login_to_save">🔒 Login to save your record!</p>'}
                    </div>
                </div>
            </div>
        </div>
    `
    initTetrisGame()
    loadUserRecord()
    if (push && !container) history.pushState({ page: "tetris" }, "", "/tetris")
}

async function loadUserRecord() {
    const recordEl = document.getElementById("tetrisRecord")
    if (!recordEl || !currentUser) return

    try {
        // Import the API service to fetch user's best score
        const { apiService } = await import("../../services/apiService")
        const { currentUserId } = await import("../../logic/auth")

        if (!currentUserId) return

        const response = await apiService.get<{ history: any[] }>(`/tetris/history/${currentUserId}`)
        const history = response.history || []

        if (history.length > 0) {
            const bestScore = Math.max(...history.map((h: any) => h.score))
            recordEl.textContent = bestScore.toString()
        }
    } catch (error) {
        console.error('Failed to load user record:', error)
    }
}