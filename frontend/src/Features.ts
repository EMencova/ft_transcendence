// Features.ts
export function Features(): HTMLElement {
  const section = document.createElement("section")
  section.id = "features"
  section.className = "mb-12 px-4"

  section.innerHTML = `
    <h2 class="text-2xl font-semibold mb-6 mt-6">🎮 Game Modes</h2>
    <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
        <h3 class="text-xl font-bold mb-2">1 Player</h3>
        <p>Challenge an adaptive AI</p>
      </div>
      <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
        <h3 class="text-xl font-bold mb-2">2 Players</h3>
        <p>Compete with a friend</p>
      </div>
      <div class="bg-[#1a1a1a] rounded-lg p-6 text-center shadow-md">
        <h3 class="text-xl font-bold mb-2">4 Players</h3>
        <p>Use all four paddles</p>
      </div>
    </div>
  `
  return section
}
