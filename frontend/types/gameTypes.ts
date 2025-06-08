const gameTypes = {
	"Pong1": {
		name: "Single Player Pong",
		players: 1,
		AI: 1,
		controls: {
		player1: { up: "ArrowUp", down: "ArrowDown" }
		},
	},
	"Pong2": {
		name: "Two Player Pong",
		players: 2,
		controls: {
		player1: { up: "W", down: "S" },
		player2: { up: "ArrowUp", down: "ArrowDown" }
		},
	},

	"Pong4": {
		name: "Multi Player Pong",
		players: 4,
		controls: {
		player1: { up: "W", down: "S" },
		player2: { up: "ArrowUp", down: "ArrowDown" },
		player3: { up: "B", down: "Space" },
		player4: { up: "9", down: "0" }
		},
  },
};

export type GameType = keyof typeof gameTypes;