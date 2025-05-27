import { startGame } from "./game_del";

window.onload = () => {
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");
  if (canvas && context) {
    startGame(canvas, context);
  }
};