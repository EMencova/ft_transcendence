import { currentUser } from "../logic/auth"

export function TetrisView(push = true, container?: HTMLElement) {
    const target = container || document.getElementById("mainContent")
    if (!target) return

    const recordHtml = currentUser
        ? `<span id="tetrisRecord" class="text-white mt-4">Record: 0</span>`
        : `<span id="tetrisRecord" class="text-white mt-4 text-sm italic">If you want to save your record, please log in.</span>`

    target.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 mt-6">🕹️ Tetris</h2>
       <div id="tetrisGame" class="border border-gray-500 p-4 flex flex-col items-center mx-auto max-w-4xl">
            <button id="startTetrisBtn" class="mb-6 w-48 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-lg">Start Game</button>
            <div class="flex justify-center w-full">
                <canvas id="tetrisCanvas" class="border border-gray-700 bg-gray-900"></canvas>
                <div id="tetrisScoreboard" class="flex flex-col items-start ml-4">
                    <span id="tetrisScore" class="text-white mt-4">Score: 0</span>
                    ${recordHtml}
                    <div class="flex justify-center text-center space-x-4 mt-4">
                        <button id="pauseBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled>Pause</button>
                        <button id="resetBtn" class="w-24 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 opacity-50 cursor-not-allowed" disabled>Reset</button>
                    </div>
                </div>
            </div>
        </div>
    `
    initTetrisGame()
    if (push && !container) history.pushState({ page: "tetris" }, "", "/tetris")
}

function initTetrisGame() {
    // Initialize the Tetris game canvas
    const canvas = document.getElementById("tetrisCanvas") as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const BLOCK_SIZE = 20
    const BOARD_WIDTH = 14
    const BOARD_HEIGHT = 30
    canvas.width = BOARD_WIDTH * BLOCK_SIZE
    canvas.height = BOARD_HEIGHT * BLOCK_SIZE

    ctx.scale(BLOCK_SIZE, BLOCK_SIZE)

    // Board representation
    let board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
    // // to test, draw in last row [1,1,1,1,1,1,1,1,1,0,0,1,1,1]
    // board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1)
    // board[BOARD_HEIGHT - 1][9] = 0
    // board[BOARD_HEIGHT - 1][10] = 0

    let score = 0

    let paused = false
    let started = false
    let animationId: number | null = null

    // Piece representation
    const pieces = [
        [[1, 1, 1, 1]], // I piece
        [[1, 1], [1, 1]], // O piece
        [[0, 1, 0], [1, 1, 1]], // T piece
        [[1, 1, 0], [0, 1, 1]], // S piece
        [[0, 1, 1], [1, 1, 0]], // Z piece
        [[1, 1, 1], [0, 0, 1]], // L piece  
        [[1, 1, 1], [1, 0, 0]], // J piece
    ]

    const piece = {
        position: { x: 5, y: 5 },
        shape: [[1, 1], [1, 1]], // I piece
    }

    // // Game loop
    // function update() {
    //     draw()
    //     window.requestAnimationFrame(update)
    // }


    // Game loop with autodrop
    let dropInterval = 0
    let lastTime = 0
    function update(time = 0) {
        if (!started || paused) return
        const deltaTime = time - lastTime
        dropInterval += deltaTime
        if (dropInterval > 1000) { // 1 second
            piece.position.y++
            if (checkCollision()) {
                piece.position.y--
                solidify()
                clearLines()
            }
            dropInterval = 0
        }
        lastTime = time
        draw()
        animationId = window.requestAnimationFrame(update)
    }


    function draw() {
        // Draw the Tetris pieces
        if (!ctx) return
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 1) {
                    ctx.fillStyle = "yellow"
                    ctx.fillRect(x, y, 1, 1)
                }
            })
        })

        // Draw the current piece
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell === 1) {
                    ctx.fillStyle = "red"
                    ctx.fillRect(piece.position.x + dx, piece.position.y + dy, 1, 1)
                }
            })
        })
    }

    // Move the piece
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            piece.position.x--
            if (checkCollision()) piece.position.x++ // Undo if collision
        }
        else if (e.key === "ArrowRight") {
            piece.position.x++
            if (checkCollision()) piece.position.x-- // Undo if collision
        }
        else if (e.key === "ArrowDown") {
            piece.position.y++
            if (checkCollision()) {
                piece.position.y-- // Undo if collision
                solidify() // Solidify the piece
                clearLines() // Clear completed lines
            }
        }
        else if (e.key === "ArrowUp") {
            // Rotate the piece
            const rotatedShape = piece.shape[0].map((_, index) =>
                piece.shape.map(row => row[index]).reverse()
            )
            const previousShape = piece.shape
            piece.shape = rotatedShape
            if (checkCollision()) {
                // Undo rotation if collision
                piece.shape = previousShape
            }
        }
    })

    function checkCollision() {
        return piece.shape.find((row, dy) => {
            return row.find((cell, dx) => {
                return (
                    cell !== 0 &&
                    board[piece.position.y + dy]?.[piece.position.x + dx] !== 0
                )
            })
        })
    }

    function solidify() {
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell === 1) {
                    board[piece.position.y + dy][piece.position.x + dx] = 1
                }
            })
        })
        // Randomly select a new piece
        const randomIndex = Math.floor(Math.random() * pieces.length)
        piece.shape = pieces[randomIndex]
        piece.position = { x: 5, y: 0 } // Reset the piece position

        // Check for game over
        if (checkCollision()) {
            alert("Game Over!")
            // Reset the board
            for (let y = 0;y < BOARD_HEIGHT;y++) {
                board[y] = Array(BOARD_WIDTH).fill(0)
            }
        }
    }

    function updateScore() {
        const scoreElem = document.getElementById("tetrisScore")
        if (scoreElem) scoreElem.textContent = `Score: ${score}`
    }

    function clearLines() {
        for (let y = BOARD_HEIGHT - 1;y >= 0;y--) {
            if (board[y].every((cell) => cell !== 0)) {
                // Remove the line
                board.splice(y, 1)
                // Add a new empty line at the top
                board.unshift(Array(BOARD_WIDTH).fill(0))
                y++ // Adjust the index to account for the removed line
                score += 10 // Increment score
                updateScore() // Update the score display
            }
        }
    }

    // Pause, Reset and Start button logic
    const pauseBtn = document.getElementById("pauseBtn")
    const resetBtn = document.getElementById("resetBtn")
    const startBtn = document.getElementById("startTetrisBtn")

    if (pauseBtn) {
        pauseBtn.onclick = () => {
            paused = !paused
            pauseBtn.textContent = paused ? "Resume" : "Pause"
            if (!paused) {
                lastTime = performance.now()
                animationId = window.requestAnimationFrame(update)
            }
        }
    }

    resetBtn?.addEventListener("click", () => {
        resetBtn.onclick = () => {
            // Reset board and score
            for (let y = 0;y < BOARD_HEIGHT;y++) {
                board[y] = Array(BOARD_WIDTH).fill(0)
            }
            score = 0
            updateScore()
            piece.shape = pieces[Math.floor(Math.random() * pieces.length)]
            piece.position = { x: 5, y: 0 }
            paused = false
            if (pauseBtn) pauseBtn.textContent = "Pause"
            lastTime = performance.now()
            if (animationId) cancelAnimationFrame(animationId)
            animationId = window.requestAnimationFrame(update)
        }
    })

    // if (startBtn) {
    //     startBtn.onclick = () => {
    //         if (started) {
    //             started = false
    //             paused = false
    //             startBtn.textContent = "Start Game"
    //             if (animationId) cancelAnimationFrame(animationId)
    //             board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
    //             score = 0
    //             updateScore()
    //             piece.shape = pieces[Math.floor(Math.random() * pieces.length)]
    //             piece.position = { x: 5, y: 0 }
    //             ctx.clearRect(0, 0, canvas.width, canvas.height)
    //             if (pauseBtn) {
    //                 (pauseBtn as HTMLButtonElement).disabled = true
    //                 pauseBtn.classList.remove("opacity-50", "cursor-not-allowed")
    //                 pauseBtn.textContent = "Pause"
    //             }
    //             if (resetBtn) {
    //                 (resetBtn as HTMLButtonElement).disabled = true
    //                 resetBtn.classList.remove("opacity-50", "cursor-not-allowed")
    //             }
    //         } else {
    //             started = true
    //             paused = false
    //             startBtn.textContent = "Stop Game"
    //             if (pauseBtn) {
    //                 (pauseBtn as HTMLButtonElement).disabled = false
    //                 pauseBtn.classList.remove("opacity-50", "cursor-not-allowed")
    //             }
    //             if (resetBtn) {
    //                 (resetBtn as HTMLButtonElement).disabled = false
    //                 resetBtn.classList.remove("opacity-50", "cursor-not-allowed")
    //             }
    //             (startBtn as HTMLButtonElement).disabled = true
    //             lastTime = performance.now()
    //             animationId = window.requestAnimationFrame(update)
    //         }
    //     }
    // }

    if (startBtn) {
        startBtn.onclick = () => {
            if (!started) {
                // Iniciar el juego
                started = true
                paused = false
                startBtn.textContent = "Stop Game"
                if (pauseBtn) {
                    (pauseBtn as HTMLButtonElement).disabled = false
                    pauseBtn.classList.remove("opacity-50", "cursor-not-allowed")
                }
                if (resetBtn) {
                    (resetBtn as HTMLButtonElement).disabled = false
                    resetBtn.classList.remove("opacity-50", "cursor-not-allowed")
                }
                lastTime = performance.now()
                animationId = window.requestAnimationFrame(update)
            } else {
                // Stop the game
                started = false
                paused = false
                startBtn.textContent = "Start Game"
                if (animationId) cancelAnimationFrame(animationId)
                // Clean board and score
                for (let y = 0;y < BOARD_HEIGHT;y++) {
                    board[y] = Array(BOARD_WIDTH).fill(0)
                }
                score = 0
                updateScore()
                piece.shape = pieces[Math.floor(Math.random() * pieces.length)]
                piece.position = { x: 5, y: 0 }
                // Clean canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                // Disable buttons
                if (pauseBtn) {
                    (pauseBtn as HTMLButtonElement).disabled = true
                    pauseBtn.classList.add("opacity-50", "cursor-not-allowed")
                    pauseBtn.textContent = "Pause"
                }
                if (resetBtn) {
                    (resetBtn as HTMLButtonElement).disabled = true
                    resetBtn.classList.add("opacity-50", "cursor-not-allowed")
                }
            }
        }
    }
    // Disable buttons initially
    if (pauseBtn) (pauseBtn as HTMLButtonElement).disabled = true
    if (resetBtn) (resetBtn as HTMLButtonElement).disabled = true

    update()
}