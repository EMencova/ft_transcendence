import { Footer } from './Footer.ts'
import { Header } from './Header.ts'


export function App(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'flex flex-col h-screen'

  const main = document.createElement('main')
  main.className = 'flex-grow p-4 text-xl mt-80'
  main.innerHTML = `<p>Game PONG here</p>`

  container.appendChild(Header())
  container.appendChild(main)
  container.appendChild(Footer());

  return container
}