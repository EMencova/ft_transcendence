import { updateText } from '../../public/js/translation'
import { GameView } from '../views/GameView'
import { LeaderboardView } from '../views/Leaderboard'
import { OtherGamesView } from '../views/OtherGames'
import { ProfileView } from '../views/Profile'
import { TournamentView } from '../views/Tournament'
import { cleanupActiveGame } from './TournamentGameLogic'

// Flag to prevent multiple popstate listeners
let popstateListenerAdded = false

// Helper function to apply translations after view change
function applyTranslationsAfterNavigation() {
	// Use setTimeout to ensure DOM is updated before applying translations
	setTimeout(() => {
		updateText()
	}, 10)
}

export function setupNavLinks() {
	const tournamentLink = document.getElementById("tournamentLink")
	const leaderboardLink = document.getElementById("leaderboardLink")
	const otherGamesLink = document.getElementById("otherGamesLink")
	const gameLink = document.getElementById("gameLink")

	if (tournamentLink) {
		tournamentLink.addEventListener("click", (e) => {
			e.preventDefault()
			TournamentView()
			applyTranslationsAfterNavigation()
		})
	}
	if (leaderboardLink) {
		leaderboardLink.addEventListener("click", (e) => {
			e.preventDefault()
			LeaderboardView()
			applyTranslationsAfterNavigation()
		})
	}

	if (otherGamesLink) {
		otherGamesLink.addEventListener("click", (e) => {
			e.preventDefault()
			OtherGamesView()
			applyTranslationsAfterNavigation()
		})
	}

	if (gameLink) {
		gameLink.addEventListener("click", (e) => {
			e.preventDefault()
			GameView()
			applyTranslationsAfterNavigation()
		})
	}

	// To handle back/forward navigation - only add once
	if (!popstateListenerAdded) {
		window.addEventListener("popstate", async () => {
			const path = window.location.pathname
			if (path === "/tournament") TournamentView(false)
			else if (path === "/leaderboard") LeaderboardView(false)
			else if (path === "/other-games") OtherGamesView(false)
			else if (path === "/profile") await ProfileView(false)
			else GameView(false)
			cleanupActiveGame()
			applyTranslationsAfterNavigation()
		})
		popstateListenerAdded = true
	}
}