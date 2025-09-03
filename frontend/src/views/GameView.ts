import { Features } from '../Features'
import { Gameplay } from '../Gameplay'

export function GameView(push = true): HTMLElement | void {
	const main = document.getElementById('mainContent')
	if (!main) return

	// Clear existing content
	main.innerHTML = ''

	// Add game content
	main.appendChild(Features())
	main.appendChild(Gameplay())

	// Update URL if needed
	if (push) history.pushState({ page: "home" }, "", "/")

	return main
}