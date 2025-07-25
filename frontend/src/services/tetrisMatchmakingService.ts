import { currentUserId } from '../logic/auth'
import { apiService } from '../services/apiService'

class TetrisMatchmakingService {
	private listeners: Map<string, Function[]> = new Map()
	private pollingInterval: number | null = null
	private currentMatchId: string | null = null

	constructor() {
		// For local multiplayer, we don't need WebSocket
		// We'll use polling for match updates
	}

	// Event listener management
	on(event: string, callback: Function) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, [])
		}
		this.listeners.get(event)!.push(callback)
	}

	off(event: string, callback: Function) {
		const listeners = this.listeners.get(event)
		if (listeners) {
			const index = listeners.indexOf(callback)
			if (index > -1) {
				listeners.splice(index, 1)
			}
		}
	}

	private emit(event: string, data: any) {
		const listeners = this.listeners.get(event) || []
		listeners.forEach(listener => {
			try {
				listener(data)
			} catch (error) {
				console.error('Error in event listener:', error)
			}
		})
	}

	private stopPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = null
		}
	}

	// Getter for current match ID
	getCurrentMatchId(): string | null {
		return this.currentMatchId
	}

	// Matchmaking API methods
	async joinQueue(mode: string): Promise<{ skillLevel: number; matchFound: any }> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		console.log('Joining queue with:', { player_id: currentUserId, mode })

		try {
			const response = await apiService.post('/tetris-matchmaking/queue', {
				player_id: currentUserId,
				mode: mode
			})

			console.log('Queue response:', response)

			// If match was found immediately (automatic matchmaking)
			if (response.matchFound) {
				this.currentMatchId = response.matchFound.matchId

				// Emit match found event
				setTimeout(() => {
					this.emit('match_found', {
						matchId: response.matchFound.matchId,
						opponent: response.matchFound.opponent,
						mode: mode
					})
				}, 100)
			}
			// Note: We no longer start polling here since users create matches 
			// and wait for others to join them manually

			return {
				skillLevel: response.skillLevel,
				matchFound: !!response.matchFound
			}
		} catch (error) {
			console.error('Error joining queue:', error)
			throw error
		}
	}

	async joinExistingMatch(opponentId: string, mode: string): Promise<{ success: boolean; matchId?: string }> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		console.log('Joining existing match:', { opponentId, mode })

		try {
			const response = await apiService.post('/tetris-matchmaking/join-match', {
				player_id: currentUserId,
				target_player_id: opponentId,
				mode: mode
			})

			console.log('Join match response:', response)

			if (response.success && response.matchId) {
				this.currentMatchId = response.matchId

				// Emit match found event immediately since we're joining an existing match
				setTimeout(() => {
					this.emit('match_found', {
						matchId: response.matchId,
						opponent: response.opponent || { username: 'Opponent' },
						mode: mode
					})
				}, 100)

				// Then emit tournament start
				setTimeout(() => {
					this.emit('tournament_start', {
						matchId: response.matchId,
						opponent: response.opponent || { username: 'Opponent' },
						mode: mode
					})
				}, 500)
			}

			return {
				success: response.success,
				matchId: response.matchId
			}
		} catch (error) {
			console.error('Error joining existing match:', error)
			throw error
		}
	}

	async leaveQueue(): Promise<void> {
		if (!currentUserId) return

		this.stopPolling()
		await apiService.delete(`/tetris-matchmaking/queue/${currentUserId}`)
	}

	async getQueueStatus(): Promise<any> {
		const response = await apiService.get('/tetris-matchmaking/queue')
		return response
	}

	async getMatchmakingStatus(): Promise<any> {
		if (!currentUserId) {
			return { status: 'idle' }
		}

		console.log('Getting matchmaking status for user:', currentUserId)

		try {
			const response = await apiService.get(`/tetris-matchmaking/status/${currentUserId}`)
			console.log('Matchmaking status response:', response)
			return response
		} catch (error) {
			console.error('Error getting matchmaking status:', error)
			return { status: 'idle', skillLevel: 'unknown' }
		}
	}

	async respondToMatch(matchId: string, response: 'accept' | 'decline'): Promise<void> {
		if (!currentUserId) return

		await apiService.post(`/tetris-matchmaking/match/${matchId}/response`, {
			player_id: currentUserId,
			response: response
		})

		// For local multiplayer, automatically start the tournament after accepting
		if (response === 'accept') {
			// Emit tournament start event for local multiplayer
			setTimeout(() => {
				this.emit('tournament_start', {
					matchId: matchId,
					opponent: { username: 'Local Player 2' }, // Placeholder for local opponent
					mode: 'local'
				})
			}, 500)
		}
	}

	async updateMatchProgress(matchId: string, score: number, level: number, lines: number, isGameOver = false): Promise<void> {
		if (!currentUserId) return

		await apiService.post(`/tetris-matchmaking/match/${matchId}/progress`, {
			player_id: currentUserId,
			score: score,
			level: level,
			lines: lines,
			isGameOver: isGameOver
		})
	}

	async getMatchStatus(matchId: string): Promise<any> {
		const response = await apiService.get(`/tetris-matchmaking/match/${matchId}`)
		return response
	}

	// Method to manually end a match (for local multiplayer)
	endMatch(matchId: string, winnerId?: string, finalStats?: any) {
		console.log(`Match ${matchId} ended`)
		this.currentMatchId = null
		this.stopPolling()

		this.emit('tournament_end', {
			winner: winnerId || null,
			isWinner: winnerId === String(currentUserId),
			finalStats: finalStats || { player: { score: 0, lines: 0 }, opponent: { score: 0, lines: 0 } }
		})
	}

	// Cleanup
	disconnect() {
		this.stopPolling()
		this.listeners.clear()
		this.currentMatchId = null
	}
}

// Singleton instance
export const tetrisMatchmakingService = new TetrisMatchmakingService()

// Clean up on page unload
window.addEventListener('beforeunload', () => {
	tetrisMatchmakingService.disconnect()
})
