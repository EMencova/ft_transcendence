import { Footer } from './Footer.ts'
import { initializeAuth } from './logic/auth.ts'
import { createNav } from './Nav'
import { GameView } from './views/GameView.ts'
import { LeaderboardView } from './views/Leaderboard.ts'
import { ProfileView } from './views/Profile.ts'
import { TournamentView } from './views/Tournament.ts'

export function App(): HTMLElement {
  const container = document.createElement('div')
  container.id = 'appContainer'
  container.className = 'flex flex-col min-h-screen w-full'

  function render() {
    container.innerHTML = '' // Clear the container

    const nav = createNav()
    container.appendChild(nav)

    requestAnimationFrame(() => {
      initializeAuth()
    })

    // const main = GameView()
    // container.appendChild(main)
    const path = window.location.pathname
    let main: HTMLElement | void
    if (path === "/profile") {
      ProfileView(false)
    } else if (path === "/tournament") {
      TournamentView(false)
    } else if (path === "/leaderboard") {
      LeaderboardView(false)
    } else {
      main = GameView()
      container.appendChild(main)
    }

    const footer = Footer()

    //container.appendChild(main)
    container.appendChild(footer)

  }
  render()
  return container
}
