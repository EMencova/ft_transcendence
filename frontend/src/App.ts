import { Features } from './Features.ts'
import { Footer } from './Footer.ts'
import { Gameplay } from './Gameplay.ts'
import { createNav } from './Nav'
import { initializeAuth } from './logic/auth.ts'


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
    const main = document.createElement('main')
    main.className = 'flex-grow' // To push footer to the bottom
    main.appendChild(Features())
    main.appendChild(Gameplay())

    const footer = Footer()

    container.appendChild(main)
    container.appendChild(footer)
  }
  render()
  return container
}