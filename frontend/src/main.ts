import { App } from './App.ts'
import { loadTranslations, setLanguage, setupLanguageSwitcher } from '../public/js/translation.ts'
import { initializeGameUI } from './logic/initGameUI'
import { GDPRHelpers } from './services/gdprService'
import './style.css'

const root = document.querySelector<HTMLDivElement>('#app')

window.addEventListener('DOMContentLoaded', async () => {
  if (!root) return

  root.appendChild(App())

  initializeGameUI()

  await loadTranslations()
  setupLanguageSwitcher()
  setLanguage('en')

  // Initialize GDPR compliance
  GDPRHelpers.initialize()
})





// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Ft_transcendence</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
