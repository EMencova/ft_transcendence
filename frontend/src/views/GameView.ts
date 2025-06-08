import { Features } from '../Features'
import { Gameplay } from '../Gameplay'

export function GameView(): HTMLElement {
	const main = document.getElementById('mainContent')
	if (main) {
		main.innerHTML = ''
		main.appendChild(Features())
		main.appendChild(Gameplay())
		return main
	}
	// If mainContent does not exist, create it
	else {
		const main = document.createElement('main')
		main.id = 'mainContent'
		main.className = 'flex-grow' // To push footer to the bottom
		main.appendChild(Features())
		main.appendChild(Gameplay())
		return main
	}
}