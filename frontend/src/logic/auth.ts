import { updateText } from '../../public/js/translation'
import { createPasswordInput } from "../PasswordInput"
import { GameView } from '../views/GameView'
import { OtherGamesView } from '../views/OtherGames'
import { ProfileView } from '../views/Profile'
import { setupNavLinks } from "./router"

export let currentUser: string | null = localStorage.getItem("currentUser")
export let currentUserId: number | null = (() => {
	const id = localStorage.getItem("currentUserId")
	return id ? parseInt(id) : null
})()
export let currentAvatar: string | null = localStorage.getItem("currentAvatar")

// Function to update currentUserId (needed for proper module exports)
export function setCurrentUserId(id: number | null) {
	currentUserId = id
}

// Function to update current user information
export function updateCurrentUser(username: string) {
	currentUser = username
	localStorage.setItem("currentUser", username)
	updateNav() // Refresh the navigation to show the new username
}

// Function to update current user avatar
export function updateCurrentAvatar(avatarUrl: string) {
	currentAvatar = avatarUrl
	localStorage.setItem("currentAvatar", avatarUrl)
	updateNav() // Refresh the navigation to show the new avatar
}

export function initializeAuth() {
	const loginBtn = document.getElementById("loginBtn")!
	const signupBtn = document.getElementById("signupBtn")!
	const logoutBtn = document.getElementById("logoutBtn")!

	loginBtn.addEventListener("click", () => showAuthForm("login"))
	signupBtn.addEventListener("click", () => showAuthForm("signup"))
	logoutBtn.addEventListener("click", () => {
		currentUser = null
		setCurrentUserId(null)
		currentAvatar = null
		localStorage.removeItem("currentUser")
		localStorage.removeItem("currentUserId")
		localStorage.removeItem("currentAvatar")
		updateNav()
		GameView(true)
	})

	updateNav()
	setupNavLinks()
}

function updateNav() {
	const userDisplay = document.getElementById("currentUser")!
	const loginBtn = document.getElementById("loginBtn")!
	const signupBtn = document.getElementById("signupBtn")!
	const logoutBtn = document.getElementById("logoutBtn")!
	const tournamentLink = document.getElementById("tournamentLink")!
	const leaderboardLink = document.getElementById("leaderboardLink")!
	const gameLink = document.getElementById("gameLink")!

	userDisplay.innerHTML = ""
	gameLink.style.display = "inline-block"

	if (currentUser) {
		tournamentLink.classList.remove("pointer-events-none", "opacity-50")
		leaderboardLink.classList.remove("pointer-events-none", "opacity-50")
		loginBtn.style.display = "none"
		signupBtn.style.display = "none"
		logoutBtn.style.display = "none"

		const welcomeSpan = document.createElement("span")
		welcomeSpan.textContent = `👋 Welcome, ${currentUser}`
		welcomeSpan.className = "mr-4"

		const avatarImg = document.createElement("img")
		avatarImg.src = currentAvatar || "/avatar.png"
		avatarImg.alt = "Avatar"
		avatarImg.className = "w-10 h-10 rounded-full cursor-pointer border object-cover"

		const menu = document.createElement("div")
		menu.className = "absolute right-0 mt-4 bg-zinc-900 border border-orange-500 rounded shadow-2xl hidden text-white z-50 min-w-48"
		menu.innerHTML = `
			<a href="#" id="profileLink" class="px-4 py-2 hover:bg-gray-700 flex items-center">
			<span class="mr-2">👤</span> Profile
			</a>
			<hr class="my-1 border-gray-600">
			<button id="dropdownLogout" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center">
				<span class="mr-2">🚪</span> Logout
			</button>
		`

		const container = document.createElement("div")
		container.className = "relative inline-block"
		container.appendChild(avatarImg)
		container.appendChild(menu)

		userDisplay.appendChild(welcomeSpan)
		userDisplay.appendChild(container)
		userDisplay.className = "flex items-center justify-center"

		avatarImg.addEventListener("click", () => {
			menu.classList.toggle("hidden")
		})

		document.addEventListener("click", (e) => {
			if (!container.contains(e.target as Node)) {
				menu.classList.add("hidden")
			}
		})

		// Logout inside the dropdown menu
		const logoutBtnInMenu = menu.querySelector("#dropdownLogout")
		if (logoutBtnInMenu) {
			logoutBtnInMenu.addEventListener("click", () => {
				currentUser = null
				setCurrentUserId(null)
				currentAvatar = null
				localStorage.removeItem("currentUser")
				localStorage.removeItem("currentUserId")
				localStorage.removeItem("currentAvatar")
				updateNav()
				GameView(true)
			})
		}

		const profileLink = menu.querySelector("#profileLink")
		if (profileLink) {
			profileLink.addEventListener("click", async (e) => {
				e.preventDefault()
				await ProfileView()
				menu.classList.add("hidden")
				// Apply translations after navigation
				setTimeout(() => {
					updateText()
				}, 10)
			})
		}

	} else {
		userDisplay.textContent = ""
		loginBtn.style.display = "inline-block"
		signupBtn.style.display = "inline-block"
		logoutBtn.style.display = "none"

		// Disable tournament and leaderboard links
		tournamentLink.classList.add("pointer-events-none", "opacity-50")
		leaderboardLink.classList.add("pointer-events-none", "opacity-50")
	}
}

function showAuthForm(mode: "login" | "signup") {
	const modal = document.createElement("div")
	modal.className = "fixed inset-0 bg-[#242424] flex justify-center items-center z-50"

	const formBox = document.createElement("div")
	formBox.className = "bg-[#141414] rounded-lg p-6 max-w-sm w-full shadow-lg text-white border border-gray-700"

	const isSignup = mode === "signup"

	const title = document.createElement("h2")
	title.className = "text-xl font-bold mb-4 text-white"
	title.textContent = isSignup ? "Signup" : "Login"

	const form = document.createElement("form")
	form.id = "authForm"
	form.className = "space-y-4"

	const usernameInput = document.createElement("input")
	usernameInput.id = "authUsername"
	usernameInput.className = inputClassName
	usernameInput.placeholder = "Username"
	usernameInput.type = "text"
	form.appendChild(usernameInput)

	if (isSignup) {
		const emailInput = document.createElement("input")
		emailInput.id = "authEmail"
		emailInput.className = inputClassName
		emailInput.placeholder = "Email"
		emailInput.type = "email"
		form.appendChild(emailInput)
		// avatar
		const avatarInput = document.createElement("input")
		avatarInput.id = "authAvatar"
		avatarInput.className = inputClassName
		avatarInput.type = "file"
		avatarInput.accept = "image/*"
		form.appendChild(avatarInput)
	}

	form.appendChild(createPasswordInput("authPassword", "Password"))

	if (isSignup) {
		const confirmInput = createPasswordInput("authConfirm", "Repeat Password")
		form.appendChild(confirmInput)
	}

	const errorText = document.createElement("p")
	errorText.id = "authError"
	errorText.className = "text-red-400 text-sm hidden"
	form.appendChild(errorText)

	const buttonsDiv = document.createElement("div")
	buttonsDiv.className = "flex justify-between pt-2"

	const submitBtn = document.createElement("button")
	submitBtn.type = "submit"
	submitBtn.className = "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-medium"
	submitBtn.textContent = isSignup ? "Signup" : "Login"

	const cancelBtn = document.createElement("button")
	cancelBtn.type = "button"
	cancelBtn.className = "bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
	cancelBtn.textContent = "Cancel"

	buttonsDiv.appendChild(submitBtn)
	buttonsDiv.appendChild(cancelBtn)
	form.appendChild(buttonsDiv)

	formBox.appendChild(title)
	formBox.appendChild(form)
	modal.appendChild(formBox)
	document.body.appendChild(modal)

	cancelBtn.addEventListener("click", () => modal.remove())

	form.addEventListener("submit", async (e) => {
		e.preventDefault()

		const username = (document.getElementById("authUsername") as HTMLInputElement).value.trim()
		const password = (document.getElementById("authPassword") as HTMLInputElement).value.trim()
		const email = isSignup
			? (document.getElementById("authEmail") as HTMLInputElement).value.trim()
			: ""
		const confirm = isSignup
			? (document.getElementById("authConfirm") as HTMLInputElement).value.trim()
			: ""

		if (!username || !password || (isSignup && (!email || !confirm))) {
			showError("Please fill in all fields")
			return
		}
		if (isSignup && password !== confirm) {
			showError("Passwords do not match")
			return
		}
		if (isSignup && !validateEmail(email)) {
			showError("Invalid email address")
			return
		}

		const endpoint = isSignup ? "/api/register" : "/api/login"
		let res: Response

		try {
			if (isSignup) {
				const avatarInput = document.getElementById("authAvatar") as HTMLInputElement
				const formData = new FormData()
				formData.append("username", username)
				formData.append("email", email)
				formData.append("password", password)
				if (avatarInput?.files?.[0]) {
					formData.append("avatar", avatarInput.files[0])
				}
				res = await fetch(endpoint, {
					method: "POST",
					body: formData,
				})
			} else {
				res = await fetch(endpoint, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username, password }),
				})
			}

			const data = await res.json()
			if (!res.ok) {
				showError(data.error || "Authentication failed")
				return
			}

			currentUser = data.username
			const userId = data.userId || data.id // Handle both possible field names
			setCurrentUserId(userId)
			localStorage.setItem("currentUser", data.username)
			if (userId) {
				localStorage.setItem("currentUserId", userId.toString())
			}
			let avatar = data.avatar || "/avatar.png";
			currentAvatar = avatar
			localStorage.setItem("currentAvatar", avatar)
			updateNav()
			modal.remove()
			if (window.location.pathname === "/other-games") {
				OtherGamesView(false)
			}
		} catch (err) {
			console.error("Auth request failed:", err)
			showError("Failed to connect to server")
		}
	})
	function showError(msg: string) {
		errorText.textContent = msg
		errorText.classList.remove("hidden")
	}
}

function validateEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const inputClassName = "w-full p-2 border border-gray-600 bg-zinc-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"