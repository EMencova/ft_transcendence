import { saveTetrisScore } from "../views/othergames/TetrisHistoryView"
import { handleTournamentGameOver, updateTournamentProgress } from "../views/othergames/TetrisTournamentView"
import { currentUser } from "./auth"

interface TetrisGameConfig {
	canvasId?: string
	scoreId?: string
	levelId?: string
	startButtonId?: string
	pauseButtonId?: string
	resetButtonId?: string
	keyControls?: {
		left: string
		right: string
		down: string
		rotate: string
	}
	saveScore?: boolean
	tournamentMode?: boolean
	showAlerts?: boolean
	onScoreUpdate?: (score: number, level: number, lines: number) => void
	onGameOver?: (finalScore: number, finalLevel: number, finalLines: number) => void
}

export function initTetrisGame(config: TetrisGameConfig = {}) {
	// Default configuration
	const defaultConfig = {
		canvasId: "tetrisCanvas",
		scoreId: "tetrisScore",
		levelId: "tetrisLevel",
		startButtonId: "startTetrisBtn",
		pauseButtonId: "pauseBtn",
		resetButtonId: "resetBtn",
		keyControls: {
			left: "ArrowLeft",
			right: "ArrowRight",
			down: "ArrowDown",
			rotate: "ArrowUp"
		},
		saveScore: true,
		tournamentMode: false,
		showAlerts: true,
		onScoreUpdate: undefined as ((score: number, level: number, lines: number) => void) | undefined,
		onGameOver: undefined as ((finalScore: number, finalLevel: number, finalLines: number) => void) | undefined
	}

	// Merge provided config with defaults
	const finalConfig = { ...defaultConfig, ...config }
	if (config.keyControls) {
		finalConfig.keyControls = { ...defaultConfig.keyControls, ...config.keyControls }
	}

    // Initialize the Tetris game canvas
	const canvas = document.getElementById(finalConfig.canvasId) as HTMLCanvasElement
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
    let level = 1
    let linesCleared = 0

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

    // Colors for each piece type (traditional Tetris colors)
    const pieceColors = [
        "#00FFFF", // I piece - Cyan
        "#FFFF00", // O piece - Yellow
        "#800080", // T piece - Purple
        "#00FF00", // S piece - Green
        "#FF0000", // Z piece - Red
        "#FFA500", // L piece - Orange
        "#0000FF", // J piece - Blue
    ]

    const piece = {
        position: { x: 5, y: 5 },
        shape: [[1, 1], [1, 1]], // O piece (default)
        typeIndex: 1, // Index to track which piece type it is
    }

    // Initialize with a random piece
    const initialRandomIndex = Math.floor(Math.random() * pieces.length)
    piece.shape = pieces[initialRandomIndex]
    piece.typeIndex = initialRandomIndex
    piece.position = { x: 5, y: 0 }

    // // Game loop
    // function update() {
    //     draw()
    //     window.requestAnimationFrame(update)
    // }


    // Game loop with autodrop
    let dropInterval = 0
    let lastTime = 0

    // Calculate drop speed based on level (starts at 1000ms, decreases by 50ms per level, minimum 100ms)
    function getDropSpeed() {
        return Math.max(100, 1000 - (level - 1) * 50)
    }

    function update(time = 0) {
        if (!started || paused) return
        const deltaTime = time - lastTime
        dropInterval += deltaTime
        const currentDropSpeed = getDropSpeed()

        if (dropInterval > currentDropSpeed) {
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

        // Draw placed pieces on the board
        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell > 0) {
                    // Use the piece color based on the stored type index
                    ctx.fillStyle = pieceColors[cell - 1] || "#FFFFFF"
                    ctx.fillRect(x, y, 1, 1)

                    // Add a subtle border for better visibility
                    ctx.strokeStyle = "#333333"
                    ctx.lineWidth = 0.05
                    ctx.strokeRect(x, y, 1, 1)
                }
            })
        })

        // Draw the current falling piece
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell === 1) {
                    ctx.fillStyle = pieceColors[piece.typeIndex]
                    ctx.fillRect(piece.position.x + dx, piece.position.y + dy, 1, 1)

                    // Add border to current piece too
                    ctx.strokeStyle = "#333333"
                    ctx.lineWidth = 0.05
                    ctx.strokeRect(piece.position.x + dx, piece.position.y + dy, 1, 1)
                }
            })
        })
    }

    // Move the piece
    const handleKeyDown = (e: KeyboardEvent) => {
        // Only prevent default and handle game controls when the game is started
        if (!started) return

        // Prevent page scrolling when using arrow keys during gameplay
		if (Object.values(finalConfig.keyControls).includes(e.key)) {
            e.preventDefault()
        }

		if (e.key === finalConfig.keyControls.left) {
            piece.position.x--
            if (checkCollision()) piece.position.x++ // Undo if collision
        }
		else if (e.key === finalConfig.keyControls.right) {
            piece.position.x++
            if (checkCollision()) piece.position.x-- // Undo if collision
        }
		else if (e.key === finalConfig.keyControls.down) {
            piece.position.y++
            if (checkCollision()) {
                piece.position.y-- // Undo if collision
                solidify() // Solidify the piece
                clearLines() // Clear completed lines
            } else {
                // Add soft drop bonus points
                score += 1
                updateScore()
            }
        }
		else if (e.key === finalConfig.keyControls.rotate) {
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
    }

    document.addEventListener("keydown", handleKeyDown)

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
                    // Store the piece type index + 1 (so 0 remains empty)
                    board[piece.position.y + dy][piece.position.x + dx] = piece.typeIndex + 1
                }
            })
        })

        // Add points for placing a piece
        score += level
        updateScore()

        // Randomly select a new piece
        const randomIndex = Math.floor(Math.random() * pieces.length)
        piece.shape = pieces[randomIndex]
        piece.typeIndex = randomIndex
        piece.position = { x: 5, y: 0 } // Reset the piece position

        // Check for game over
        if (checkCollision()) {
            handleGameOver()
        }
    }

    function updateScore() {
		const scoreElem = document.getElementById(finalConfig.scoreId)
		const levelElem = document.getElementById(finalConfig.levelId)
        if (scoreElem) scoreElem.textContent = `Score: ${score}`
        if (levelElem) levelElem.textContent = `Level: ${level}`

        // Update tournament progress if in tournament mode
		if (finalConfig.tournamentMode) {
			updateTournamentProgress(score, level, linesCleared)
		}

		// Call custom score update callback if provided
		if (finalConfig.onScoreUpdate) {
			finalConfig.onScoreUpdate(score, level, linesCleared)
		}
    }

    function updateLevel() {
        const newLevel = Math.floor(linesCleared / 10) + 1
        if (newLevel > level) {
            level = newLevel
            updateScore() // Update the display

            // Visual feedback for level up
			const levelElem = document.getElementById(finalConfig.levelId)
            if (levelElem) {
                levelElem.classList.add("text-yellow-300")
                setTimeout(() => {
                    levelElem.classList.remove("text-yellow-300")
                }, 1000)
            }
        }
    }

    function clearLines() {
        let clearedLinesCount = 0
        for (let y = BOARD_HEIGHT - 1;y >= 0;y--) {
            if (board[y].every((cell) => cell !== 0)) {
                // Remove the line
                board.splice(y, 1)
                // Add a new empty line at the top
                board.unshift(Array(BOARD_WIDTH).fill(0))
                y++ // Adjust the index to account for the removed line
                clearedLinesCount++
            }
        }

        if (clearedLinesCount > 0) {
            // Update lines cleared counter
            linesCleared += clearedLinesCount

            // Calculate score based on number of lines cleared at once (bonus for multiple lines)
            const lineScores = [0, 40, 100, 300, 1200] // Points for 0, 1, 2, 3, 4 lines
            const baseScore = lineScores[Math.min(clearedLinesCount, 4)]
            score += baseScore * level // Multiply by level for bonus

            updateScore() // Update the score display
            updateLevel() // Check if level should increase
        }
    }

    async function handleGameOver() {
        // Stop the game
        started = false
        paused = false
        if (animationId) cancelAnimationFrame(animationId)

		// Call onGameOver callback if provided (before any processing)
		if (finalConfig.onGameOver) {
			finalConfig.onGameOver(score, level, linesCleared)
		}

		// Handle tournament game over if in tournament mode
		if (finalConfig.tournamentMode) {
			handleTournamentGameOver()
		}

		// Save score if user is logged in and saving is enabled
        let savedMessage = ""
		if (finalConfig.saveScore && currentUser && score > 0) {
            const saved = await saveTetrisScore(score, level, linesCleared)
            if (saved) {
                savedMessage = "\nScore saved to your history!"
                // Update the record display if this score beats the current record
                await updateRecordDisplay()
            } else {
                savedMessage = "\nFailed to save score."
            }
        }

		if (finalConfig.showAlerts) {
			alert(`Game Over!${savedMessage}\nFinal Score: ${score}\nLevel Reached: ${level}\nLines Cleared: ${linesCleared}`)
		}

        // Reset the board
        for (let y = 0;y < BOARD_HEIGHT;y++) {
            board[y] = Array(BOARD_WIDTH).fill(0)
        }
        score = 0
        level = 1
        linesCleared = 0

        // Reset piece with new random type
        const randomIndex = Math.floor(Math.random() * pieces.length)
        piece.shape = pieces[randomIndex]
        piece.typeIndex = randomIndex
        piece.position = { x: 5, y: 0 }

        updateScore()

        // Reset UI
		const startBtn = document.getElementById(finalConfig.startButtonId)
		const pauseBtn = document.getElementById(finalConfig.pauseButtonId)
		const resetBtn = document.getElementById(finalConfig.resetButtonId)

        if (startBtn) startBtn.textContent = "Start Game"
        if (pauseBtn) {
            (pauseBtn as HTMLButtonElement).disabled = true
            pauseBtn.classList.add("opacity-50", "cursor-not-allowed")
            pauseBtn.textContent = "Pause"
        }
        if (resetBtn) {
            (resetBtn as HTMLButtonElement).disabled = true
            resetBtn.classList.add("opacity-50", "cursor-not-allowed")
        }

        // Clear canvas
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // Cleanup function to remove event listeners when the game ends or component unmounts
    // function cleanup() {
    //     document.removeEventListener("keydown", handleKeyDown)
    //     if (animationId) cancelAnimationFrame(animationId)
    // }

    async function updateRecordDisplay() {
        const recordEl = document.getElementById("tetrisRecord")
        if (!recordEl || !currentUser) return

        try {
            // This would typically fetch the latest record from the backend
            // For now, we'll just update with the current score if it seems to be a new record
            const currentRecord = parseInt(recordEl.textContent?.replace("Record: ", "") || "0")
            if (score > currentRecord) {
                recordEl.textContent = `Record: ${score}`
            }
        } catch (error) {
            console.error('Failed to update record display:', error)
        }
    }

    // Pause, Reset and Start button logic
	const pauseBtn = document.getElementById(finalConfig.pauseButtonId)
	const resetBtn = document.getElementById(finalConfig.resetButtonId)
	const startBtn = document.getElementById(finalConfig.startButtonId)

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
            level = 1
            linesCleared = 0
            updateScore()

            // Reset piece with new random type
            const randomIndex = Math.floor(Math.random() * pieces.length)
            piece.shape = pieces[randomIndex]
            piece.typeIndex = randomIndex
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

                // Focus on canvas to ensure keyboard events work properly
                canvas.focus()
                canvas.tabIndex = 0 // Make canvas focusable

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
                level = 1
                linesCleared = 0
                updateScore()

                // Reset piece with new random type
                const randomIndex = Math.floor(Math.random() * pieces.length)
                piece.shape = pieces[randomIndex]
                piece.typeIndex = randomIndex
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

	// Return control methods for external use
	return {
		startGame: () => {
			if (!started) {
				started = true
				paused = false
				if (startBtn) startBtn.textContent = "Stop Game"
				if (pauseBtn) {
					(pauseBtn as HTMLButtonElement).disabled = false
					pauseBtn.classList.remove("opacity-50", "cursor-not-allowed")
				}
				if (resetBtn) {
					(resetBtn as HTMLButtonElement).disabled = false
					resetBtn.classList.remove("opacity-50", "cursor-not-allowed")
				}
				canvas.focus()
				canvas.tabIndex = 0
				lastTime = performance.now()
				animationId = window.requestAnimationFrame(update)
			}
		},
		stopGame: () => {
			if (started) {
				started = false
				paused = false
				if (startBtn) startBtn.textContent = "Start Game"
				if (animationId) cancelAnimationFrame(animationId)
				animationId = null
				// Reset scores
				board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
				score = 0
				level = 1
				linesCleared = 0
				updateScore()
				piece.shape = pieces[Math.floor(Math.random() * pieces.length)]
				piece.position = { x: 5, y: 0 }
				ctx.clearRect(0, 0, canvas.width, canvas.height)
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
		},
		isRunning: () => started && !paused
	}
}
