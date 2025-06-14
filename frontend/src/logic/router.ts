import { GameView } from '../views/GameView'
import { LeaderboardView } from '../views/Leaderboard'
import { TournamentView } from '../views/Tournament'
import { createProfilePage } from "../Profile";

export function setupNavLinks() {
	const tournamentLink = document.getElementById("tournamentLink")
	const leaderboardLink = document.getElementById("leaderboardLink")
	const gameLink = document.getElementById("gameLink")
	const profileLink = document.getElementById("profileLink")

	if (profileLink) {
		profileLink.addEventListener("click", (e) => {
			e.preventDefault();
			renderView(createProfilePage());
			window.history.pushState(null, '', '/profile');
		});
	}

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

	// To handle back/forward navigation
	window.addEventListener("popstate", () => {
		const path = window.location.pathname
		if (path === "/tournament") TournamentView(false)
		else if (path === "/leaderboard") LeaderboardView(false)
		else if (path === "/profile") createProfilePage()
		else GameView(false)
	})
}

const appContainer = document.getElementById('app')!;

export function renderView(view: HTMLElement) {
    appContainer.innerHTML = '';
    appContainer.appendChild(view);
}