import { Footer } from './Footer.ts'
import { initializeAuth } from './logic/auth.ts'
import { setupNavLinks } from './logic/router.ts'
import { createNav } from './Nav'
import { GameView } from './views/GameView.ts'
import { LeaderboardView } from './views/Leaderboard.ts'
import { OtherGamesView } from './views/OtherGames.ts'
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

    // Setup navigation links after creating nav
    setupNavLinks()

    requestAnimationFrame(() => {
      initializeAuth()
    })

    // Handle initial route
    const path = window.location.pathname

    // Create main content container
    const mainContent = document.createElement('main')
    mainContent.id = 'mainContent'
    mainContent.className = 'flex-grow' // To push footer to the bottom
    container.appendChild(mainContent)

    // Route to appropriate view (don't push to history on initial load)
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (path === "/profile") {
        ProfileView(false)
      } else if (path === "/tournament") {
        TournamentView(false)
      } else if (path === "/leaderboard") {
        LeaderboardView(false)
      } else if (path === "/other-games") {
        OtherGamesView(false)
      } else {
        GameView(false)
      }
    }, 0)

    const footer = Footer()
    container.appendChild(footer)
  }
  render()
  return container
}
