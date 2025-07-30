import { currentUser } from "../../logic/auth"
import { initTetrisGame } from "../../logic/tetrisGame"

export function TetrisView(push = true, container?: HTMLElement) {
    const target = container || document.getElementById("mainContent")
    if (!target) return

    const recordHtml = currentUser
        ? `<span id="tetrisRecord" class="text-white mt-4">Record: 0</span>`
        : `<span id="tetrisRecord" class="text-white mt-4 text-sm italic">If you want to save your record, please log in.</span>`

    target.innerHTML = `
       <div id="tetrisGame" class="border border-gray-500 p-4 flex flex-col items-center mx-auto max-w-4xl">
            <button id="startTetrisBtn" class="mb-6 w-48 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-lg">Start Game</button>
            <div class="flex justify-center w-full">
                <canvas id="tetrisCanvas" class="border border-gray-700 bg-gray-900"></canvas>
                <div id="tetrisScoreboard" class="flex flex-col items-start ml-4">
                    <span id="tetrisScore" class="text-white mt-4">Score: 0</span>
                    <span id="tetrisLevel" class="text-orange-400 mt-2 font-semibold">Level: 1</span>
                    ${recordHtml}
                    <div class="flex justify-center text-center space-x-4 mt-4">
                        <button id="pauseBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled>Pause</button>
                        <button id="resetBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled>Reset</button>
                    </div>
                    <div class="mt-4 text-xs text-gray-400">
                        <p class="font-semibold mb-1">Controls:</p>
                        <p>← → Move • ↓ Soft Drop • ↑ Rotate</p>
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
            recordEl.textContent = `Record: ${bestScore}`
        }
    } catch (error) {
        console.error('Failed to load user record:', error)
    }
}