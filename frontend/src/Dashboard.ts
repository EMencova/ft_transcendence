type User = { id: number; username: string }


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


function showDashboard(user: User) {
  const authSection = document.getElementById('authSection')!
  authSection.style.display = 'none'

  const dash = document.getElementById('dashboard')!
  dash.innerHTML = ''

  const heading = document.createElement('h2')
  heading.textContent = `👋 Welcome ${user.username}`
  dash.appendChild(heading)

  const paragraph = document.createElement('p')
  paragraph.textContent = 'Your recent matches:'
  dash.appendChild(paragraph)

  const matchHistoryList = document.createElement('ul')
  matchHistoryList.id = 'matchHistory'
  dash.appendChild(matchHistoryList)

  const logoutBtn = document.createElement('button')
  logoutBtn.textContent = 'Logout'
  logoutBtn.addEventListener('click', logout)
  dash.appendChild(logoutBtn)

  dash.style.display = 'block'

  loadMatchHistory()
}


async function loadMatchHistory() {
  const res = await fetch('/api/matches')
  const matches = await res.json()

  const list = document.getElementById('matchHistory')!
  list.innerHTML = ''

  for (const m of matches) {
    const li = document.createElement('li')
    li.textContent = `${m.mode} | Score: ${m.score} vs ${m.opponent_score} | ${m.result}`
    list.appendChild(li)
  }
}

function logout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(() => location.reload())
}
