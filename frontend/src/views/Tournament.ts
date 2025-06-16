import { currentUser } from '../logic/auth'

export function TournamentView(push = true) {
	const main = document.getElementById("mainContent")
	if (main) {
		if (!currentUser) {
			main.innerHTML = `<p class="text-red-500">You must be logged in to view tournaments.</p>`
			return
		}
		main.innerHTML = `
			<h2 class="text-2xl font-bold mb-4" data-translate="tournament_title">🏆 Tournament</h2>
<p data-translate="tournament_desc">The tournament logic and list will go here.</p>
		`
		if (push) history.pushState({ page: "tournament" }, "", "/tournament")
	}
}