// Generic API service for handling common API operations

export interface ApiResponse<T = any> {
	data?: T
	error?: string
	message?: string
}

export class ApiService {
	private baseUrl: string

	constructor(baseUrl: string = '/api') {
		this.baseUrl = baseUrl
	}

	// Get authentication token (implement based on your auth system)
	private getAuthToken(): string | null {
		// Replace this with your actual token retrieval logic
		return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
	}

	// Make authenticated request
	async request<T = any>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`
		const token = this.getAuthToken()

		const defaultHeaders: HeadersInit = {
			...(token && { 'Authorization': `Bearer ${token}` })
		}

		// Only add Content-Type if not already provided in options.headers
		const hasContentType = options.headers && Object.keys(options.headers).some(
			key => key.toLowerCase() === 'content-type'
		)

		if (!hasContentType) {
			defaultHeaders['Content-Type'] = 'application/json'
		}

		const finalHeaders: HeadersInit = {
			...defaultHeaders,
			...options.headers
		}

		const config: RequestInit = {
			...options,
			headers: finalHeaders
		}

		try {
			const response = await fetch(url, config)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
			}

			return await response.json()
		} catch (error) {
			if (error instanceof Error) {
				throw error
			}
			throw new Error('Network error occurred')
		}
	}

	// Convenience methods
	async get<T = any>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET' })
	}

	async post<T = any>(endpoint: string, data?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined
		})
	}

	async put<T = any>(endpoint: string, data?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined
		})
	}

	async delete<T = any>(endpoint: string, options: { skipContentType?: boolean } = {}): Promise<T> {
		if (options.skipContentType) {
			// For DELETE without Content-Type, use fetch directly to avoid header issues
			const url = `${this.baseUrl}${endpoint}`
			const token = this.getAuthToken()
			const headers: HeadersInit = {}

			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}

			const response = await fetch(url, {
				method: 'DELETE',
				headers
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
			}

			return await response.json()
		}

		return this.request<T>(endpoint, { method: 'DELETE' })
	}	// File upload method
	async uploadFile<T = any>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
		const formData = new FormData()
		formData.append(fieldName, file)

		const token = this.getAuthToken()
		const headers: HeadersInit = {
			...(token && { 'Authorization': `Bearer ${token}` })
			// Don't set Content-Type for FormData, let browser set it with boundary
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'POST',
			headers,
			body: formData
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
		}

		return response.json()
	}
}

// Export singleton instance
export const apiService = new ApiService()
