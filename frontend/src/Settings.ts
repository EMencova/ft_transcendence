export function settings(): HTMLElement {
  const settings = document.createElement("div");
  settings.className = "container mx-auto p-8";
  
  const title = document.createElement("h1");
  title.textContent = "Welcome to ft_transcendence settings";
  title.className = "text-3xl font-bold mb-6";
  
  settings.appendChild(title);
  
  // Add more content as needed
  
  return settings;
}