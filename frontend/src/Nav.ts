export function createNav(): HTMLElement {
	const nav = document.createElement("nav")
	nav.className = "flex justify-between items-center px-8 py-4 bg-zinc-900 text-white border-b border-gray-700"

	// Title
	const title = document.createElement("div")
	const titleStrong = document.createElement("strong")
	titleStrong.setAttribute("data-translate", "app_title")
	titleStrong.textContent = "🏓 ft_transcendence"
	title.appendChild(titleStrong)
	nav.appendChild(title)

	// Navigation Links
	const navLinks = document.createElement("div")
	navLinks.className = "flex items-center space-x-4"

	const currentUser = document.createElement("span")
	currentUser.id = "currentUser"
	currentUser.textContent = ""

	const gameLink = document.createElement("a")
	gameLink.id = "gameLink"
	gameLink.href = "/"
	gameLink.setAttribute("data-translate", "nav_game")
	gameLink.textContent = "🎮 Game"
	gameLink.className = linkClass

	const otherGamesLink = document.createElement("a")
	otherGamesLink.id = "otherGamesLink"
	otherGamesLink.href = "/other-games"
	otherGamesLink.setAttribute("data-translate", "nav_other_games")
	otherGamesLink.textContent = "🕹️ Other Games"
	otherGamesLink.className = linkClass

	const tournamentLink = document.createElement("a")
	tournamentLink.id = "tournamentLink"
	tournamentLink.href = "/tournament"
	tournamentLink.setAttribute("data-translate", "nav_tournament")
	tournamentLink.textContent = "🏆 Tournament"
	tournamentLink.className = linkClass

	const leaderboardLink = document.createElement("a")
	leaderboardLink.id = "leaderboardLink"
	leaderboardLink.href = "/leaderboard"
	leaderboardLink.setAttribute("data-translate", "nav_leaderboard")
	leaderboardLink.textContent = "📊 LeaderBoard"
	leaderboardLink.className = linkClass

	const loginBtn = document.createElement("button")
	loginBtn.id = "loginBtn"
	loginBtn.setAttribute("data-translate", "nav_login")
	loginBtn.textContent = "Login"
	loginBtn.className = buttonClass

	const signupBtn = document.createElement("button")
	signupBtn.id = "signupBtn"
	signupBtn.setAttribute("data-translate", "nav_signup")
	signupBtn.textContent = "Signup"
	signupBtn.className = buttonClass

	const logoutBtn = document.createElement("button")
	logoutBtn.id = "logoutBtn"
	logoutBtn.setAttribute("data-translate", "nav_logout")
	logoutBtn.textContent = "Logout"
	logoutBtn.style.display = "none"
	logoutBtn.className = buttonClass

	// Language Flags
	const langFlags = document.createElement("div")
	langFlags.id = "langFlags"
	langFlags.className = "flex gap-2 mr-2"

	const flagData = [
		{ src: "https://flagcdn.com/24x18/gb.png", lang: "en", alt: "English" },
		{ src: "https://flagcdn.com/24x18/es.png", lang: "es", alt: "Español" },
		{ src: "https://flagcdn.com/24x18/cz.png", lang: "cz", alt: "Česky" },
	]

	flagData.forEach((f, i) => {
		const img = document.createElement("img")
		img.src = f.src
		img.alt = f.alt
		img.setAttribute("data-lang", f.lang)
		img.className = `lang-flag cursor-pointer rounded-sm ${i === 0 ? "border-2 border-white active" : ""}`
		langFlags.appendChild(img)
	})

	langFlags.addEventListener("click", (e) => {
		const target = e.target as HTMLElement
		if (target.classList.contains("lang-flag")) {
			langFlags.querySelectorAll(".lang-flag").forEach(flag => {
				flag.classList.remove("border-2", "border-white", "active")
			})
			target.classList.add("border-2", "border-white", "active")
		}
	})

	// Append links
	navLinks.appendChild(gameLink)
	navLinks.appendChild(otherGamesLink)
	navLinks.appendChild(tournamentLink)
	navLinks.appendChild(leaderboardLink)
	navLinks.appendChild(currentUser)
	navLinks.appendChild(loginBtn)
	navLinks.appendChild(signupBtn)
	navLinks.appendChild(logoutBtn)
	navLinks.appendChild(langFlags)

	nav.appendChild(navLinks)
	return nav
}

const buttonClass =
	"ml-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded cursor-pointer"

const linkClass = "text-white hover:text-orange-500"

