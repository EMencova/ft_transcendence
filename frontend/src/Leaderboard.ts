export function leaderboard(): HTMLElement {
  const leaderboard = document.createElement("div");
  leaderboard.className = "container mx-auto p-8";
  
  const title = document.createElement("h1");
  title.textContent = "Welcome to ft_transcendence leaderboard";
  title.className = "text-3xl font-bold mb-6";
  
  leaderboard.appendChild(title);
  
  // Add more content as needed
  
  return leaderboard;
}