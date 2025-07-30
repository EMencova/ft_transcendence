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

	async joinExistingMatch(opponentId: string, mode: string, playType: 'simultaneous' | 'turn_based' = 'simultaneous'): Promise<{ success: boolean; matchId?: string }> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		console.log('Joining existing match with:', {
			player_id: currentUserId,
			target_player_id: opponentId,
			play_type: playType
		})
		console.log('DEBUG: playType parameter value:', playType)
		console.log('DEBUG: playType type:', typeof playType)

		try {
			const payload = {
				player_id: currentUserId,
				target_player_id: opponentId,
				play_type: playType
			}
			console.log('DEBUG: Sending payload:', JSON.stringify(payload, null, 2))

			const response = await apiService.post('/tetris-matchmaking/join-match', payload)

			console.log('Join match response:', response)

			if (response.success) {
				this.currentMatchId = response.matchId

				// For simultaneous play, start the tournament immediately
				if (playType === 'simultaneous') {
					setTimeout(() => {
						this.emit('tournament_start', {
							matchId: response.matchId,
							opponent: response.opponent,
							mode: mode
						})
					}, 500)
				}
				// For turn-based play, just confirm the match creation
				else {
					console.log('Turn-based match created, waiting for turns')
				}
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

	async verifyOpponentPassword(opponentId: string, password: string): Promise<{ valid: boolean; message: string }> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.post('/tetris-matchmaking/verify-password', {
				target_player_id: opponentId,
				password: password
			})

			return {
				valid: response.valid,
				message: response.message
			}
		} catch (error) {
			console.error('Error verifying password:', error)
			throw error
		}
	}

	async getPendingMatches(): Promise<any[]> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.get(`/tetris-matchmaking/pending-matches/${currentUserId}`)
			return response.matches || []
		} catch (error) {
			console.error('Error getting pending matches:', error)
			throw error
		}
	}

	async completeTurn(matchId: string, score: number, level: number, lines: number): Promise<{ success: boolean; matchCompleted: boolean }> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.post(`/tetris-matchmaking/match/${matchId}/complete-turn`, {
				player_id: currentUserId,
				score: score,
				level: level,
				lines: lines
			})

			return {
				success: response.success,
				matchCompleted: response.matchCompleted
			}
		} catch (error) {
			console.error('Error completing turn:', error)
			throw error
		}
	}

	async leaveQueue(): Promise<void> {
		if (!currentUserId) return

		this.stopPolling()
		await apiService.delete(`/tetris-matchmaking/queue/${currentUserId}`, { skipContentType: true })
	}

	async getQueueStatus(): Promise<any> {
		const response = await apiService.get('/tetris-matchmaking/queue')
		return response
	}

	async getMatchmakingStatus(): Promise<any> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.get(`/tetris-matchmaking/status/${currentUserId}`)
			return response
		} catch (error) {
			console.error('Error getting matchmaking status:', error)
			throw error
		}
	}

	async respondToMatch(matchId: string, response: 'accept' | 'decline'): Promise<any> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const result = await apiService.post(`/tetris-matchmaking/match/${matchId}/response`, {
				player_id: currentUserId,
				response: response
			})

			if (response === 'accept') {
				this.currentMatchId = matchId
			}

			return result
		} catch (error) {
			console.error('Error responding to match:', error)
			throw error
		}
	}

	// Update match progress (used for local multiplayer)
	async updateMatchProgress(matchId: string, progress: any): Promise<any> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.post(`/tetris-matchmaking/match/${matchId}/progress`, {
				player_id: currentUserId,
				...progress
			})
			return response
		} catch (error) {
			console.error('Error updating match progress:', error)
			throw error
		}
	}

	// Get current match information
	async getMatchInfo(matchId: string): Promise<any> {
		try {
			const response = await apiService.get(`/tetris-matchmaking/match/${matchId}`)
			return response
		} catch (error) {
			console.error('Error getting match info:', error)
			throw error
		}
	}

	// Submit turn result for turn-based matches
	async submitTurnResult(matchId: string, results: { score: number; level: number; lines: number }): Promise<any> {
		if (!currentUserId) {
			throw new Error('User not logged in')
		}

		try {
			const response = await apiService.post(`/tetris-matchmaking/match/${matchId}/turn`, {
				player_id: currentUserId,
				score: results.score,
				level: results.level,
				lines: results.lines,
				completed_at: new Date().toISOString()
			})
			return response
		} catch (error) {
			console.error('Error submitting turn result:', error)
			throw error
		}
	}
}

// Create and export the singleton instance
export const tetrisMatchmakingService = new TetrisMatchmakingService()

// Also export the class for potential future use
export { TetrisMatchmakingService }
