// ✅ dashboard.js

// Handle user login/signup via modal forms
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
	e.preventDefault()
	const username = (document.getElementById('loginUsername') as HTMLInputElement).value
	const password = (document.getElementById('loginPassword') as HTMLInputElement).value

	const res = await fetch('/api/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	})

	const data = await res.json()
	if (res.ok) {
		showDashboard(data.user)
	} else {
		alert(data.message)
	}
})

document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
	e.preventDefault()
	const username = (document.getElementById('signupUsername') as HTMLInputElement).value
	const password = (document.getElementById('signupPassword') as HTMLInputElement).value

	const res = await fetch('/api/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	})

	const data = await res.json()
	if (res.ok) {
		showDashboard(data.user)
	} else {
		alert(data.message)
	}
})

// // 🔒 Logout
// function logout() {
// 	fetch('/api/auth/logout', { method: 'POST' })
// 		.then(() => location.reload())
// }

// 🧑 Show user dashboard
type User = { id: number; username: string }
function showDashboard(user: User) {
	document.getElementById('authSection')!.style.display = 'none'
	const dash = document.getElementById('dashboard')!
	dash.innerHTML = `<h2>👋 Welcome ${user.username}</h2>
	<p>Your recent matches:</p>
	<ul id="matchHistory"></ul>
	<button onclick="logout()">Logout</button>`
	dash.style.display = 'block'
	loadMatchHistory()
}

// 🧾 Load matches
async function loadMatchHistory() {
	const res = await fetch('/api/matches')
	const matches = await res.json()
	const list = document.getElementById('matchHistory')!
	list.innerHTML = matches.map((m: any) => `<li>${m.mode} | Score: ${m.score} vs ${m.opponent_score} | ${m.result}</li>`).join('')
}