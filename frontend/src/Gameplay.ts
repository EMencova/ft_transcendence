
import { initializeGameUI } from './logic/initGameUI'

export function Gameplay(): HTMLElement {
  const section = document.createElement("section")
  section.id = "gameplay"
  section.className = "px-4 mb-12"

  section.innerHTML = `
    <h2 class="text-2xl font-semibold mb-6" data-translate="try_it_out_title">🕹️ Try It Out</h2>
    <div id="startMenu" class="max-w-md mx-auto bg-[#141414] p-6 rounded-lg shadow-md border border-gray-700">
      <h3 class="text-xl font-bold mb-4 text-center text-orange-500" data-translate="start_game_title">Start Game</h3>

      <label for="modeSelect" data-translate="game_mode_label">Game Mode:</label>
      <select id="modeSelect" class="w-full p-2 pr-8 bg-zinc-800 rounded mb-4 text-white">
        <option value="Pong1" data-translate="game_mode_1player">1 Player (vs AI)</option>
        <option value="Pong2" data-translate="game_mode_2players">2 Players</option>
        <option value="Pong4" data-translate="game_mode_4players">4 Players</option>
      </select>

<div id="startMenu" class="max-w-2xl mx-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8">
  <h3 class="text-2xl font-bold mb-6 text-center text-orange-500" data-translate="start_game_title">Start Game</h3>

  <div class="grid md:grid-cols-2 gap-6">
    <div>
      <label for="modeSelect" class="block text-white font-semibold mb-2" data-translate="game_mode_label">Game Mode:</label>
      <select id="modeSelect" class="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg mb-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
        <option value="Pong1" data-translate="game_mode_1player">1 Player (vs AI)</option>
        <option value="Pong2" data-translate="game_mode_2players">2 Players</option>
        <option value="Pong4" data-translate="game_mode_4players">4 Players</option>
      </select>

      <div id="difficultyWrapper">
        <label for="difficultySelect" class="block text-white font-semibold mb-2" data-translate="ai_difficulty_label">AI Difficulty:</label>
        <select id="difficultySelect" class="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg mb-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          <option value="easy" data-translate="difficulty_easy">Easy</option>
          <option value="medium" data-translate="difficulty_medium">Medium</option>
          <option value="hard" data-translate="difficulty_hard">Hard</option>
        </select>
      </div>

      <div>
        <label for="winScoreSelect" class="block text-white font-semibold mb-2">Win Score:</label>
        <select id="winScoreSelect" class="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg mb-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          <option value="3">First to 3</option>
          <option value="5" selected>First to 5</option>
          <option value="7">First to 7</option>
          <option value="10">First to 10</option>
        </select>
      </div>

      <button id="startBtn" class="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg mb-4 hover:bg-orange-600 transition-colors duration-200" data-translate="start_game_button">Start Game</button>
    </div>

    <div id="controlsInfo" class="bg-gray-900 rounded-lg p-4 border border-gray-600">
      <h4 class="text-orange-500 font-semibold mb-3">🎮 Controls</h4>
      <div id="controlsDisplay" class="text-sm text-gray-300 space-y-2">
        <div class="controls-1player">
          <div class="font-medium text-white mb-1">1 Player Mode:</div>
          <div>Player 1: <span class="bg-gray-700 px-2 py-1 rounded">W</span> / <span class="bg-gray-700 px-2 py-1 rounded">S</span></div>
          <div class="text-gray-400">AI controls Player 2</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Game Container -->
<div id="gameContainer" class="hidden max-w-4xl mx-auto mt-8">
  <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <div id="gameInfo" class="text-white"></div>
      <div class="flex space-x-3">
        <button id="pauseBtn" class="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200" data-translate="pause_button">Pause</button>
        <button id="resetBtn" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200" data-translate="reset_button">Reset</button>
      </div>
    </div>
    
    <canvas id="gameCanvas" width="800" height="600" class="mx-auto border-2 border-gray-600 rounded-lg bg-black shadow-lg"></canvas>
    
    <div id="currentControls" class="mt-4 text-center text-sm text-gray-400"></div>
  </div>
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
