import { updateText } from '../public/js/translation'

export function LoginRegister(onLoginSuccess: () => void): HTMLElement {
  let mode: 'login' | 'register' = 'login'

  const container = document.createElement('div')
  container.className = 'flex items-center justify-center h-screen w-full bg-gray-900 text-white'

  const form = document.createElement('form')
  form.className = 'bg-zinc-900 p-8 rounded-lg shadow-lg w-80 flex flex-col gap-4 border border-gray-700'

  const modeSwitch = document.createElement('div')
  modeSwitch.className = 'flex justify-between text-sm mb-2 text-gray-400'

  const loginTab = document.createElement('button')
  loginTab.type = 'button'
  loginTab.setAttribute('data-translate', 'login_tab')
  loginTab.className = 'hover:text-orange-500 transition-colors'

  const registerTab = document.createElement('button')
  registerTab.type = 'button'
  registerTab.setAttribute('data-translate', 'register_tab')
  registerTab.className = 'hover:text-orange-500 transition-colors'

  modeSwitch.appendChild(loginTab)
  modeSwitch.appendChild(registerTab)

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-center text-orange-500'
  title.setAttribute('data-translate', 'pong_login')

  const usernameInput = document.createElement('input')
  usernameInput.type = 'text'
  usernameInput.setAttribute('data-translate-placeholder', 'username_placeholder')
  usernameInput.className = inputClassName

  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.setAttribute('data-translate-placeholder', 'email_placeholder')
  emailInput.className = inputClassName

  const passwordInput = document.createElement('input')
  passwordInput.type = 'password'
  passwordInput.setAttribute('data-translate-placeholder', 'password_placeholder')
  passwordInput.className = inputClassName

  const button = document.createElement('button')
  button.type = 'submit'
  button.setAttribute('data-translate', 'start_button')
  button.className =
    'bg-orange-600 border border-orange-500 text-white py-2 rounded hover:bg-orange-700 transition-colors font-medium'

  function updateMode(newMode: 'login' | 'register') {
    mode = newMode

    title.setAttribute('data-translate', mode === 'login' ? 'pong_login' : 'pong_register')
    button.setAttribute('data-translate', mode === 'login' ? 'login_button' : 'register_button')

    loginTab.classList.toggle('text-orange-500', mode === 'login')
    registerTab.classList.toggle('text-orange-500', mode === 'register')

    emailInput.style.display = mode === 'register' ? 'block' : 'none'

    // ✅ Apply translations globally after mode change
    updateText()
  }

  loginTab.onclick = () => updateMode('login')
  registerTab.onclick = () => updateMode('register')

  form.appendChild(modeSwitch)
  form.appendChild(title)
  form.appendChild(usernameInput)
  form.appendChild(emailInput)
  form.appendChild(passwordInput)
  form.appendChild(button)

  form.onsubmit = async (e) => {
    e.preventDefault()

    const username = usernameInput.value.trim()
    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if (!username || !password || (mode === 'register' && !email)) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      const res = await fetch(`http://localhost:3000/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...(mode === 'register' ? { email } : {}) })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Something went wrong.')
        return
      }
      alert(`${mode.toUpperCase()} successful.`)
      onLoginSuccess()
    } catch (err) {
      console.error(err)
      alert('Network error. Please try again.')
    }
  }

  container.appendChild(form)

  // ✅ Ensure translation applies on initial render using saved language
  updateMode(mode)

  return container
}

const inputClassName =
  'bg-gray-700 border border-gray-600 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400'



