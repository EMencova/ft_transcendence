// Features.ts
export function Features(): HTMLElement {
  const section = document.createElement("section")
  section.id = "features"
  section.className = "mb-12 px-4"

  section.innerHTML = `
    <h2 class="text-2xl font-semibold mb-6 mt-6" data-translate="game_modes_title">🎮 Game Modes</h2>

<div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
    <h3 class="text-xl font-bold mb-2" data-translate="game_mode_1player_title">1 Player</h3>
    <p data-translate="game_mode_1player_desc">Challenge an adaptive AI</p>
  </div>
  <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
    <h3 class="text-xl font-bold mb-2" data-translate="game_mode_2players_title">2 Players</h3>
    <p data-translate="game_mode_2players_desc">Compete with a friend</p>
  </div>
  <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
    <h3 class="text-xl font-bold mb-2" data-translate="game_mode_4players_title">4 Players</h3>
    <p data-translate="game_mode_4players_desc">Use all four paddles</p>
  </div>
</div>
  `
  return section
}
