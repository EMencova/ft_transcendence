// import { currentUser } from '../logic/auth'

// export function TournamentView(push = true) {
// 	const main = document.getElementById("mainContent")
// 	if (main) {
// 		if (!currentUser) {
// 			main.innerHTML = `<p class="text-red-500">You must be logged in to view tournaments.</p>`
// 			return
// 		}
// 		main.innerHTML = `
// 			<h2 class="text-2xl font-bold mb-4" data-translate="tournament_title">🏆 Tournament</h2>
// <p data-translate="tournament_desc">The tournament logic and list will go here.</p>
// 		`
// 		if (push) history.pushState({ page: "tournament" }, "", "/tournament")
// 	}
// }

//added

import { currentUser } from "../logic/auth";
import { createElement } from "../utils/domUtils";
import { initializePongGameUI } from "../logic/TournamentGameLogic";
import { startPongGame } from "../logic/TournamentGameLogic";

export function TournamentView(push = true) {
  const main = document.getElementById("mainContent");
  if (!main) return;

  if (!currentUser) {
    main.innerHTML = `<p class="text-red-500">You must be logged in to view tournaments.</p>`;
    return;
  }

  main.innerHTML = "";

  const container = createElement("div", {
    className: "container mx-auto p-8",
  });

  // Title
  const title = createElement("h2", {
    className: "text-2xl font-bold mb-6",
    textContent: "🏆 Tournaments",
  });
  container.appendChild(title);

  // New Tournament Button
  const newBtn = createElement("button", {
    className:
      "mb-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600",
    textContent: "Create New Tournament",
  });
  newBtn.addEventListener("click", showCreateTournamentForm);
  container.appendChild(newBtn);

  // Tournaments List
  const tournamentsList = createElement("div", { id: "tournaments-list" });
  container.appendChild(tournamentsList);

  // Load tournaments
  loadTournaments();

  main.appendChild(container);

  if (push) history.pushState({ page: "tournament" }, "", "/tournament");
}

async function loadTournaments() {
  try {
    const response = await fetch("/api/tournaments");
    if (!response.ok) throw new Error("Failed to load tournaments");
    const data = await response.json();
    const tournaments = data.tournaments || [];

    const list = document.getElementById("tournaments-list");
    if (!list) return;

    if (tournaments.length === 0) {
      list.innerHTML = "<p>No tournaments found.</p>";
      return;
    }

    const table = createElement("table", {
      className: "min-w-full border-collapse",
    });
    const thead = createElement("thead");
    const tbody = createElement("tbody");

    // Table header
    const headerRow = createElement("tr");
    ["ID", "Name", "Start Date", "Status", "Winner", "Actions"].forEach(
      (text) => {
        headerRow.appendChild(
          createElement("th", {
            className: "border p-2 text-left",
            textContent: text,
          })
        );
      }
    );
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table rows
    tournaments.forEach((tournament: any) => {
      const row = createElement("tr");

      // Tournament ID
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.id,
        })
      );

      // Tournament Name
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.name,
        })
      );

      // Start Date
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: new Date(tournament.start_date).toLocaleDateString(),
        })
      );

      // Status
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.status,
        })
      );

      // Winner
      const winnerCell = createElement("td", { className: "border p-2" });
      if (tournament.winner_id) {
        // Fetch winner details
        fetch(`/api/players/${tournament.winner_id}`)
          .then((res) => res.json())
          .then((player) => {
            winnerCell.textContent = player.username;
          });
      } else {
        winnerCell.textContent = "-";
      }
      row.appendChild(winnerCell);

      // Actions
      const actionsCell = createElement("td", { className: "border p-2" });
      const viewBtn = createElement("button", {
        className: "px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
        textContent: "View",
      });
      viewBtn.addEventListener("click", () => viewTournament(tournament.id));
      actionsCell.appendChild(viewBtn);
      row.appendChild(actionsCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    list.appendChild(table);
  } catch (error) {
    console.error("Error loading tournaments:", error);
    const list = document.getElementById("tournaments-list");
    if (list) {
      list.innerHTML = '<p class="text-red-500">Error loading tournaments.</p>';
    }
  }
}

function showCreateTournamentForm() {
  const main = document.getElementById("mainContent");
  if (!main) return;

  main.innerHTML = "";

  const container = createElement("div", {
    className: "container mx-auto p-8",
  });

  // Title
  const title = createElement("h2", {
    className: "text-2xl font-bold mb-6",
    textContent: "Create New Tournament",
  });
  container.appendChild(title);

  // Tournament Name
  const nameField = createElement("div", { className: "mb-4" });
  nameField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Tournament Name",
    })
  );
  const nameInput = createElement("input", {
    className: "w-full p-2 border rounded",
    type: "text",
    id: "tournament-name",
  });
  nameField.appendChild(nameInput);
  container.appendChild(nameField);

  // Tournament Size
  const sizeField = createElement("div", { className: "mb-4" });
  sizeField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Tournament Size",
    })
  );

  const sizeOptions = [4, 8, 16];
  sizeOptions.forEach((size) => {
    const div = createElement("div", { className: "flex items-center mb-2" });
    const radio = createElement("input", {
      type: "radio",
      name: "tournament-size",
      value: size.toString(),
      id: `size-${size}`,
      required: true,
    });
    div.appendChild(radio);
    div.appendChild(
      createElement("label", {
        textContent: `${size} players`,
        htmlFor: `size-${size}`,
        className: "ml-2",
      })
    );
    sizeField.appendChild(div);
  });
  container.appendChild(sizeField);

  // Player Selection
  const playersField = createElement("div", { className: "mb-4" });
  playersField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Select Players",
    })
  );
  const playersContainer = createElement("div", {
    id: "players-container",
    className: "grid grid-cols-2 md:grid-cols-4 gap-4",
  });
  playersField.appendChild(playersContainer);
  container.appendChild(playersField);

  // Load players
  loadPlayersForTournament();

  // Submit Button
  const submitBtn = createElement("button", {
    className: "px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600",
    textContent: "Create Tournament",
  });
  submitBtn.addEventListener("click", createTournament);
  container.appendChild(submitBtn);

  // Back Button
  const backBtn = createElement("button", {
    className:
      "ml-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600",
    textContent: "Back",
  });
  backBtn.addEventListener("click", () => TournamentView());
  container.appendChild(backBtn);

  main.appendChild(container);
}

async function loadPlayersForTournament() {
  try {
    const response = await fetch("/api/players");
    if (!response.ok) throw new Error("Failed to load players");
    const players = await response.json();

    const container = document.getElementById("players-container");
    if (!container) return;

    players.forEach((player: any) => {
      const playerCard = createElement("div", {
        className:
          "border rounded p-4 cursor-pointer bg-gray-800 hover:bg-gray-700",
        "data-player-id": player.id,
      });

      // Player avatar
      const avatar = createElement("img", {
        className: "w-16 h-16 rounded-full mx-auto mb-2",
        src: player.avatar || "/avatar.png",
        alt: player.username,
      });
      playerCard.appendChild(avatar);

      // Player name
      playerCard.appendChild(
        createElement("p", {
          className: "text-center font-semibold",
          textContent: player.username,
        })
      );

      // Selection indicator
      const indicator = createElement("div", {
        className:
          "absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-400 hidden",
      });
      playerCard.appendChild(indicator);

      playerCard.addEventListener("click", () => {
        playerCard.classList.toggle("border-orange-500");
        playerCard.classList.toggle("bg-gray-700");
        indicator.classList.toggle("hidden");
        indicator.classList.toggle("bg-orange-500");
      });

      container.appendChild(playerCard);
    });
  } catch (error) {
    console.error("Error loading players:", error);
  }
}

async function createTournament() {
  const nameInput = document.getElementById(
    "tournament-name"
  ) as HTMLInputElement;
  const sizeInput = document.querySelector(
    'input[name="tournament-size"]:checked'
  ) as HTMLInputElement;

  if (!nameInput.value || !sizeInput) {
    alert("Please fill all required fields");
    return;
  }

  const selectedPlayers = Array.from(
    document.querySelectorAll(
      "#players-container > div.bg-gray-700, #players-container > div.bg-gray-500"
    )
  );
  const playerIds = selectedPlayers.map((el) =>
    el.getAttribute("data-player-id")
  );

  if (playerIds.length !== parseInt(sizeInput.value)) {
    alert(`Please select exactly ${sizeInput.value} players`);
    return;
  }

  try {
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        playerIds,
      }),
    });

    if (!response.ok) throw new Error("Failed to create tournament");

    const result = await response.json();
    alert(`Tournament created successfully! ID: ${result.tournamentId}`);
    viewTournament(result.tournamentId);
  } catch (error) {
    console.error("Error creating tournament:", error);
    alert("Error creating tournament");
  }
}

function viewTournament(tournamentId: number) {
  const main = document.getElementById("mainContent");
  if (!main) return;

  main.innerHTML = "";

  const container = createElement("div", {
    className: "container mx-auto p-8",
    "data-tournament-id": tournamentId.toString(), // Store tournament ID for reference
  });

  // Back Button
  const backBtn = createElement("button", {
    className:
      "mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600",
    textContent: "Back to Tournaments",
  });
  backBtn.addEventListener("click", () => TournamentView());
  container.appendChild(backBtn);

  // Tournament Info
  const infoContainer = createElement("div", { id: "tournament-info" });
  container.appendChild(infoContainer);

  // Tournament Bracket
  const bracketContainer = createElement("div", {
    id: "tournament-bracket",
    className: "mt-8",
  });
  container.appendChild(bracketContainer);

  main.appendChild(container);

  // Load tournament details
  loadTournamentDetails(tournamentId);
}

async function loadTournamentDetails(tournamentId: number) {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}`);
    if (!response.ok) throw new Error("Failed to load tournament");

    const data = await response.json();
    if (!data.tournament || !data.players || !data.matches) {
      throw new Error("Invalid response structure");
    }

    // Extract players and matches from the response
    const players = data.players || [];
    const matches = data.matches || [];

    //***
    console.log("Tournament players:", players);
    console.log("Tournament matches:", matches);

    matches.forEach((match: any) => {
      console.log("Match:", match);
    });

    const infoContainer = document.getElementById("tournament-info");
    if (!infoContainer) return;

    // Tournament Info
    infoContainer.innerHTML = `
            <h2 class="text-2xl font-bold mb-2">${data.tournament.name}</h2>
            <p><strong>Status:</strong> ${data.tournament.status}</p>
            <p><strong>Start Date:</strong> ${new Date(
              data.tournament.start_date
            ).toLocaleString()}</p>
        `;

    // Add winner banner if tournament is completed
    if (data.tournament.status === "completed" && data.tournament.winner_id) {
      const winner = players.find(
        (p: any) => p.id === data.tournament.winner_id
      );
      if (winner) {
        const winnerBanner = createElement("div", {
          className:
            "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black p-6 rounded-lg mb-6 text-center",
        });

        winnerBanner.innerHTML = `
                    <div class="flex items-center justify-center space-x-4">
                        <div class="text-4xl">🏆</div>
                        <div>
                            <h3 class="text-2xl font-bold">Tournament Champion!</h3>
                            <div class="flex items-center justify-center mt-2">
                                <img src="${
                                  winner.avatar || "/avatar.png"
                                }" alt="${winner.username}"
                                     class="w-12 h-12 rounded-full mr-3">
                                <span class="text-xl font-semibold">${
                                  winner.username
                                }</span>
                            </div>
                        </div>
                        <div class="text-4xl">🎉</div>
                    </div>
                `;

        infoContainer.appendChild(winnerBanner);
      }
    }

    // Tournament Bracket
    const bracketContainer = document.getElementById("tournament-bracket");
    if (!bracketContainer) return;

    bracketContainer.innerHTML = "Welcome to the Tournament Stage!";

    // Group matches by round
    const rounds: Record<number, any[]> = {};
    matches.forEach((match: any) => {
      if (!rounds[match.round]) rounds[match.round] = [];
      rounds[match.round].push(match);
    });

    // Create bracket columns
    const bracket = createElement("div", { className: "flex overflow-x-auto" });

    // Sort rounds numerically
    Object.keys(rounds)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((roundNum) => {
        const roundDiv = createElement("div", { className: "mx-4" });
        roundDiv.appendChild(
          createElement("h3", {
            className: "text-xl font-semibold mb-4 text-center",
            textContent: `Round ${roundNum}`,
          })
        );

        const matchesDiv = createElement("div", { className: "space-y-4" });
        rounds[roundNum].forEach((match: any) => {
          const card = createMatchCard(match, players);
          console.log("Match Card Element:", card);
          matchesDiv.appendChild(card);
          //matchesDiv.appendChild(createMatchCard(match, players));
        });

        roundDiv.appendChild(matchesDiv);
        bracket.appendChild(roundDiv);
      });

    bracketContainer.appendChild(bracket);
  } catch (error) {
    console.error("Error loading tournament details:", error);
    const bracketContainer = document.getElementById("tournament-bracket");
    if (bracketContainer) {
      bracketContainer.innerHTML = `<p class="text-red-500">Error loading tournament: ${
        error instanceof Error ? error.message : "Unknown error"
      }</p>`;
    }
  }
}

function createMatchCard(match: any, players: any[]) {
  const player1 = players.find((p) => p.id === match.player1_id) || {
    username: "Unknown Player",
    avatar: "/avatar.png",
  };

  const player2 = players.find((p) => p.id === match.player2_id) || {
    username: "Unknown Player",
    avatar: "/avatar.png",
  };

  const matchCard = createElement("div", {
    className: "border rounded p-4 bg-gray-800 min-w-[250px]",
    "data-match-id": match.id,
  });

  // Match header
  const header = createElement("div", {
    className: "flex justify-between items-center mb-2",
  });
  header.appendChild(
    createElement("h4", {
      className: "font-semibold",
      textContent: `Match ${match.match_number}`,
    })
  );

  // Status badge
  const statusBadge = createElement("span", {
    className: `px-2 py-1 rounded text-xs ${
      match.status === "completed"
        ? "bg-green-500"
        : match.status === "in_progress"
        ? "bg-yellow-500"
        : "bg-gray-500"
    }`,
    textContent: match.status,
  });
  header.appendChild(statusBadge);
  matchCard.appendChild(header);

  // Player 1
  const player1Div = createElement("div", {
    className: "flex items-center mb-2",
  });
  if (player1) {
    player1Div.appendChild(
      createElement("img", {
        className: "w-8 h-8 rounded-full mr-2",
        src: player1.avatar || "/avatar.png",
        alt: player1.username,
      })
    );
    player1Div.appendChild(
      createElement("span", {
        className: match.winner_id === player1.id ? "text-green-400" : "",
        textContent: player1.username,
      })
    );
  } else {
    player1Div.appendChild(
      createElement("span", {
        className: "text-gray-500",
        textContent: "TBD",
      })
    );
  }
  matchCard.appendChild(player1Div);

  // VS separator
  matchCard.appendChild(
    createElement("div", {
      className: "text-center my-1 text-gray-500",
      textContent: "VS",
    })
  );

  // Player 2
  const player2Div = createElement("div", { className: "flex items-center" });
  if (player2) {
    player2Div.appendChild(
      createElement("img", {
        className: "w-8 h-8 rounded-full mr-2",
        src: player2.avatar || "/avatar.png",
        alt: player2.username,
      })
    );
    player2Div.appendChild(
      createElement("span", {
        className: match.winner_id === player2.id ? "text-green-400" : "",
        textContent: player2.username,
      })
    );
  } else {
    player2Div.appendChild(
      createElement("span", {
        className: "text-gray-500",
        textContent: "TBD",
      })
    );
  }
  matchCard.appendChild(player2Div);

  // Actions
  if (match.status === "scheduled" && player1 && player2) {
    const startBtn = createElement("button", {
      className:
        "mt-3 w-full py-1 bg-orange-500 text-white rounded hover:bg-orange-600",
      textContent: "Start Match",
    });
    startBtn.addEventListener("click", () =>
      startTournamentPongMatch(match, players)
    );
    matchCard.appendChild(startBtn);
  } else if (match.status === "in_progress") {
    const resultForm = createElement("div", { className: "mt-3" });
	// If the match is in progress, show a "Continue Match" button to re-enter the game UI
	resultForm.innerHTML = `
		<p class="text-sm text-gray-400 mb-2">Match in progress...</p>
	`;
	const continueBtn = createElement("button", {
		className: "w-full py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
		textContent: "Continue Match",
	});
	continueBtn.addEventListener("click", () => continueTournamentPongMatch(match, players ));
	resultForm.appendChild(continueBtn);
	matchCard.appendChild(resultForm);
	  }
  return matchCard;
}

async function continueTournamentPongMatch(match: any, players:any[] ){
	try {
		const matchid = match.id;
		if (!matchid) {
			alert("continueTournamentPongMatch: ID of this Match not found");
			return;
		}
		const response = await fetch(`/api/tournaments/matches/${matchid}/continue`, {
			method: "POST",
		});
		if (!response.ok) throw new Error("continueTournamentPongMatch: Failed to continue match");
		createPongGameDiv(match, players);
	} catch (error) {
		console.error("Error continuing match:", error);
		alert("Error continuing match");
  }
};



async function startTournamentPongMatch(match: any, players: any[]) {
  try {
    const matchid = match.id;
    if (!matchid) {
      alert("Invalid match ID");
      return;
    }
    const respnse = await fetch(`/api/tournaments/matches/${matchid}/start`, {
      method: "POST",
    });
    if (!respnse.ok) throw new Error("Failed to start match");

    createPongGameDiv(match, players);
  } catch (error) {
    console.error("Error starting match:", error);
    alert("Error starting match");
  }
}

async function createPongGameDiv(match: any, players: any[]) {
  const main = document.getElementById("mainContent");
  if (!main) return;

  // Check if a game container already exists and remove it
  const existingContainer = document.querySelector(
    `[data-match-id="${match.id}"]`
  );
  if (existingContainer) {
    console.log("Removing existing game container");
    existingContainer.remove();
  }

  // Also check for any other game containers and remove them
  const anyGameContainer = document.querySelector("[data-match-id]");
  if (anyGameContainer) {
    console.log("Removing any existing game container");
    anyGameContainer.remove();
  }


  try {
    const response = await fetch(`/api/tournaments/matches/${match.id}`);
    if (!response.ok) throw new Error("Failed to fetch match details");
    const latestMatch = await response.json();
    match = latestMatch;
  } catch (error) {
    console.error("Error fetching match details:", error);
    alert("Error loading match details");
    return;
  }

  const container = document.createElement("div");
  container.className = "container mx-auto p-8";
  container.dataset.matchId = match.id.toString();
  container.innerHTML = `<h2 class="text-xl font-bold mb-4">Game Box</h2>`;

  // Timer element
  const timerDiv = document.createElement("div");
  consr timeRemaining = match.time_remaining;
  timerDiv.id = "timer";
  timerDiv.className = "text-center text-xl font-bold mb-4";
//   timerDiv.textContent = "Time left: 2:00";
  timerDiv.textContent = match.time_remaining ? "Time left: time_remaining" : "Time. left: 2:00" ;
  container.appendChild(timerDiv);

  // Create Canvas element
  const canvas = document.createElement("canvas");
  canvas.id = `pong-game-${match.id}`;
  canvas.className = "pong-game-canvas bg-gray-800 rounded mx-auto";
  canvas.width = 800;
  canvas.height = 500;
  container.appendChild(canvas);

  // Get canvas context
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Could not get canvas context");
    return;
  }

  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);
  if (!player1 || !player2) {
    alert("Invalid players for this match");
    return;
  }

  // === FLEX HEADER ROW ===
  const matchHeader = document.createElement("div");
  matchHeader.className = "flex items-center justify-between mb-6 w-full";

  // === GAME CONTROLS ===
  const controls = document.createElement("div");
  controls.className = "flex justify-center gap-4 mt-4";

  const startButton = document.createElement("button");
  startButton.id = "startBtn";
  startButton.className =
    "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600";
  startButton.textContent =
    match.status === "scheduled" ? "Start Game" : "Continue";

  const pauseButton = document.createElement("button");
  pauseButton.id = "pauseBtn";
  pauseButton.className =
    "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600";
  pauseButton.textContent = "Pause";
  pauseButton.style.display = "none";

  const stopButton = document.createElement("button");
  stopButton.id = "stopBtn";
  stopButton.className =
    "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600";
  stopButton.textContent = "Stop Game";
  stopButton.style.display = "none";

  controls.appendChild(startButton);
  controls.appendChild(pauseButton);
  controls.appendChild(stopButton);

  // === APPEND ALL ===
  container.appendChild(matchHeader);
  container.appendChild(controls);
  main.appendChild(container);

  // Initialize game UI
  initializePongGameUI(match);

  if (match.status === "in_progress") {
    const canvas = document.getElementById(
      `pong-game-${match.id}`
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      startPongGame(canvas, ctx, match);
    }
  }
}


export async function recordMatchResult(matchId: number, winnerId: string) {
  try {
    console.log(
      `Recording match result: Match ${matchId}, Winner: ${winnerId}`
    );

    const response = await fetch(`/api/tournaments/matches/${matchId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("API Error:", errorData);
      throw new Error(
        `Failed to record result: ${errorData.error || response.statusText}`
      );
    }

    const result = await response.json();
    console.log("Match result response:", result);

    // Check if tournament was completed
    if (result.tournamentComplete) {
      alert(
        `🏆 Tournament Complete! Winner: Player ${result.tournamentWinner}! 🎉`
      );
    } else {
      alert("Match result recorded successfully!");
    }

    // Get tournament ID from the container data attribute and reload view
    const container = document.querySelector(
      "[data-tournament-id]"
    ) as HTMLElement;
    if (container) {
      const tournamentId = container.getAttribute("data-tournament-id");
      if (tournamentId) {
        console.log(`Reloading tournament view for ID: ${tournamentId}`);
        viewTournament(parseInt(tournamentId));
      }
    }
  } catch (error) {
    console.error("Error recording match result:", error);
    alert(
      `Error recording result: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
