
import { initializeGameUI } from './logic/initGameUI'

export function Gameplay(): HTMLElement {
  const section = document.createElement("section")
  section.id = "gameplay"
  section.className = "px-4 mb-12"

  section.innerHTML = `
    <h2 class="text-2xl font-semibold mb-6" data-translate="try_it_out_title">🕹️ Try It Out</h2>
    <div id="startMenu" class="max-w-md mx-auto bg-[#141414] p-6 rounded-lg shadow-md border border-gray-700">
      <h3 class="text-xl font-bold mb-4 text-center" data-translate="start_game_title">Start Game</h3>

      <label for="modeSelect" data-translate="game_mode_label">Game Mode:</label>
      <select id="modeSelect" class="w-full p-2 pr-8 bg-zinc-800 rounded mb-4 text-white">
        <option value="Pong1" data-translate="game_mode_1player">1 Player (vs AI)</option>
        <option value="Pong2" data-translate="game_mode_2players">2 Players</option>
        <option value="Pong4" data-translate="game_mode_4players">4 Players</option>
      </select>

      <div id="difficultyWrapper">
        <label for="difficultySelect" data-translate="ai_difficulty_label">AI Difficulty:</label>
        <select id="difficultySelect" class="w-full p-2 pr-8 bg-zinc-800 rounded mb-4 text-white">
          <option value="easy" data-translate="difficulty_easy">Easy</option>
          <option value="medium" data-translate="difficulty_medium">Medium</option>
          <option value="hard" data-translate="difficulty_hard">Hard</option>
        </select>
      </div>

      <button id="startBtn" class="w-full bg-orange-500 text-white font-semibold py-2 rounded mb-4 hover:bg-orange-600" data-translate="start_game_button">Start Game</button>
    </div>

    <canvas id="gameCanvas" width="800" height="600" class="hidden mx-auto my-8 border-2 border-white rounded-lg bg-black"></canvas>

    <div class="flex justify-center text-center space-x-4">
      <button id="pauseBtn" class="w-24 hidden bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600" data-translate="pause_button">Pause</button>
      <button id="resetBtn" class="w-24 hidden bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600" data-translate="reset_button">Reset</button>
    </div>
    `

  // ✅ Init UI game
  requestAnimationFrame(() => {
    initializeGameUI()

    // Add select dropdown arrow rotation logic
    const selects = section.querySelectorAll('select')
    selects.forEach(select => {
      let isOpen = false

      select.addEventListener('mousedown', () => {
        isOpen = !isOpen
        select.classList.toggle('open', isOpen)
      })

      select.addEventListener('blur', () => {
        isOpen = false
        select.classList.remove('open')
      })

      select.addEventListener('change', () => {
        isOpen = false
        select.classList.remove('open')
      })
    })
  })

  return section
}
