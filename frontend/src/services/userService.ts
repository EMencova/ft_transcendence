// User service for handling all user-related API calls
import { currentUserId, updateCurrentAvatar, updateCurrentUser } from '../logic/auth'
import { apiService } from './apiService'

export interface UpdateProfileData {
	username: string
	email: string
	userId?: number
}

export interface UpdateProfileResponse {
	message: string
}

export interface UpdateAvatarResponse {
	message: string
	avatar: string
}

export interface UserProfile {
	id: number
	username: string
	email: string
	avatar?: string
	wins?: number
	losses?: number
	rank?: string
}

class UserService {
	// Get user profile data
	async getProfile(userId: number): Promise<UserProfile> {
		return apiService.get<UserProfile>(`/profile/${userId}`)
	}

	// Get user game history
	async getGameHistory(userId: number): Promise<{ games: any[] }> {
		return apiService.get<{ games: any[] }>(`/profile/${userId}/games`)
	}

	// Friends methods
	async getFriends(userId: number): Promise<{ friends: any[] }> {
		return apiService.get<{ friends: any[] }>(`/friends/${userId}`)
	}

	async getFriendRequests(userId: number): Promise<{ requests: any[] }> {
		return apiService.get<{ requests: any[] }>(`/friends/${userId}/requests`)
	}

	async searchPlayers(userId: number, query: string): Promise<{ players: any[] }> {
		return apiService.get<{ players: any[] }>(`/players/search/${userId}?q=${encodeURIComponent(query)}`)
	}

	async sendFriendRequest(friendId: number): Promise<{ message: string }> {
		return apiService.post(`/friends/${friendId}`, { userId: currentUserId })
	}

	async acceptFriendRequest(friendId: number): Promise<{ message: string }> {
		return apiService.post(`/friends/${friendId}/accept`, { userId: currentUserId })
	}

	async declineFriendRequest(friendId: number): Promise<{ message: string }> {
		return apiService.post(`/friends/${friendId}/decline`, { userId: currentUserId })
	}

	async removeFriend(friendId: number): Promise<{ message: string }> {
		return apiService.request(`/friends/${friendId}`, {
			method: 'DELETE',
			body: JSON.stringify({ userId: currentUserId })
		})
	}

	// Update user profile (username and email)
	async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
		// Include the current user ID
		const profileData = {
			...data,
			userId: currentUserId
		}
		const response = await apiService.put<UpdateProfileResponse>('/updateProfile', profileData)

		// If successful, update the local user information
		if (response && data.username) {
			updateCurrentUser(data.username)
		}

		return response
	}
	// Update user avatar
	async updateAvatar(file: File): Promise<UpdateAvatarResponse> {
		// Use PUT method for avatar update as per your backend
		const formData = new FormData()
		formData.append('avatar', file)

		// Include the user ID in the form data
		if (currentUserId) {
			formData.append('userId', currentUserId.toString())
		} else {
			throw new Error('User ID not found. Please login again.')
		}

		console.log('Uploading avatar for user ID:', currentUserId)

		const response = await fetch('/api/profile/avatar', {
			method: 'PUT',
			body: formData
		})

		console.log('Avatar upload response status:', response.status)

		if (!response.ok) {
			const errorText = await response.text()
			console.error('Avatar upload error response:', errorText)

			let errorData
			try {
				errorData = JSON.parse(errorText)
			} catch (e) {
				throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`)
			}

			throw new Error(errorData.error || `HTTP ${response.status}`)
		}

		let result
		try {
			const responseText = await response.text()
			console.log('Avatar upload response text:', responseText)
			result = JSON.parse(responseText)
		} catch (e) {
			console.error('Failed to parse JSON response:', e)
			throw new Error('Invalid server response')
		}

		// ONLY update the global navigation avatar if successful
		// Let the calling component handle its own UI updates
		if (result && result.avatar) {
			console.log('Updating global avatar to:', result.avatar)
			updateCurrentAvatar(result.avatar)
		}

		return result
	}

	// Change password
	async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
		return apiService.put('/profile/password', {
			currentPassword,
			newPassword,
			userId: currentUserId
		})
	}

	// Get user statistics
	async getUserStats(): Promise<{ wins: number; losses: number; rank: string }> {
		return apiService.get('/profile/stats')
	}

	// Enable/disable 2FA
	async toggle2FA(enabled: boolean): Promise<{ message: string }> {
		return apiService.put('/profile/2fa', { enabled })
	}
}

// Export a singleton instance
export const userService = new UserService()
