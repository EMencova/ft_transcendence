import { TetrisView } from '../othergames/Tetris'

const games = [
	{ id: "tetris", nameKey: "othergames_tetris" },
	{ id: "arcanoid", nameKey: "othergames_arcanoid", contentKey: "othergames_arcanoid_placeholder" },
]

export function OtherGamesView(push = true) {
	const main = document.getElementById("mainContent")
	if (!main) return

	let tabs = games.map(
		(game, idx) =>
			`<button class="tab-btn px-4 py-2 ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-gray-300'} rounded" data-game="${game.id}" data-translate="${game.nameKey}"></button>`
	).join(" ")

	tabs += `<button id="backToPongBtn" class="px-4 py-2 bg-zinc-700 text-white rounded ml-4 hover:bg-orange-600" data-translate="othergames_back_btn"></button>`

	main.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 mt-6" data-translate="othergames_title"></h2>
        <div class="ml-6 mb-4 flex gap-2">${tabs}</div>
        <div id="gameContent"></div>
    `

	const tabButtons = main.querySelectorAll<HTMLButtonElement>('.tab-btn')
	const gameContent = main.querySelector<HTMLDivElement>('#gameContent')
	const backBtn = main.querySelector<HTMLButtonElement>('#backToPongBtn')

	// Show Tetris by default
	if (gameContent) TetrisView(false, gameContent)

	tabButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			tabButtons.forEach(b => b.className = b.className.replace('bg-orange-500 text-white', 'bg-zinc-800 text-gray-300'))
			btn.className = btn.className.replace('bg-zinc-800 text-gray-300', 'bg-orange-500 text-white')
			if (btn.dataset.game === "tetris") {
				if (gameContent) TetrisView(false, gameContent)
			} else if (btn.dataset.game === "arcanoid") {
				if (gameContent) gameContent.innerHTML = `<p data-translate="othergames_arcanoid_placeholder"></p>`
			}
		})
	})

	if (backBtn) {
		backBtn.addEventListener('click', () => {
			window.location.href = "/"
		})
	}

	if (push) history.pushState({ page: "otherGames" }, "", "/other-games")
}

