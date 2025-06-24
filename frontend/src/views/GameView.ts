import { Features } from '../Features'
import { Gameplay } from '../Gameplay'

export function GameView(push = true): HTMLElement {
	const main = document.getElementById('mainContent')
	if (main) {
		main.innerHTML = ''
		main.appendChild(Features())
		main.appendChild(Gameplay())
		if (push) history.pushState({ page: "home" }, "", "/")
		return main
	}
	
	else {
		const main = document.createElement('main')
		main.id = 'mainContent'
		main.className = 'flex-grow' // To push footer to the bottom
		main.appendChild(Features())
		main.appendChild(Gameplay())
		return main
	}
}