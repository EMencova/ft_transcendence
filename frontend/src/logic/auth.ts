import { createPasswordInput } from "../PasswordInput"
let currentUser: string | null = null

export function initializeAuth() {
	const loginBtn = document.getElementById("loginBtn")!
	const signupBtn = document.getElementById("signupBtn")!
	const logoutBtn = document.getElementById("logoutBtn")!
	//const userDisplay = document.getElementById("currentUser")!

	loginBtn.addEventListener("click", () => showAuthForm("login"))
	signupBtn.addEventListener("click", () => showAuthForm("signup"))
	logoutBtn.addEventListener("click", () => {
		currentUser = null
		updateNav()
	})

	updateNav()
}

function updateNav() {
	const userDisplay = document.getElementById("currentUser")!
	const loginBtn = document.getElementById("loginBtn")!
	const signupBtn = document.getElementById("signupBtn")!
	const logoutBtn = document.getElementById("logoutBtn")!

	// if (currentUser) {
	// 	userDisplay.textContent = `👋 Welcome, ${currentUser}`
	// 	loginBtn.style.display = "none"
	// 	signupBtn.style.display = "none"
	// 	logoutBtn.style.display = "inline-block"
	// } else {
	// 	userDisplay.textContent = "Not signed in"
	// 	loginBtn.style.display = "inline-block"
	// 	signupBtn.style.display = "inline-block"
	// 	logoutBtn.style.display = "none"
	// }

	userDisplay.innerHTML = "" 

	if (currentUser) {
		//userDisplay.textContent = `👋 Welcome, ${currentUser}`
		// loginBtn.style.display = "none"
		// signupBtn.style.display = "none"
		// logoutBtn.style.display = "inline-block"
		loginBtn.style.display = "none"
		signupBtn.style.display = "none"
		logoutBtn.style.display = "none" // Ahora va dentro del menú

		// Crea el saludo
		const welcomeSpan = document.createElement("span")
		welcomeSpan.textContent = `👋 Welcome, ${currentUser}`
		welcomeSpan.className = "mr-4" // Espacio a la derecha

		const avatarImg = document.createElement("img")
		avatarImg.src = (window as any).currentAvatar || "/avatar.png"
		avatarImg.alt = "Avatar"
		avatarImg.className = "w-10 h-10 rounded-full cursor-pointer border"

		const menu = document.createElement("div")
		menu.className = "absolute right-0 mt-2 bg-white border rounded shadow hidden text-black z-50"
		menu.innerHTML = `
			<a href="#" class="block px-4 py-2 hover:bg-gray-100">Profile</a>
			<button id="dropdownLogout" class="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
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

		// Logout dentro del menú
		const logoutBtnInMenu = menu.querySelector("#dropdownLogout")
		if (logoutBtnInMenu) {
			logoutBtnInMenu.addEventListener("click", () => {
				currentUser = null
					; (window as any).currentAvatar = null
				updateNav()
			})
		}
	} else {
		userDisplay.textContent = "Not signed in"
		loginBtn.style.display = "inline-block"
		signupBtn.style.display = "inline-block"
		logoutBtn.style.display = "none"
	}
}


function showAuthForm(mode: "login" | "signup") {
	const modal = document.createElement("div")
	modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"

	const formBox = document.createElement("div")
	formBox.className = "bg-white rounded-lg p-6 max-w-sm w-full shadow-md text-black"

	const isSignup = mode === "signup"

	// Title and Form
	const title = document.createElement("h2")
	title.className = "text-xl font-bold mb-4"
	title.textContent = isSignup ? "Signup" : "Login"

	const form = document.createElement("form")
	form.id = "authForm"
	form.className = "space-y-4"

	// Inputs
	const usernameInput = document.createElement("input")
	usernameInput.id = "authUsername"
	usernameInput.className = "w-full p-2 border rounded"
	usernameInput.placeholder = "Username"
	usernameInput.type = "text"

	form.appendChild(usernameInput)

	if (isSignup) {
		const emailInput = document.createElement("input")
		emailInput.id = "authEmail"
		emailInput.className = "w-full p-2 border rounded"
		emailInput.placeholder = "Email"
		emailInput.type = "email"
		form.appendChild(emailInput)
		// avatar
		const avatarInput = document.createElement("input")
		avatarInput.id = "authAvatar"
		avatarInput.className = "w-full p-2 border rounded"
		avatarInput.type = "file"
		avatarInput.accept = "image/*"
		form.appendChild(avatarInput)
	}

	form.appendChild(createPasswordInput("authPassword", "Password"))

	if (isSignup) {
		form.appendChild(createPasswordInput("authConfirm", "Repeat Password"))
	}

	const errorText = document.createElement("p")
	errorText.id = "authError"
	errorText.className = "text-red-600 text-sm hidden"
	form.appendChild(errorText)

	const buttonsDiv = document.createElement("div")
	buttonsDiv.className = "flex justify-between pt-2"

	const submitBtn = document.createElement("button")
	submitBtn.type = "submit"
	submitBtn.className = "bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
	submitBtn.textContent = isSignup ? "Signup" : "Login"

	const cancelBtn = document.createElement("button")
	cancelBtn.type = "button"
	cancelBtn.id = "authCancel"
	cancelBtn.className = "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
	cancelBtn.textContent = "Cancel"

	buttonsDiv.appendChild(submitBtn)
	buttonsDiv.appendChild(cancelBtn)
	form.appendChild(buttonsDiv)

	// Mount elements
	formBox.appendChild(title)
	formBox.appendChild(form)
	modal.appendChild(formBox)
	document.body.appendChild(modal)

	// Events
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

		// Validations
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

		// Avatar handling
		let avatarUrl = ""
		if (isSignup) {
			const avatarInput = document.getElementById("authAvatar") as HTMLInputElement
			const avatarFile = avatarInput?.files?.[0]
			if (avatarFile) {
				avatarUrl = URL.createObjectURL(avatarFile)
			} else {
				avatarUrl = "/avatar.png"
			}
			; (window as any).currentAvatar = avatarUrl
		}

		const endpoint = isSignup ? "/api/register" : "/api/login"
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, ...(isSignup ? { email } : {}) }),
			})

			const data = await res.json()
			if (!res.ok) {
				showError(data.error || "Authentication failed")
				return
			}

			currentUser = data.username
			updateNav()
			modal.remove()
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