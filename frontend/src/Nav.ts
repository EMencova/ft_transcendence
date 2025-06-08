
export function createNav(): HTMLElement {
	const nav = document.createElement("nav")
	nav.className = "flex justify-between items-center px-8 py-4 bg-zinc-900 text-white"

	// Title
	const title = document.createElement("div")
	title.innerHTML = "<strong>🏓 ft_transcendence</strong>"
	nav.appendChild(title)

	// Navigation Links
	const navLinks = document.createElement("div")
	navLinks.className = "flex items-center space-x-4"

	const currentUser = document.createElement("span")
	currentUser.id = "currentUser"
	currentUser.textContent = ""

	// Add Game, Tournament and LeaderBoard links
	const gameLink = document.createElement("a")
	gameLink.id = "gameLink"
	gameLink.href = "/"
	gameLink.textContent = "🎮 Game"
	gameLink.className = linkClass

	const tournamentLink = document.createElement("a")
	tournamentLink.id = "tournamentLink"
	tournamentLink.href = "/tournament"
	tournamentLink.textContent = "🏆 Tournament"
	tournamentLink.className = linkClass

	const leaderboardLink = document.createElement("a")
	leaderboardLink.id = "leaderboardLink"
	leaderboardLink.href = "/leaderboard"
	leaderboardLink.textContent = "📊 LeaderBoard"
	leaderboardLink.className = linkClass


	const loginBtn = document.createElement("button")
	loginBtn.id = "loginBtn"
	loginBtn.textContent = "Login"
	loginBtn.className = buttonClass

	const signupBtn = document.createElement("button")
	signupBtn.id = "signupBtn"
	signupBtn.textContent = "Signup"
	signupBtn.className = buttonClass

	const logoutBtn = document.createElement("button")
	logoutBtn.id = "logoutBtn"
	logoutBtn.textContent = "Logout"
	logoutBtn.style.display = "none"
	logoutBtn.className = buttonClass

	navLinks.appendChild(gameLink)
	navLinks.appendChild(tournamentLink)
	navLinks.appendChild(leaderboardLink)
	navLinks.appendChild(currentUser)
	navLinks.appendChild(loginBtn)
	navLinks.appendChild(signupBtn)
	navLinks.appendChild(logoutBtn)

	nav.appendChild(navLinks)
	return nav
}

const buttonClass =
	"ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded cursor-pointer"

const linkClass = "text-white hover:text-orange-500"