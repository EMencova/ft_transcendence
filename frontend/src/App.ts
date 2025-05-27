import { Footer } from './Footer.ts'
import { Header } from './Header.ts'
import { LoginRegister } from './LoginRegister.ts'
import { Pong } from './Pong.ts'

// WITHOUT LOGIN/REGISTER
// export function App(): HTMLElement {
//   const container = document.createElement('div')
//   container.className = 'flex flex-col h-screen w-full'

//   container.appendChild(Header())
//   container.appendChild(Pong())
//   container.appendChild(Footer());

//   return container
// }

let isLoggedIn = false

export function App(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'h-screen w-full'

  function render() {
    container.innerHTML = '' // Limpiar el contenido

    if (!isLoggedIn) {
      container.appendChild(LoginRegister(() => {
        isLoggedIn = true
        render()
      }))
    } else {
      const main = document.createElement('div')
      main.className = 'flex flex-col h-screen w-full'

      main.appendChild(Header())
      main.appendChild(Pong())
      main.appendChild(Footer())

      container.appendChild(main)
    }
  }

  render()
  return container
}