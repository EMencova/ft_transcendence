import { updateText } from '../../public/js/translation'
import { GameView } from './GameView.ts'
import { TetrisHistoryView } from './othergames/TetrisHistoryView.ts'
import { TetrisMatchmakingView } from './othergames/TetrisMatchmakingView.ts'
import { TetrisView } from './othergames/TetrisView'

const tabs = [
	{ id: "play", key: "play_tab" },
	{ id: "history", key: "history_tab" },
	{ id: "matchmaking", key: "matchmaking_tab" },
]

export function OtherGamesView(push = true) {
	const main = document.getElementById("mainContent")
	if (!main) return

	if (push) {
		window.history.pushState({ page: "other-games" }, "", "/other-games")
	}

	// Generate tab buttons with data-translate attributes
	let tabButtons = tabs.map(
		(tab, idx) =>
			`<button 
				class="tab-btn px-4 py-2 ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-gray-300'} rounded" 
				data-tab="${tab.id}" 
				data-translate="${tab.key}">
			</button>`
	).join("")

	// Back to Pong button with data-translate
	tabButtons += `
		<button 
			id="backToPongBtn" 
			class="px-4 py-2 bg-zinc-700 text-white rounded ml-4 hover:bg-orange-600" 
			data-translate="back_to_pong">
		</button>
	`

	main.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 mt-6" data-translate="tetris_heading"></h2>
        <div class="ml-6 mb-4 flex gap-2">${tabButtons}</div>
        <div id="gameContent"></div>
    `

	// Immediately update translations
	updateText()

	const tabButtonElements = main.querySelectorAll<HTMLButtonElement>('.tab-btn')
	const gameContent = main.querySelector<HTMLDivElement>('#gameContent')
	const backBtn = main.querySelector<HTMLButtonElement>('#backToPongBtn')

	// Show Play tab by default
	if (gameContent) TetrisView(false, gameContent)

	tabButtonElements.forEach(btn => {
		btn.addEventListener('click', () => {
			tabButtonElements.forEach(b => b.className = b.className.replace('bg-orange-500 text-white', 'bg-zinc-800 text-gray-300'))
			btn.className = btn.className.replace('bg-zinc-800 text-gray-300', 'bg-orange-500 text-white')

			const tabId = btn.dataset.tab
			if (gameContent) {
				switch (tabId) {
					case "play":
						TetrisView(false, gameContent)
						break
					case "history":
						TetrisHistoryView(gameContent)
						break
					case "matchmaking":
						TetrisMatchmakingView(gameContent)
						break
				}
			}
		})
	})

	// Back to Pong button event
	if (backBtn) {
		backBtn.addEventListener('click', (e) => {
			e.preventDefault()
			GameView()
			setTimeout(() => {
				updateText()
			}, 10)
		})
	}
}

