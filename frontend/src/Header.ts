export function Header(): HTMLElement {
  const header = document.createElement('header')
  header.className = 'bg-gray-800 text-pink-600 p-4 text-2xl'
  header.innerHTML = `<h1 class="text-xl font-bold">ft_transcendence</h1>`
  return header
}