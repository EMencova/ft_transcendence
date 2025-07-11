import { GameView } from '../views/GameView'
import { LeaderboardView } from '../views/Leaderboard'
import { OtherGamesView } from '../views/OtherGames'
import { ProfileView } from '../views/Profile'
import { TournamentView } from '../views/Tournament'
import { cleanupActiveGame } from './TournamentGameLogic'

export function setupNavLinks() {
	const tournamentLink = document.getElementById("tournamentLink")
	const leaderboardLink = document.getElementById("leaderboardLink")
	const otherGamesLink = document.getElementById("otherGamesLink")
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

	if (otherGamesLink) {
		otherGamesLink.addEventListener("click", (e) => {
			e.preventDefault()
			OtherGamesView()
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
	window.addEventListener("popstate", async () => {
		const path = window.location.pathname
		if (path === "/tournament") TournamentView(false)
		else if (path === "/leaderboard") LeaderboardView(false)
		else if (path === "/other-games") OtherGamesView(false)
		else if (path === "/tournament") TournamentView(false)
		else if (path === "/profile") await ProfileView(false)
		else GameView(false)
		cleanupActiveGame()
	})
}