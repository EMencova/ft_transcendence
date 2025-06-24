import { GameView } from '../views/GameView'
import { LeaderboardView } from '../views/Leaderboard'
import { ProfileView } from '../views/Profile'
import { TournamentView } from '../views/Tournament'

export function setupNavLinks() {
	const tournamentLink = document.getElementById("tournamentLink")
	const leaderboardLink = document.getElementById("leaderboardLink")
	const gameLink = document.getElementById("gameLink")

	if (tournamentLink) {
		tournamentLink.addEventListener("click", (e) => {
			e.preventDefault()
			TournamentView()
		})
	}
	if (leaderboardLink) {
		leaderboardLink.addEventListener("click", (e) => {
			e.preventDefault()
			LeaderboardView()
		})
	}

	if (gameLink) {
		gameLink.addEventListener("click", (e) => {
			e.preventDefault()
			GameView()
		})
	}

	//added
	// To handle back/forward navigation
	window.addEventListener("popstate", () => {
		const path = window.location.pathname
		if (path === "/tournament") TournamentView(false)
		else if (path === "/leaderboard") LeaderboardView(false)
		else if (path === "/tournament") TournamentView(false)
		else if (path === "/profile") ProfileView(false)
		else GameView(false)
	})
}