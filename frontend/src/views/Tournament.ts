//added

import { currentUser } from "../logic/auth"
import { cleanupActiveGame, initializePongGameUI, startPongGame } from "../logic/TournamentGameLogic"
import { createElement } from "../utils/domUtils"

export function TournamentView(push = true) {

  cleanupActiveGame()

  const main = document.getElementById("mainContent")
  if (!main) return

  if (!currentUser) {
    main.innerHTML = `<p class="text-red-500" data-translate="tournament_login_required"></p>`
    return
  }

  main.innerHTML = ""

  const container = createElement("div", {
    className: "container mx-auto p-8",
  })

  // Title
  const title = createElement("h2", {
    className: "text-2xl font-bold mb-6",
    textContent: "🏆 Tournaments",
    "data-translate": "tournament_title",
  })
  container.appendChild(title)

  // New Tournament Button
  const newBtn = createElement("button", {
    className:
      "mb-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600",
    textContent: "Create New Tournament",
    "data-translate": "tournament_create_btn",
  })
  newBtn.addEventListener("click", showCreateTournamentForm)
  container.appendChild(newBtn)

  // Tournaments List
  const tournamentsList = createElement("div", { id: "tournaments-list" })
  container.appendChild(tournamentsList)

  loadTournaments()

  main.appendChild(container)

  if (push) history.pushState({ page: "tournament" }, "", "/tournament")
}

async function loadTournaments() {
  try {
    const response = await fetch("/api/tournaments")
    if (!response.ok) throw new Error("Failed to load tournaments")
    const data = await response.json()
    const tournaments = data.tournaments || []

    const list = document.getElementById("tournaments-list")
    if (!list) return

    if (tournaments.length === 0) {
      list.innerHTML = `<p data-translate="tournament_none_found"></p>`
      return
    }

    const table = createElement("table", {
      className: "min-w-full border-collapse",
    })
    const thead = createElement("thead")
    const tbody = createElement("tbody")

    // Table header
    const headerRow = createElement("tr");
    ["ID", "Name", "Start Date", "Status", "Winner", "Actions"].forEach(
      (text, idx) => {
        const th = createElement("th", {
          className: "border p-2 text-left",
          textContent: text,
        })
        th.setAttribute("data-translate", `tournament_table_${idx}`)
        headerRow.appendChild(th)
      }
    )
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Table rows
    tournaments.forEach((tournament: any) => {
      const row = createElement("tr")

      // Tournament ID
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.id,
        })
      )

      // Tournament Name
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.name,
        })
      )

      // Start Date
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: new Date(tournament.start_date).toLocaleDateString(),
        })
      )

      // Status
      row.appendChild(
        createElement("td", {
          className: "border p-2",
          textContent: tournament.status,
        })
      )

      // Winner
      const winnerCell = createElement("td", { className: "border p-2" })
      if (tournament.winner_id) {
        fetch(`/api/players/${tournament.winner_id}`)
          .then((res) => res.json())
          .then((player) => {
            winnerCell.textContent = player.username
          })
      } else {
        winnerCell.textContent = "-"
      }
      row.appendChild(winnerCell)

      // Actions
      const actionsCell = createElement("td", { className: "border p-2" })
      const viewBtn = createElement("button", {
        className: "px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
        textContent: "View",
        "data-translate": "tournament_view_btn",
      })
      viewBtn.addEventListener("click", () => viewTournament(tournament.id))
      actionsCell.appendChild(viewBtn)
      row.appendChild(actionsCell)

      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    list.appendChild(table)
  } catch (error) {
    console.error("Error loading tournaments:", error)
    const list = document.getElementById("tournaments-list")
    if (list) {
      list.innerHTML = '<p class="text-red-500" data-translate="tournament_error_loading"></p>'
    }
  }
}

function showCreateTournamentForm() {
  const main = document.getElementById("mainContent")
  if (!main) return

  main.innerHTML = ""

  const container = createElement("div", {
    className: "container mx-auto p-8",
  })

  // Title
  const title = createElement("h2", {
    className: "text-2xl font-bold mb-6",
    textContent: "Create New Tournament",
    "data-translate": "tournament_create_title",
  })
  container.appendChild(title)

  // Tournament Name
  const nameField = createElement("div", { className: "mb-4" })
  nameField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Tournament Name",
      "data-translate": "tournament_name_label",
    })
  )
  const nameInput = createElement("input", {
    className: "w-full p-2 border rounded",
    type: "text",
    id: "tournament-name",
  })
  nameField.appendChild(nameInput)
  container.appendChild(nameField)

  // Tournament Size
  const sizeField = createElement("div", { className: "mb-4" })
  sizeField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Tournament Size",
      "data-translate": "tournament_size_label",
    })
  )

  const sizeOptions = [4, 8, 16]
  sizeOptions.forEach((size) => {
    const div = createElement("div", { className: "flex items-center mb-2" })
    const radio = createElement("input", {
      type: "radio",
      name: "tournament-size",
      value: size.toString(),
      id: `size-${size}`,
      required: true,
    })
    div.appendChild(radio)
    div.appendChild(
      createElement("label", {
        textContent: `${size} players`,
        htmlFor: `size-${size}`,
        className: "ml-2",
        "data-translate": `tournament_size_option_${size}`,
      })
    )
    sizeField.appendChild(div)
  })
  container.appendChild(sizeField)

  // Player Selection
  const playersField = createElement("div", { className: "mb-4" })
  playersField.appendChild(
    createElement("label", {
      className: "block mb-2",
      textContent: "Select Players",
      "data-translate": "tournament_select_players",
    })
  )
  const playersContainer = createElement("div", {
    id: "players-container",
    className: "grid grid-cols-2 md:grid-cols-4 gap-4",
  })
  playersField.appendChild(playersContainer)
  container.appendChild(playersField)

  loadPlayersForTournament()

  // Submit Button
  const submitBtn = createElement("button", {
    className: "px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600",
    textContent: "Create Tournament",
    "data-translate": "tournament_create_submit",
  })
  submitBtn.addEventListener("click", createTournament)
  container.appendChild(submitBtn)

  // Back Button
  const backBtn = createElement("button", {
    className:
      "ml-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600",
    textContent: "Back",
    "data-translate": "tournament_back_btn",
  })
  backBtn.addEventListener("click", () => TournamentView())
  container.appendChild(backBtn)

  main.appendChild(container)
}

async function loadPlayersForTournament() {
  try {
    const response = await fetch("/api/players")
    if (!response.ok) throw new Error("Failed to load players")
    const players = await response.json()

    const container = document.getElementById("players-container")
    if (!container) return

    players.forEach((player: any) => {
      const playerCard = createElement("div", {
        className:
          "border rounded p-4 cursor-pointer bg-gray-800 hover:bg-gray-700",
        "data-player-id": player.id,
      })

      // Player avatar
      const avatar = createElement("img", {
        className: "w-16 h-16 rounded-full mx-auto mb-2",
        src: player.avatar || "/avatar.png",
        alt: player.username,
      })
      playerCard.appendChild(avatar)

      // Player name
      playerCard.appendChild(
        createElement("p", {
          className: "text-center font-semibold",
          textContent: player.username,
        })
      )

      // Selection indicator
      const indicator = createElement("div", {
        className:
          "absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-400 hidden",
      })
      playerCard.appendChild(indicator)

      playerCard.addEventListener("click", () => {
        playerCard.classList.toggle("border-orange-500")
        playerCard.classList.toggle("bg-gray-700")
        indicator.classList.toggle("hidden")
        indicator.classList.toggle("bg-orange-500")
      })

      container.appendChild(playerCard)
    })
  } catch (error) {
    console.error("Error loading players:", error)
  }
}




async function createTournament() {
  const nameInput = document.getElementById(
    "tournament-name"
  ) as HTMLInputElement
  const sizeInput = document.querySelector(
    'input[name="tournament-size"]:checked'
  ) as HTMLInputElement

  if (!nameInput.value || !sizeInput) {
    alert(
      (document.querySelector("#translate-create-fields")?.textContent) ||
      "Please fill all required fields"
    )
    return
  }

  const selectedPlayers = Array.from(
    document.querySelectorAll(
      "#players-container > div.bg-gray-700, #players-container > div.bg-gray-500"
    )
  )
  const playerIds = selectedPlayers.map((el) =>
    el.getAttribute("data-player-id")
  )

  if (playerIds.length !== parseInt(sizeInput.value)) {
    alert(
      (document.querySelector("#translate-select-exact")?.textContent) ||
      `Please select exactly ${sizeInput.value} players`
    )
    return
  }

  try {
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        playerIds,
      }),
    })

    if (!response.ok) throw new Error("Failed to create tournament")

    const result = await response.json()
    alert(
      (document.querySelector("#translate-created-success")?.textContent) ||
      `Tournament created successfully! ID: ${result.tournamentId}`
    )
    viewTournament(result.tournamentId)
  } catch (error) {
    console.error("Error creating tournament:", error)
    alert(
      (document.querySelector("#translate-created-error")?.textContent) ||
      "Error creating tournament"
    )
  }
}

function viewTournament(tournamentId: number) {
  cleanupActiveGame()
  const main = document.getElementById("mainContent")
  if (!main) return
  main.innerHTML = ""

  const container = createElement("div", {
    className: "container mx-auto p-8",
    "data-tournament-id": tournamentId.toString(),
  })

  const backBtn = createElement("button", {
    className:
      "mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600",
    textContent:
      (document.querySelector("#translate-back-tournaments")?.textContent) ||
      "Back to Tournaments",
    "data-translate": "tournament_back_btn",
  })
  backBtn.addEventListener("click", () => TournamentView())
  container.appendChild(backBtn)

  container.appendChild(createElement("div", { id: "tournament-info" }))
  container.appendChild(
    createElement("div", { id: "tournament-bracket", className: "mt-8" })
  )
  main.appendChild(container)

  loadTournamentDetails(tournamentId)
}

async function loadTournamentDetails(tournamentId: number) {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}`)
    if (!response.ok) throw new Error("Failed to load tournament")
    const data = await response.json()

    const players = data.players || []
    const matches = data.matches || []

    const infoContainer = document.getElementById("tournament-info")
    if (!infoContainer) return

    infoContainer.innerHTML = `
      <h2 class="text-2xl font-bold mb-2" data-translate="tournament_name">${data.tournament.name}</h2>
      <p><strong data-translate="tournament_status_label">Status:</strong> ${data.tournament.status}</p>
      <p><strong data-translate="tournament_start_label">Start Date:</strong> ${new Date(
      data.tournament.start_date
    ).toLocaleString()}</p>
    `

    if (data.tournament.status === "completed" && data.tournament.winner_id) {
      const winner = players.find((p: any) => p.id === data.tournament.winner_id)
      if (winner) {
        const winnerBanner = createElement("div", {
          className:
            "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black p-6 rounded-lg mb-6 text-center",
        })
        winnerBanner.innerHTML = `
          <div class="flex items-center justify-center space-x-4">
            <div class="text-4xl">🏆</div>
            <div>
              <h3 class="text-2xl font-bold" data-translate="tournament_champion">Tournament Champion!</h3>
              <div class="flex items-center justify-center mt-2">
                <img src="${winner.avatar || "/avatar.png"}" alt="${winner.username}" class="w-12 h-12 rounded-full mr-3">
                <span class="text-xl font-semibold">${winner.username}</span>
              </div>
            </div>
            <div class="text-4xl">🎉</div>
          </div>
        `
        infoContainer.appendChild(winnerBanner)
      }
    }

    const bracketContainer = document.getElementById("tournament-bracket")
    if (!bracketContainer) return
    bracketContainer.innerHTML = (document.querySelector("#translate-tournament-stage")?.textContent) || "Welcome to the Tournament Stage!"

    const rounds: Record<number, any[]> = {}
    matches.forEach((match: any) => {
      if (!rounds[match.round]) rounds[match.round] = []
      rounds[match.round].push(match)
    })

    const bracket = createElement("div", { className: "flex overflow-x-auto" })
    Object.keys(rounds)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((roundNum) => {
        const roundDiv = createElement("div", { className: "mx-4" })
        roundDiv.appendChild(
          createElement("h3", {
            className: "text-xl font-semibold mb-4 text-center",
            textContent: (document.querySelector("#translate-round")?.textContent?.replace("{round}", roundNum.toString())) || `Round ${roundNum}`,
          })
        )

        const matchesDiv = createElement("div", { className: "space-y-4" })
        rounds[roundNum].forEach((match: any) => {
          matchesDiv.appendChild(createMatchCard(match, players))
        })

        roundDiv.appendChild(matchesDiv)
        bracket.appendChild(roundDiv)
      })

    bracketContainer.appendChild(bracket)
  } catch (error) {
    console.error("Error loading tournament details:", error)
    const bracketContainer = document.getElementById("tournament-bracket")
    if (bracketContainer) {
      bracketContainer.innerHTML = `<p class="text-red-500" data-translate="tournament_error_loading">Error loading tournament: ${
        error instanceof Error ? error.message : "Unknown error"
      }</p>`
    }
  }
}

function createMatchCard(match: any, players: any[]) {
  const player1 = players.find((p) => p.id === match.player1_id) || { username: (document.querySelector("#translate-unknown-player")?.textContent) || "Unknown Player", avatar: "/avatar.png" }
  const player2 = players.find((p) => p.id === match.player2_id) || { username: (document.querySelector("#translate-unknown-player")?.textContent) || "Unknown Player", avatar: "/avatar.png" }

  const matchCard = createElement("div", { className: "border rounded p-4 bg-gray-800 min-w-[250px]", "data-match-id": match.id })

  const header = createElement("div", { className: "flex justify-between items-center mb-2" })
  header.appendChild(createElement("h4", { className: "font-semibold", textContent: (document.querySelector("#translate-match")?.textContent?.replace("{match}", match.match_number)) || `Match ${match.match_number}` }))
  const statusBadge = createElement("span", { className: `px-2 py-1 rounded text-xs ${match.status === "completed" ? "bg-green-500" : match.status === "in_progress" ? "bg-yellow-500" : "bg-gray-500"}`, textContent: match.status, "data-translate": `match_status_${match.status}` })
  header.appendChild(statusBadge)
  matchCard.appendChild(header)

  const player1Div = createElement("div", { className: "flex items-center mb-2" })
  player1Div.appendChild(createElement("img", { className: "w-8 h-8 rounded-full mr-2", src: player1.avatar, alt: player1.username }))
  player1Div.appendChild(createElement("span", { className: match.winner_id === player1.id ? "text-green-400" : "", textContent: player1.username }))
  matchCard.appendChild(player1Div)

  matchCard.appendChild(createElement("div", { className: "text-center my-1 text-gray-500", textContent: (document.querySelector("#translate-vs")?.textContent) || "VS" }))

  const player2Div = createElement("div", { className: "flex items-center" })
  player2Div.appendChild(createElement("img", { className: "w-8 h-8 rounded-full mr-2", src: player2.avatar, alt: player2.username }))
  player2Div.appendChild(createElement("span", { className: match.winner_id === player2.id ? "text-green-400" : "", textContent: player2.username }))
  matchCard.appendChild(player2Div)

  if (match.status === "scheduled") {
    const startBtn = createElement("button", { className: "mt-3 w-full py-1 bg-orange-500 text-white rounded hover:bg-orange-600", textContent: (document.querySelector("#translate-start-match")?.textContent) || "Start Match", "data-translate": "match_start_btn" })
    startBtn.addEventListener("click", () => startTournamentPongMatch(match, players))
    matchCard.appendChild(startBtn)
  } else if (match.status === "in_progress") {
    const resultForm = createElement("div", { className: "mt-3" })
    resultForm.innerHTML = `<p class="text-sm text-gray-400 mb-2" data-translate="match_in_progress">Match in progress...</p>`
    const continueBtn = createElement("button", { className: "w-full py-1 bg-blue-500 text-white rounded hover:bg-blue-600", textContent: (document.querySelector("#translate-continue-match")?.textContent) || "Continue Match", "data-translate": "match_continue_btn" })
    continueBtn.addEventListener("click", () => continueTournamentPongMatch(match, players))
    resultForm.appendChild(continueBtn)
    matchCard.appendChild(resultForm)
  }
  return matchCard
}






async function continueTournamentPongMatch(match: any, players: any[]) {
  try {
    const matchid = match.id
    if (!matchid) {
      alert(
        (document.querySelector("#translate-match-id-notfound")?.textContent) ||
        "continueTournamentPongMatch: ID of this Match not found"
      )
      return
    }

    const response = await fetch(`/api/tournaments/matches/${matchid}/continue`, {
      method: "POST",
    })
    if (!response.ok) throw new Error(
      (document.querySelector("#translate-continue-failed")?.textContent) ||
      "continueTournamentPongMatch: Failed to continue match"
    )

    createPongGameDiv(match, players)
  } catch (error) {
    console.error("Error continuing match:", error)
    alert(
      (document.querySelector("#translate-continue-error")?.textContent) ||
      "Error continuing match"
    )
  }
}

async function startTournamentPongMatch(match: any, players: any[]) {
  try {
    const matchid = match.id
    if (!matchid) {
      alert(
        (document.querySelector("#translate-invalid-match")?.textContent) ||
        "Invalid match ID"
      )
      return
    }

    const respnse = await fetch(`/api/tournaments/matches/${matchid}/start`, {
      method: "POST",
    })
    if (!respnse.ok) throw new Error(
      (document.querySelector("#translate-start-failed")?.textContent) ||
      "Failed to start match"
    )

    createPongGameDiv(match, players)
  } catch (error) {
    console.error("Error starting match:", error)
    alert(
      (document.querySelector("#translate-start-error")?.textContent) ||
      "Error starting match"
    )
  }
}

async function createPongGameDiv(match: any, players: any[]) {
  const bracketContainer = document.getElementById("tournament-bracket")
  if (!bracketContainer) return

  const existingGameContainer = document.getElementById("pong-game-container")
  if (existingGameContainer) {
    console.log("Removing existing game container")
    existingGameContainer.remove()
  }

  try {
    const response = await fetch(`/api/tournaments/matches/${match.id}`)
    if (!response.ok) throw new Error(
      (document.querySelector("#translate-fetch-match-failed")?.textContent) ||
      "Failed to fetch match details"
    )
    const latestMatch = await response.json()
    match = latestMatch
  } catch (error) {
    console.error("Error fetching match details:", error)
    alert(
      (document.querySelector("#translate-load-match-error")?.textContent) ||
      "Error loading match details"
    )
    return
  }

  const gameSection = document.createElement("div")
  gameSection.id = "pong-game-container"
  gameSection.className = "mt-12 border-t-2 border-gray-700 pt-8"

  const gameHeader = document.createElement("h2")
  gameHeader.className = "text-2xl font-bold mb-6 text-center"
  gameHeader.textContent =
    (document.querySelector("#translate-active-match")?.textContent) ||
    "🎮 Active Match"
  gameSection.appendChild(gameHeader)

  const container = document.createElement("div")
  container.className = "mx-auto max-w-4xl p-4 bg-gray-900 rounded-lg"
  container.dataset.matchId = match.id.toString()

  const player1 = players.find((p) => p.id === match.player1_id)
  const player2 = players.find((p) => p.id === match.player2_id)

  const matchInfo = document.createElement("div")
  matchInfo.className = "flex justify-between items-center mb-4"
  matchInfo.innerHTML = `
    <div class="flex items-center">
      <img src="${player1?.avatar || '/avatar.png'}" class="w-10 h-10 rounded-full mr-2">
      <span class="font-bold">${player1?.username || (document.querySelector("#translate-player1")?.textContent) || 'Player 1'}</span>
      <div class="mr-2 text-orange-500 font-bold text-right">
        <div data-translate="match_win">W</div>
        <div data-translate="match_score">S</div>
      </div>
    </div>
    <div class="text-xl font-bold" data-translate="vs">VS</div>
    <div class="flex items-center">
      <div class="ml-2 text-orange-500 font-bold">
        <div>🔺</div>
        <div>🔻</div>
      </div>
      <span class="font-bold">${player2?.username || (document.querySelector("#translate-player2")?.textContent) || 'Player 2'}</span>
      <img src="${player2?.avatar || '/avatar.png'}" class="w-10 h-10 rounded-full ml-2">
    </div>
  `
  container.appendChild(matchInfo)

  const timerDiv = document.createElement("div")
  timerDiv.id = "timer"
  timerDiv.className = "text-center text-xl font-bold mb-4"
  container.appendChild(timerDiv)

  const canvas = document.createElement("canvas")
  canvas.id = `pong-game-${match.id}`
  canvas.className = "pong-game-canvas bg-gray-800 rounded mx-auto"
  canvas.width = 800
  canvas.height = 500
  container.appendChild(canvas)

  const controls = document.createElement("div")
  controls.className = "flex justify-center gap-4 mt-4"

  const startButton = document.createElement("button")
  startButton.id = "startBtn"
  startButton.className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
  startButton.textContent =
    match.status === "in_progress"
      ? (document.querySelector("#translate-resume-game")?.textContent) || "Resume Game"
      : (document.querySelector("#translate-start-game")?.textContent) || "Start Game"

  const pauseButton = document.createElement("button")
  pauseButton.id = "pauseBtn"
  pauseButton.className = "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
  pauseButton.textContent = (document.querySelector("#translate-pause")?.textContent) || "Pause"
  pauseButton.style.display = "none"

  const stopButton = document.createElement("button")
  stopButton.id = "stopBtn"
  stopButton.className = "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
  stopButton.textContent = (document.querySelector("#translate-end-game")?.textContent) || "End Game"
  stopButton.style.display = "none"

  controls.appendChild(startButton)
  controls.appendChild(pauseButton)
  controls.appendChild(stopButton)
  container.appendChild(controls)

  gameSection.appendChild(container)
  bracketContainer.parentElement?.appendChild(gameSection)

  initializePongGameUI(match)

  if (match.status === "in_progress") {
    const ctx = canvas.getContext("2d")
    if (ctx) startPongGame(canvas, ctx, match)
  }

  gameSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export async function recordMatchResult(matchId: number, winnerId: string) {
  try {
    console.log(`Recording match result: Match ${matchId}, Winner: ${winnerId}`)

    const response = await fetch(`/api/tournaments/matches/${matchId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("API Error:", errorData)
      throw new Error(
        (document.querySelector("#translate-record-failed")?.textContent) ||
        `Failed to record result: ${errorData.error || response.statusText}`
      )
    }

    const result = await response.json()
    console.log("Match result response:", result)

    if (result.tournamentComplete) {
      alert(
        (document.querySelector("#translate-tournament-complete")?.textContent)?.replace("{winner}", result.tournamentWinner) ||
        `🏆 Tournament Complete! Winner: Player ${result.tournamentWinner}! 🎉`
      )
    } else {
      alert((document.querySelector("#translate-match-recorded")?.textContent) || "Match result recorded successfully!")
    }

    const container = document.querySelector("[data-tournament-id]") as HTMLElement
    if (container) {
      const tournamentId = container.getAttribute("data-tournament-id")
      if (tournamentId) viewTournament(parseInt(tournamentId))
    }
  } catch (error) {
    console.error("Error recording match result:", error)
    alert(
      (document.querySelector("#translate-record-error")?.textContent) ||
      `Error recording result: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

