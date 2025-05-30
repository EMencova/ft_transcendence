export function Footer(): HTMLElement {
  const footer = document.createElement('footer')
  footer.className = 'bg-gray-800 text-white text-center p-2 mt-8'
  footer.innerText = '© 2025 ft_transcendence by Eliska, Azeez and Vero'
  return footer
}