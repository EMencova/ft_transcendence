

export function LoginRegister(onLoginSuccess: () => void): HTMLElement {
	let mode: 'login' | 'register' = 'login'

	const container = document.createElement('div')
	container.className = 'flex items-center justify-center h-screen w-full bg-[#242424] text-white'

	const form = document.createElement('form')
	form.className = 'bg-[#1a1a1a] p-8 rounded-lg shadow-md w-80 flex flex-col gap-4 border border-[#646cff]'

	const modeSwitch = document.createElement('div')
	modeSwitch.className = 'flex justify-between text-sm mb-2 text-gray-400'

	const loginTab = document.createElement('button')
	loginTab.type = 'button'
	loginTab.innerText = 'Login'
	loginTab.className = 'hover:text-[#646cff] transition-colors'

	const registerTab = document.createElement('button')
	registerTab.type = 'button'
	registerTab.innerText = 'Register'
	registerTab.className = 'hover:text-[#646cff] transition-colors'

	modeSwitch.appendChild(loginTab)
	modeSwitch.appendChild(registerTab)

	const title = document.createElement('h2')
	title.className = 'text-2xl font-bold text-center text-[#646cff]'
	title.innerText = 'PONG LOGIN'

	const usernameInput = document.createElement('input')
	usernameInput.type = 'text'
	usernameInput.placeholder = 'Username'
	usernameInput.className =
		'bg-[#242424] border border-[#646cff] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#646cff] placeholder-gray-400'

	const emailInput = document.createElement('input')
	emailInput.type = 'email'
	emailInput.placeholder = 'Email'
	emailInput.className =
		'bg-[#242424] border border-[#646cff] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#646cff] placeholder-gray-400'

	const button = document.createElement('button')
	button.type = 'submit'
	button.innerText = 'START'
	button.className =
		'bg-[#1a1a1a] border border-[#646cff] text-white py-2 rounded hover:bg-[#323232] transition-colors'

	// Cambiar modo
	function updateMode(newMode: 'login' | 'register') {
		mode = newMode
		title.innerText = newMode === 'login' ? 'PONG LOGIN' : 'PONG REGISTER'
		button.innerText = newMode === 'login' ? 'LOGIN' : 'REGISTER'

		// Visual tab feedback
		loginTab.classList.toggle('text-[#646cff]', mode === 'login')
		registerTab.classList.toggle('text-[#646cff]', mode === 'register')
	}

	loginTab.onclick = () => updateMode('login')
	registerTab.onclick = () => updateMode('register')

	form.appendChild(modeSwitch)
	form.appendChild(title)
	form.appendChild(usernameInput)
	form.appendChild(emailInput)
	form.appendChild(button)

	form.onsubmit = (e) => {
		e.preventDefault()
		const username = usernameInput.value.trim()
		const email = emailInput.value.trim()

		if (username && email) {
			// Aquí lógica de login/register real
			console.log(`${mode.toUpperCase()}: ${username} - ${email}`)
			onLoginSuccess()
		}
	}

	container.appendChild(form)
	updateMode(mode) // iniciar con modo login

	return container
}
