import { currentUser, currentUserId } from '../logic/auth'
import { userService } from '../services'

export async function ProfileView(pushState = true) {
    const main = document.getElementById("mainContent")
    if (!main) return

    main.innerHTML = ""
    main.appendChild(await createProfileMainContent())

    if (pushState) window.history.pushState({}, "", "/profile")
}

async function createProfileMainContent(): Promise<HTMLElement> {
    // Create the main profile container
    const container = document.createElement("div")
    container.className = "container mx-auto p-8 mt-16"

    // Check if user is logged in
    if (!currentUser || !currentUserId) {
        const notLoggedIn = document.createElement("div")
        notLoggedIn.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        notLoggedIn.textContent = "You must be logged in to view your profile"
        container.appendChild(notLoggedIn)
        return container
    }

    // Show loading message while fetching data
    const loadingDiv = document.createElement("div")
    loadingDiv.className = "text-center py-8"
    loadingDiv.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading profile...</p>
    `
    container.appendChild(loadingDiv)

    try {
        // Fetch user profile data
        const profileData = await userService.getProfile(currentUserId)

        // Remove loading message
        container.removeChild(loadingDiv)

        // Create profile content with fetched data
        createProfileContent(container, profileData)

    } catch (error) {
        console.error("Error loading profile:", error)
        container.removeChild(loadingDiv)

        const errorDiv = document.createElement("div")
        errorDiv.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        errorDiv.textContent = "Error loading profile data. Please try again."
        container.appendChild(errorDiv)
    }

    return container
}

function createProfileContent(container: HTMLElement, profileData: any) {
    // Profile header
    const header = document.createElement("div")
    header.className = "flex items-center gap-6 mb-8"

    // Avatar section
    const avatarContainer = document.createElement("div")
    avatarContainer.className = "relative"

    const avatar = document.createElement("img")
    avatar.src = profileData.avatar || "/avatar.png"
    avatar.alt = "Profile avatar"
    avatar.className = "w-24 h-24 rounded-full object-cover"

    const changeAvatarBtn = document.createElement("button")
    changeAvatarBtn.className = "absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-2 shadow-md"
    changeAvatarBtn.innerHTML = "📷"
    changeAvatarBtn.title = "Change avatar"

    avatarContainer.appendChild(avatar)
    avatarContainer.appendChild(changeAvatarBtn)

    // User info
    const userInfo = document.createElement("div")
    const username = document.createElement("h1")
    username.textContent = profileData.username
    username.className = "text-2xl font-bold"
    userInfo.appendChild(username)

    // Stats preview
    const stats = document.createElement("div")
    stats.className = "text-sm text-gray-600"
    stats.innerHTML = `
        <span>Wins: ${profileData.wins || 0}</span> | 
        <span>Losses: ${profileData.losses || 0}</span> | 
        <span>Rank: Rookie</span>
    `
    userInfo.appendChild(stats)

    header.appendChild(avatarContainer)
    header.appendChild(userInfo)
    container.appendChild(header)

    // Tabs
    const tabs = document.createElement("div")
    tabs.className = "border-b border-gray-200 mb-6"

    const tabsList = ["Profile Settings", "Game History", "Friends"]
    const tabsContainer = document.createElement("div")
    tabsContainer.className = "flex space-x-8"

    tabsList.forEach((tabName, index) => {
        const tab = document.createElement("button")
        tab.textContent = tabName
        tab.className = index === 0
            ? "border-b-2 border-orange-500 py-4 px-1 text-orange-500 font-medium"
            : "py-4 px-1 text-gray-500 hover:text-orange-500"
        tab.dataset.tab = tabName.toLowerCase().replace(" ", "-")

        tab.addEventListener("click", async () => {
            // Remove active class from all tabs
            tabsContainer.querySelectorAll("button").forEach(t => {
                t.className = "py-4 px-1 text-gray-500 hover:text-orange-500"
            })

            // Add active class to clicked tab
            tab.className = "border-b-2 border-orange-500 py-4 px-1 text-orange-500 font-medium"

            // Show corresponding content
            const allContent = container.querySelectorAll("[data-content]")
            allContent.forEach(c => {
                (c as HTMLElement).style.display = "none"
            })

            const contentToShow = container.querySelector(`[data-content="${tab.dataset.tab}"]`)
            if (contentToShow) {
                (contentToShow as HTMLElement).style.display = "block"

                // Load game history when the tab is clicked
                if (tab.dataset.tab === "game-history") {
                    await loadGameHistory(contentToShow as HTMLElement, profileData.id)
                }
            }
        })

        tabsContainer.appendChild(tab)
    })

    tabs.appendChild(tabsContainer)
    container.appendChild(tabs)

    // Profile Settings Content
    const profileSettings = document.createElement("div")
    profileSettings.dataset.content = "profile-settings"
    profileSettings.className = "bg-white rounded-lg shadow p-6"

    const settingsForm = document.createElement("form")
    settingsForm.className = "space-y-6"

    // Username field
    const usernameField = createFormField("Username", "text", profileData.username, "username")
    usernameField.className = "text-gray-700"
    settingsForm.appendChild(usernameField)

    // Email field
    const emailField = createFormField("Email", "email", profileData.email, "email")
    emailField.className = "text-gray-700"
    settingsForm.appendChild(emailField)

    // Two-Factor Authentication
    const twoFAContainer = document.createElement("div")
    twoFAContainer.className = "flex justify-between items-center"

    const twoFALabel = document.createElement("div")
    twoFALabel.innerHTML = "<strong>Two-Factor Authentication</strong><p class='text-sm text-gray-500'>Enable additional security for your account</p>"
    twoFALabel.className = "text-black"

    const twoFAToggle = document.createElement("label")
    twoFAToggle.className = "relative inline-flex items-center cursor-pointer"
    twoFAToggle.innerHTML = `
        <input type="checkbox" value="" class="sr-only peer">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
    `

    twoFAContainer.appendChild(twoFALabel)
    twoFAContainer.appendChild(twoFAToggle)
    settingsForm.appendChild(twoFAContainer)

    // Password change section
    const passwordSection = document.createElement("div")
    passwordSection.className = "pt-4 border-t border-gray-200"

    const passwordTitle = document.createElement("h3")
    passwordTitle.textContent = "Change Password"
    passwordTitle.className = "text-lg font-medium mb-4 text-black"
    passwordSection.appendChild(passwordTitle)

    const currentPasswordField = createFormField("Current Password", "password", "", "current-password")
    const newPasswordField = createFormField("New Password", "password", "", "new-password")
    const confirmPasswordField = createFormField("Confirm New Password", "password", "", "confirm-password")

    passwordSection.appendChild(currentPasswordField)
    passwordSection.appendChild(newPasswordField)
    passwordSection.appendChild(confirmPasswordField)
    settingsForm.appendChild(passwordSection)

    // Save button
    const saveButton = document.createElement("button")
    saveButton.type = "submit"
    saveButton.className = "bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded"
    saveButton.textContent = "Save Changes"
    settingsForm.appendChild(saveButton)

    // Form submission handler
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(settingsForm as HTMLFormElement)
        const username = formData.get("username") as string
        const email = formData.get("email") as string

        // Remove any existing messages
        const existingMsg = settingsForm.querySelector(".bg-green-100, .bg-red-100")
        if (existingMsg) {
            settingsForm.removeChild(existingMsg)
        }

        try {
            const result = await userService.updateProfile({
                username,
                email
            })

            // Update the displayed username in the page header
            const usernameElement = container.querySelector("h1")
            if (usernameElement) {
                usernameElement.textContent = username
            }

            // Show success message
            const successMsg = document.createElement("div")
            successMsg.className = "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4"
            successMsg.textContent = result.message || "Profile updated successfully!"
            settingsForm.appendChild(successMsg)

        } catch (error) {
            console.error("Error updating profile:", error)
            // Show error message
            const errorMsg = document.createElement("div")
            errorMsg.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4"
            errorMsg.textContent = error instanceof Error ? error.message : "Network error. Please try again."
            settingsForm.appendChild(errorMsg)
        }
    })

    profileSettings.appendChild(settingsForm)
    container.appendChild(profileSettings)

    // Game History Content (hidden by default)
    const gameHistory = document.createElement("div")
    gameHistory.dataset.content = "game-history"
    gameHistory.style.display = "none"
    gameHistory.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200 ">
                <h3 class="font-medium text-black">Recent Games</h3>
            </div>
            <div class="p-4">
                <div class="text-gray-500 text-center py-8">
                    No games played yet.
                </div>
            </div>
        </div>
    `
    container.appendChild(gameHistory)

    // Friends Content (hidden by default)
    const friends = document.createElement("div")
    friends.dataset.content = "friends"
    friends.style.display = "none"
    friends.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-medium text-black">Friends</h3>
            </div>
            <div class="p-4">
                <div class="text-gray-500 text-center py-8">
                    No friends added yet.
                </div>
            </div>
        </div>
    `
    container.appendChild(friends)

    // Handle avatar change
    changeAvatarBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.click()

        fileInput.addEventListener("change", async () => {
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0]

                // Store the original avatar for rollback
                const originalAvatar = avatar.src

                // Upload to server immediately (without preview)
                try {
                    console.log("Starting avatar upload...")
                    const result = await userService.updateAvatar(file)
                    console.log("Avatar upload response:", result)

                    // Update with the server URL
                    if (result.avatar) {
                        console.log("Updating avatar src to:", result.avatar)

                        // Update ONLY the profile page avatar
                        // The userService already updated the global avatar and navigation
                        avatar.src = result.avatar

                        console.log("Avatar element src is now:", avatar.src)
                        console.log("Global currentAvatar should be:", (window as any).currentAvatar)

                    } else {
                        console.error("No avatar URL returned from server")
                        avatar.src = originalAvatar // Restore original
                    }

                } catch (error) {
                    console.error("Error uploading avatar:", error)
                    // Revert to original avatar on error
                    avatar.src = originalAvatar

                    // Show error message to user
                    alert(error instanceof Error ? error.message : "Failed to upload avatar")
                }
            }
            document.body.removeChild(fileInput)
        })
    })
}

// Function to load game history dynamically
async function loadGameHistory(gameHistoryElement: HTMLElement, userId: number) {
    // Clear current content
    gameHistoryElement.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-medium text-black">Recent Games</h3>
            </div>
            <div class="p-4">
                <div class="text-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p class="text-gray-600">Loading game history...</p>
                </div>
            </div>
        </div>
    `

    try {
        const gameData = await userService.getGameHistory(userId)
        const games = gameData.games || []

        // Create the game history content
        let gamesHTML = ''
        if (games.length === 0) {
            gamesHTML = `
                <div class="text-gray-500 text-center py-8">
                    No games played yet.
                </div>
            `
        } else {
            gamesHTML = games.map((game: any) => {
                const isPlayer1 = game.player1_id === userId
                const opponent = isPlayer1 ? game.player2_username : game.player1_username
                const userScore = isPlayer1 ? game.player1_score : game.player2_score
                const opponentScore = isPlayer1 ? game.player2_score : game.player1_score

                const resultClass = game.result === 'win' ? 'text-green-600' :
                    game.result === 'loss' ? 'text-red-600' : 'text-yellow-600'
                const resultIcon = game.result === 'win' ? '🏆' :
                    game.result === 'loss' ? '❌' : '🤝'

                const gameDate = new Date(game.created_at).toLocaleDateString()

                return `
                    <div class="border-b border-gray-200 last:border-b-0 p-4 hover:bg-gray-50">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center space-x-3">
                                <span class="text-2xl">${resultIcon}</span>
                                <div>
                                    <div class="font-medium text-gray-900">
                                        vs ${opponent}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        ${game.game_type || 'Pong'} • ${gameDate}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-medium text-gray-900">
                                    ${userScore} - ${opponentScore}
                                </div>
                                <div class="text-sm font-medium ${resultClass}">
                                    ${game.result.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                `
            }).join('')
        }

        // Update the content
        gameHistoryElement.innerHTML = `
            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="font-medium text-black">Recent Games</h3>
                </div>
                <div class="divide-y divide-gray-200">
                    ${gamesHTML}
                </div>
            </div>
        `

    } catch (error) {
        console.error("Error loading game history:", error)
        gameHistoryElement.innerHTML = `
            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="font-medium text-black">Recent Games</h3>
                </div>
                <div class="p-4">
                    <div class="text-red-500 text-center py-8">
                        Error loading game history. Please try again.
                    </div>
                </div>
            </div>
        `
    }
}

// Helper function to create form fields
function createFormField(label: string, type: string, value: string, id: string): HTMLElement {
    const field = document.createElement("div")

    const labelElement = document.createElement("label")
    labelElement.htmlFor = id
    labelElement.textContent = label
    labelElement.className = "block text-sm font-medium text-gray-700 mb-1"

    const input = document.createElement("input")
    input.type = type
    input.id = id
    input.name = id
    input.value = value
    input.className = "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"

    field.appendChild(labelElement)
    field.appendChild(input)

    return field
}