export function tournament(): HTMLElement {
  const tournament = document.createElement("div");
  tournament.className = "container mx-auto p-8";
  
  const title = document.createElement("h1");
  title.textContent = "Welcome to ft_transcendence Tournament";
  title.className = "text-3xl font-bold mb-6";
  
  tournament.appendChild(title);
  
  // Add more content as needed
  
  return tournament;
}