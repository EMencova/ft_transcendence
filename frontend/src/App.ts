import { Footer } from './Footer.ts'
import { initializeAuth } from './logic/auth.ts'
import { createNav } from './Nav'
import { GameView } from './views/GameView.ts'

export function App(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'flex flex-col min-h-screen w-full'

  function render() {
    container.innerHTML = '' // Clear the container

    const nav = createNav()
    container.appendChild(nav)

    requestAnimationFrame(() => {
      initializeAuth()
    })

    const main = GameView()
    container.appendChild(main)

    const footer = Footer()

    container.appendChild(main)
    container.appendChild(footer)
  }
  render()
  return container
}
