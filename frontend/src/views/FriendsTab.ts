import { userService } from '../services'

// Main function to load friends tab content
export async function loadFriendsTab(friendsElement: HTMLElement, userId: number) {
	// Get current active tab before clearing content
	const activeTab = friendsElement.querySelector('.friend-tab.border-b-2')?.getAttribute('data-tab') || 'friends'

	// Clear current content and show loading
	friendsElement.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-medium text-black">Friends</h3>
            </div>
            <div class="p-4">
                <div class="text-center py-4 text-gray-600">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p class="text-gray-600">Loading friends...</p>
                </div>
            </div>
        </div>
    `

	try {
		// Load friends, friend requests, sent requests, and history
		const [friendsData, requestsData, sentRequestsData, historyData] = await Promise.all([
			userService.getFriends(userId),
			userService.getFriendRequests(userId),
			userService.getSentFriendRequests(userId),
			userService.getFriendHistory(userId)
		])

		const friends = friendsData.friends || []
		const requests = requestsData.requests || []
		const sentRequests = sentRequestsData.sentRequests || []
		const history = historyData.history || []

		// Create the friends interface
		const friendsHTML = createFriendsInterface(friends, requests, sentRequests, history)
		friendsElement.innerHTML = friendsHTML

		// Restore the active tab
		restoreActiveTab(friendsElement, activeTab)

		// Add event listeners after content is loaded
		setupFriendsEventListeners(friendsElement, userId)

	} catch (error) {
		console.error("Error loading friends:", error)
		friendsElement.innerHTML = `
            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="font-medium text-black">Friends</h3>
                </div>
                <div class="p-4">
                    <div class="text-red-500 text-center py-8">
                        Error loading friends. Please try again.
                    </div>
                </div>
            </div>
        `
	}
}

// Function to restore the active tab after reload
function restoreActiveTab(friendsElement: HTMLElement, activeTabName: string) {
	const tabs = friendsElement.querySelectorAll('.friend-tab')
	const tabContents = friendsElement.querySelectorAll('.tab-content')

	// Reset all tabs to inactive
	tabs.forEach(tab => {
		tab.className = 'friend-tab py-2 px-1 text-gray-500 hover:text-orange-500 text-sm'
	})

	// Hide all tab contents
	tabContents.forEach(content => {
		content.classList.add('hidden')
	})

	// Find and activate the target tab
	const targetTab = friendsElement.querySelector(`[data-tab="${activeTabName}"]`)
	const targetContent = friendsElement.querySelector(`[data-tab-content="${activeTabName}"]`)

	if (targetTab && targetContent) {
		targetTab.className = 'friend-tab border-b-2 border-orange-500 py-2 px-1 text-orange-500 font-medium text-sm'
		targetContent.classList.remove('hidden')
	} else {
		// Fallback to friends tab if target not found
		const friendsTab = friendsElement.querySelector('[data-tab="friends"]')
		const friendsContent = friendsElement.querySelector('[data-tab-content="friends"]')

		if (friendsTab && friendsContent) {
			friendsTab.className = 'friend-tab border-b-2 border-orange-500 py-2 px-1 text-orange-500 font-medium text-sm'
			friendsContent.classList.remove('hidden')
		}
	}
}

// Create the friends interface HTML
function createFriendsInterface(friends: any[], requests: any[], sentRequests: any[] = [], history: any[] = []): string {
	return `
        <div class="bg-white rounded-lg shadow">
            <!-- Header with search -->
            <div class="p-4 border-b border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-medium text-black">Friends</h3>
                    <span class="text-sm text-gray-500">${friends.length} friends</span>
                </div>
                
                <!-- Search for new friends -->
                <div class="relative text-gray-600">
                    <input 
                        type="text" 
                        id="friendSearch" 
                        placeholder="Search for players to add as friends..."
                        class="w-full p-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                    <button 
                        id="clearSearchBtn" 
                        type="button" 
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden"
                        title="Clear search"
                    >
                        ✕
                    </button>
                    <div id="searchResults" class="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg hidden max-h-48 overflow-y-auto"></div>
                </div>

                <!-- Friend Tabs -->
                <div class="mt-4 border-b border-gray-200">
                    <nav class="flex space-x-8" aria-label="Friend tabs">
                        <button class="friend-tab border-b-2 border-orange-500 py-2 px-1 text-orange-500 font-medium text-sm" data-tab="friends">
                            Friends (${friends.length})
                        </button>
                        <button class="friend-tab py-2 px-1 text-gray-500 hover:text-orange-500 text-sm" data-tab="requests">
                            Pending (${requests.length})
                        </button>
                        <button class="friend-tab py-2 px-1 text-gray-500 hover:text-orange-500 text-sm" data-tab="sent">
                            Sent (${sentRequests.length})
                        </button>
                        <button class="friend-tab py-2 px-1 text-gray-500 hover:text-orange-500 text-sm" data-tab="history">
                            History (${history.length})
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Tab Content -->
            <!-- Friends Tab -->
            <div class="tab-content" data-tab-content="friends">
                <div class="p-4">
                    ${friends.length === 0 ? `
                        <div class="text-gray-500 text-center py-8">
                            No friends yet. Search for players above to send friend requests!
                        </div>
                    ` : `
                        <div class="grid gap-3">
                            ${friends.map(friend => `
                                <div class="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                                    <div class="flex items-center space-x-3">
                                        <img src="${friend.avatar || '/avatar.png'}" alt="${friend.username}" class="w-12 h-12 rounded-full object-cover">
                                        <div>
                                            <div class="font-medium text-gray-900">${friend.username}</div>
                                            <div class="text-sm text-gray-500">
                                                Wins: ${friend.wins || 0} • Losses: ${friend.losses || 0}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="challenge-friend bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${friend.id}">
                                            Challenge
                                        </button>
                                        <button class="remove-friend bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${friend.id}">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- Pending Requests Tab -->
            <div class="tab-content hidden" data-tab-content="requests">
                <div class="p-4">
                    ${requests.length === 0 ? `
                        <div class="text-gray-500 text-center py-8">
                            No pending friend requests.
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${requests.map(request => `
                                <div class="flex items-center justify-between bg-blue-50 p-3 rounded border">
                                    <div class="flex items-center space-x-3">
                                        <img src="${request.avatar || '/avatar.png'}" alt="${request.username}" class="w-10 h-10 rounded-full object-cover">
                                        <div>
                                            <div class="font-medium text-gray-900">${request.username}</div>
                                            <div class="text-sm text-gray-500">Wants to be your friend</div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="accept-request bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                            Accept
                                        </button>
                                        <button class="decline-request bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- Sent Requests Tab -->
            <div class="tab-content hidden" data-tab-content="sent">
                <div class="p-4">
                    ${sentRequests.length === 0 ? `
                        <div class="text-gray-500 text-center py-8">
                            No sent friend requests.
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${sentRequests.map(request => `
                                <div class="flex items-center justify-between bg-yellow-50 p-3 rounded border">
                                    <div class="flex items-center space-x-3">
                                        <img src="${request.avatar || '/avatar.png'}" alt="${request.username}" class="w-10 h-10 rounded-full object-cover">
                                        <div>
                                            <div class="font-medium text-gray-900">${request.username}</div>
                                            <div class="text-sm text-gray-500">Pending response</div>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="cancel-request bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- History Tab -->
            <div class="tab-content hidden" data-tab-content="history">
                <div class="p-4">
                    ${history.length === 0 ? `
                        <div class="text-gray-500 text-center py-8">
                            No request history.
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${history.map(record => `
                                <div class="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                    <div class="flex items-center space-x-3">
                                        <img src="${record.other_avatar || '/avatar.png'}" alt="${record.other_username}" class="w-10 h-10 rounded-full object-cover">
                                        <div>
                                            <div class="font-medium text-gray-900">${record.other_username}</div>
                                            <div class="text-sm text-gray-500">
                                                ${record.action === 'declined' ?
			(record.request_direction === 'sent' ? 'Declined your request' : 'You declined their request') :
			(record.request_direction === 'sent' ? 'You cancelled your request' : 'They cancelled their request')
		}
                                                • ${new Date(record.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-xs px-2 py-1 rounded ${record.action === 'declined' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
		}">
                                        ${record.action.charAt(0).toUpperCase() + record.action.slice(1)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `
}

// Setup event listeners for friends functionality
function setupFriendsEventListeners(friendsElement: HTMLElement, userId: number) {
	// Tab switching functionality
	const tabs = friendsElement.querySelectorAll('.friend-tab')
	const tabContents = friendsElement.querySelectorAll('.tab-content')

	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetTab = tab.getAttribute('data-tab')

			// Remove active class from all tabs
			tabs.forEach(t => {
				t.className = 'friend-tab py-2 px-1 text-gray-500 hover:text-orange-500 text-sm'
			})

			// Add active class to clicked tab
			tab.className = 'friend-tab border-b-2 border-orange-500 py-2 px-1 text-orange-500 font-medium text-sm'

			// Hide all tab contents
			tabContents.forEach(content => {
				content.classList.add('hidden')
			})

			// Show target tab content
			const targetContent = friendsElement.querySelector(`[data-tab-content="${targetTab}"]`)
			if (targetContent) {
				targetContent.classList.remove('hidden')

				// Clean up old listeners and add new ones for the active tab
				cleanupTabEventListeners(friendsElement)
				if (targetTab === 'friends') {
					setupFriendsTabEventListeners(friendsElement, userId)
				} else if (targetTab === 'requests') {
					setupRequestsTabEventListeners(friendsElement, userId)
				} else if (targetTab === 'sent') {
					setupSentTabEventListeners(friendsElement, userId)
				}
			}
		})
	})

	// Search functionality
	const searchInput = friendsElement.querySelector('#friendSearch') as HTMLInputElement
	const searchResults = friendsElement.querySelector('#searchResults') as HTMLElement
	const clearSearchBtn = friendsElement.querySelector('#clearSearchBtn') as HTMLButtonElement
	let searchTimeout: any

	// Clear search button functionality
	if (clearSearchBtn && searchInput && searchResults) {
		// Show/hide clear button based on input content
		searchInput.addEventListener('input', () => {
			if (searchInput.value.trim()) {
				clearSearchBtn.classList.remove('hidden')
			} else {
				clearSearchBtn.classList.add('hidden')
			}
		})

		// Clear search when clicking the X button
		clearSearchBtn.addEventListener('click', () => {
			searchInput.value = ''
			searchResults.classList.add('hidden')
			clearSearchBtn.classList.add('hidden')
			searchInput.focus()
		})
	}

	if (searchInput && searchResults) {
		searchInput.addEventListener('input', async () => {
			clearTimeout(searchTimeout)
			const query = searchInput.value.trim()

			if (query.length < 2) {
				searchResults.classList.add('hidden')
				return
			}

			searchTimeout = setTimeout(async () => {
				try {
					const results = await userService.searchPlayers(userId, query)
					const players = results.players || []

					if (players.length === 0) {
						searchResults.innerHTML = '<div class="p-3 text-gray-500">No players found</div>'
					} else {
						searchResults.innerHTML = players.map(player => `
                            <div class="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0">
                                <div class="flex items-center space-x-3">
                                    <img src="${player.avatar || '/avatar.png'}" alt="${player.username}" class="w-8 h-8 rounded-full object-cover">
                                    <div>
                                        <div class="font-medium text-gray-900">${player.username}</div>
                                        <div class="text-xs text-gray-500">Wins: ${player.wins || 0} • Losses: ${player.losses || 0}</div>
                                    </div>
                                </div>
                                <button class="add-friend bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs" data-player-id="${player.id}">
                                    Add Friend
                                </button>
                            </div>
                        `).join('')
					}

					searchResults.classList.remove('hidden')

					// Add event listeners for "Add Friend" buttons
					searchResults.querySelectorAll('.add-friend').forEach(btn => {
						btn.addEventListener('click', async () => {
							const playerId = btn.getAttribute('data-player-id')
							if (playerId) {
								try {
									await userService.sendFriendRequest(parseInt(playerId))
									btn.textContent = 'Sent!'
									btn.classList.remove('bg-orange-500', 'hover:bg-orange-600')
									btn.classList.add('bg-gray-500')
										; (btn as HTMLButtonElement).disabled = true

									// Refresh the current tab to show updated counters without clearing the input
									setTimeout(() => {
										updateFriendTabCounters(friendsElement, userId)
									}, 1000) // Wait 1 second to show "Sent!" message
								} catch (error) {
									console.error('Error sending friend request:', error)
									alert('Error sending friend request')
								}
							}
						})
					})

				} catch (error) {
					console.error('Error searching players:', error)
					searchResults.innerHTML = '<div class="p-3 text-red-500">Error searching players</div>'
					searchResults.classList.remove('hidden')
				}
			}, 300)
		})

		// Hide search results when clicking outside
		document.addEventListener('click', (e) => {
			if (!friendsElement.contains(e.target as Node)) {
				searchResults.classList.add('hidden')
			}
		})
	}

	// Setup initial active tab listeners
	const activeTab = friendsElement.querySelector('.friend-tab.border-b-2')?.getAttribute('data-tab') || 'friends'
	if (activeTab === 'friends') {
		setupFriendsTabEventListeners(friendsElement, userId)
	} else if (activeTab === 'requests') {
		setupRequestsTabEventListeners(friendsElement, userId)
	} else if (activeTab === 'sent') {
		setupSentTabEventListeners(friendsElement, userId)
	}
}

// Function to clean up tab-specific event listeners to prevent duplicates
function cleanupTabEventListeners(friendsElement: HTMLElement) {
	// Clone and replace elements to remove all event listeners
	const buttonsToCleanup = [
		'.remove-friend',
		'.challenge-friend',
		'.accept-request',
		'.decline-request',
		'.cancel-request'
	]

	buttonsToCleanup.forEach(selector => {
		friendsElement.querySelectorAll(selector).forEach(button => {
			const newButton = button.cloneNode(true)
			button.parentNode?.replaceChild(newButton, button)
		})
	})
}

// Event listener functions for individual tabs
function setupFriendsTabEventListeners(friendsElement: HTMLElement, userId: number) {
	// Remove friend
	friendsElement.querySelectorAll('.remove-friend').forEach(btn => {
		btn.addEventListener('click', async () => {
			const friendId = btn.getAttribute('data-friend-id')
			if (friendId && confirm('Are you sure you want to remove this friend?')) {
				try {
					await userService.removeFriend(parseInt(friendId))
					// Update counters
					await updateFriendTabCounters(friendsElement, userId)
				} catch (error) {
					console.error('Error removing friend:', error)
					alert('Error removing friend')
				}
			}
		})
	})

	// Challenge friend (placeholder for now)
	friendsElement.querySelectorAll('.challenge-friend').forEach(btn => {
		btn.addEventListener('click', () => {
			alert('Challenge functionality will be implemented soon!')
		})
	})
}

function setupRequestsTabEventListeners(friendsElement: HTMLElement, userId: number) {
	// Accept friend request
	friendsElement.querySelectorAll('.accept-request').forEach(btn => {
		btn.addEventListener('click', async () => {
			const friendId = btn.getAttribute('data-friend-id')
			if (friendId) {
				try {
					await userService.acceptFriendRequest(parseInt(friendId))
					// Update counters
					await updateFriendTabCounters(friendsElement, userId)
				} catch (error) {
					console.error('Error accepting friend request:', error)
					alert('Error accepting friend request')
				}
			}
		})
	})

	// Decline friend request
	friendsElement.querySelectorAll('.decline-request').forEach(btn => {
		btn.addEventListener('click', async () => {
			const friendId = btn.getAttribute('data-friend-id')
			if (friendId) {
				try {
					await userService.declineFriendRequest(parseInt(friendId))
					// Update counters
					await updateFriendTabCounters(friendsElement, userId)
				} catch (error) {
					console.error('Error declining friend request:', error)
					alert('Error declining friend request')
				}
			}
		})
	})
}

function setupSentTabEventListeners(friendsElement: HTMLElement, userId: number) {
	// Cancel sent friend request
	friendsElement.querySelectorAll('.cancel-request').forEach(btn => {
		btn.addEventListener('click', async () => {
			const friendId = btn.getAttribute('data-friend-id')
			if (friendId && confirm('Are you sure you want to cancel this friend request?')) {
				try {
					await userService.cancelFriendRequest(parseInt(friendId))
					// Update counters
					await updateFriendTabCounters(friendsElement, userId)
				} catch (error) {
					console.error('Error cancelling friend request:', error)
					alert('Error cancelling friend request')
				}
			}
		})
	})
}

// Function to update only the tab counters without affecting the search input
async function updateFriendTabCounters(friendsElement: HTMLElement, userId: number) {
	try {
		// Load only the data needed for counters
		const [friendsData, requestsData, sentRequestsData, historyData] = await Promise.all([
			userService.getFriends(userId),
			userService.getFriendRequests(userId),
			userService.getSentFriendRequests(userId),
			userService.getFriendHistory(userId)
		])

		const friends = friendsData.friends || []
		const requests = requestsData.requests || []
		const sentRequests = sentRequestsData.sentRequests || []
		const history = historyData.history || []

		// Update the tab button texts with new counters
		const friendsTab = friendsElement.querySelector('[data-tab="friends"]')
		const requestsTab = friendsElement.querySelector('[data-tab="requests"]')
		const sentTab = friendsElement.querySelector('[data-tab="sent"]')
		const historyTab = friendsElement.querySelector('[data-tab="history"]')

		if (friendsTab) friendsTab.textContent = `Friends (${friends.length})`
		if (requestsTab) requestsTab.textContent = `Pending (${requests.length})`
		if (sentTab) sentTab.textContent = `Sent (${sentRequests.length})`
		if (historyTab) historyTab.textContent = `History (${history.length})`

		// Update the friends count in the header
		const friendsCountSpan = friendsElement.querySelector('.text-sm.text-gray-500')
		if (friendsCountSpan) {
			friendsCountSpan.textContent = `${friends.length} friends`
		}

		// Get the currently active tab and update its content
		const activeTab = friendsElement.querySelector('.friend-tab.border-b-2')?.getAttribute('data-tab') || 'friends'

		// Update ALL tab contents, not just the active one
		updateFriendsTabContent(friendsElement, friends)
		updateRequestsTabContent(friendsElement, requests)
		updateSentTabContent(friendsElement, sentRequests)
		updateHistoryTabContent(friendsElement, history)

		// Re-add event listeners for the currently active tab
		cleanupTabEventListeners(friendsElement)
		if (activeTab === 'friends') {
			setupFriendsTabEventListeners(friendsElement, userId)
		} else if (activeTab === 'requests') {
			setupRequestsTabEventListeners(friendsElement, userId)
		} else if (activeTab === 'sent') {
			setupSentTabEventListeners(friendsElement, userId)
		}

	} catch (error) {
		console.error("Error updating friend tab counters:", error)
	}
}

// Helper functions to update individual tab contents
function updateFriendsTabContent(friendsElement: HTMLElement, friends: any[]) {
	const friendsContent = friendsElement.querySelector('[data-tab-content="friends"] .p-4')
	if (friendsContent) {
		friendsContent.innerHTML = friends.length === 0 ? `
            <div class="text-gray-500 text-center py-8">
                No friends yet. Search for players above to send friend requests!
            </div>
        ` : `
            <div class="grid gap-3">
                ${friends.map(friend => `
                    <div class="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                        <div class="flex items-center space-x-3">
                            <img src="${friend.avatar || '/avatar.png'}" alt="${friend.username}" class="w-12 h-12 rounded-full object-cover">
                            <div>
                                <div class="font-medium text-gray-900">${friend.username}</div>
                                <div class="text-sm text-gray-500">
                                    Wins: ${friend.wins || 0} • Losses: ${friend.losses || 0}
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="challenge-friend bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${friend.id}">
                                Challenge
                            </button>
                            <button class="remove-friend bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${friend.id}">
                                Remove
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
	}
}

function updateRequestsTabContent(friendsElement: HTMLElement, requests: any[]) {
	const requestsContent = friendsElement.querySelector('[data-tab-content="requests"] .p-4')
	if (requestsContent) {
		requestsContent.innerHTML = requests.length === 0 ? `
            <div class="text-gray-500 text-center py-8">
                No pending friend requests.
            </div>
        ` : `
            <div class="space-y-3">
                ${requests.map(request => `
                    <div class="flex items-center justify-between bg-blue-50 p-3 rounded border">
                        <div class="flex items-center space-x-3">
                            <img src="${request.avatar || '/avatar.png'}" alt="${request.username}" class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <div class="font-medium text-gray-900">${request.username}</div>
                                <div class="text-sm text-gray-500">Wants to be your friend</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="accept-request bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                Accept
                            </button>
                            <button class="decline-request bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                Decline
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
	}
}

function updateSentTabContent(friendsElement: HTMLElement, sentRequests: any[]) {
	const sentContent = friendsElement.querySelector('[data-tab-content="sent"] .p-4')
	if (sentContent) {
		sentContent.innerHTML = sentRequests.length === 0 ? `
            <div class="text-gray-500 text-center py-8">
                No sent friend requests.
            </div>
        ` : `
            <div class="space-y-3">
                ${sentRequests.map(request => `
                    <div class="flex items-center justify-between bg-yellow-50 p-3 rounded border">
                        <div class="flex items-center space-x-3">
                            <img src="${request.avatar || '/avatar.png'}" alt="${request.username}" class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <div class="font-medium text-gray-900">${request.username}</div>
                                <div class="text-sm text-gray-500">Pending response</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="cancel-request bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" data-friend-id="${request.id}">
                                Cancel
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `
	}
}

function updateHistoryTabContent(friendsElement: HTMLElement, history: any[]) {
	const historyContent = friendsElement.querySelector('[data-tab-content="history"] .p-4')
	if (historyContent) {
		historyContent.innerHTML = history.length === 0 ? `
            <div class="text-gray-500 text-center py-8">
                No request history.
            </div>
        ` : `
            <div class="space-y-3">
                ${history.map(record => `
                    <div class="flex items-center justify-between bg-gray-50 p-3 rounded border">
                        <div class="flex items-center space-x-3">
                            <img src="${record.other_avatar || '/avatar.png'}" alt="${record.other_username}" class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <div class="font-medium text-gray-900">${record.other_username}</div>
                                <div class="text-sm text-gray-500">
                                    ${record.action === 'declined' ?
				(record.request_direction === 'sent' ? 'Declined your request' : 'You declined their request') :
				(record.request_direction === 'sent' ? 'You cancelled your request' : 'They cancelled their request')
			}
                                    • ${new Date(record.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div class="text-xs px-2 py-1 rounded ${record.action === 'declined' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
			}">
                            ${record.action.charAt(0).toUpperCase() + record.action.slice(1)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `
	}
}
