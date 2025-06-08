import { currentUser } from '../logic/auth'

export function LeaderboardView(push = true) {
	const main = document.getElementById("mainContent")
	if (main) {
		if (!currentUser) {
			main.innerHTML = `<p class="text-red-500">Debes iniciar sesión para ver los torneos.</p>`
			return
		}
		main.innerHTML = `
			<h2 class="text-2xl font-bold mb-4">📊 LeaderBoard</h2>
			<p>The player leaderboard table will go here.</p>
		`
		if (push) history.pushState({ page: "leaderboard" }, "", "/leaderboard")
	}
}