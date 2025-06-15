// Gameplay.ts
import { initializeGameUI } from './logic/initGameUI'

export function Gameplay(): HTMLElement {
  const section = document.createElement("section")
  section.id = "gameplay"
  section.className = "px-4 mb-12"

  section.innerHTML = `

  <div class="flex items-center justify-between mb-4">
  <!-- Profile Picture Placeholder -->
  <div class="flex items-center space-x-2">
    <span class="text-white text-lg">👤 Player</span>
  </div>

  <!-- Language Flags -->
  <div id="langFlags" class="flex gap-2">
    <img src="https://flagcdn.com/24x18/gb.png" alt="English" data-lang="en" class="lang-flag cursor-pointer border-2 border-white rounded-sm active">
    <img src="https://flagcdn.com/24x18/es.png" alt="Español" data-lang="es" class="lang-flag cursor-pointer rounded-sm">
    <img src="https://flagcdn.com/24x18/cz.png" alt="Česky" data-lang="cz" class="lang-flag cursor-pointer rounded-sm">
  </div>
</div>

    <h2 class="text-2xl font-semibold mb-6">🕹️ Try It Out</h2>
    <div id="startMenu" class="max-w-md mx-auto bg-[#141414] p-6 rounded-lg shadow-md">
      <h3 class="text-xl font-bold mb-4 text-center">Start Game</h3>

      <label for="modeSelect">Game Mode:</label>
      <select id="modeSelect" class="w-full p-2 bg-zinc-800 rounded mb-4 text-white">
        <option value="Pong1">1 Player (vs AI)</option>
        <option value="Pong2">2 Players</option>
        <option value="Pong4">4 Players</option>
      </select>

      <div id="difficultyWrapper">
        <label for="difficultySelect">AI Difficulty:</label>
        <select id="difficultySelect" class="w-full p-2 bg-zinc-800 rounded mb-4 text-white">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button id="startBtn" class="w-full bg-orange-500 text-white font-semibold py-2 rounded mb-4 hover:bg-orange-600">Start Game</button>
    </div>

    <canvas id="gameCanvas" width="800" height="600" class="hidden mx-auto my-8 border-2 border-white rounded-lg bg-black"></canvas>

    <div class="flex justify-center text-center space-x-4">
      <button id="pauseBtn" class="hidden bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Pause</button>
      <button id="resetBtn" class="hidden bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Reset</button>
    </div>
  `

  // ✅ Init UI game
  requestAnimationFrame(() => {
    initializeGameUI()
  })

  return section
}
