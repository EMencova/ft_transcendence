import { currentUser, currentUserId, updateCurrentAvatar } from '../logic/auth'
import { createPasswordInput } from '../PasswordInput'
import { userService } from '../services'
import { loadFriendsTab } from './FriendsTab'

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
        notLoggedIn.className = "bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded"
        notLoggedIn.textContent = "You must be logged in to view your profile"
        container.appendChild(notLoggedIn)
        return container
    }

    // Show loading message while fetching data
    const loadingDiv = document.createElement("div")
    loadingDiv.className = "text-center py-8"
    loadingDiv.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-300">Loading profile...</p>
    `
    container.appendChild(loadingDiv)

    try {
        // Fetch user profile data
        const profileData = await userService.getProfile(currentUserId)

        // Update avatar in localStorage if profile has one and localStorage doesn't
        if (profileData.avatar && !localStorage.getItem("currentAvatar")) {
            updateCurrentAvatar(profileData.avatar)
        }

        // Remove loading message
        container.removeChild(loadingDiv)

        // Create profile content with fetched data
        createProfileContent(container, profileData)

    } catch (error) {
        console.error("Error loading profile:", error)
        container.removeChild(loadingDiv)

        const errorDiv = document.createElement("div")
        errorDiv.className = "bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded"
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
    changeAvatarBtn.className = "absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-2 shadow-md"
    changeAvatarBtn.innerHTML = "📷"
    changeAvatarBtn.title = "Change avatar"

    avatarContainer.appendChild(avatar)
    avatarContainer.appendChild(changeAvatarBtn)

    // User info
    const userInfo = document.createElement("div")
    userInfo.className = "flex flex-col gap-3"
    const username = document.createElement("h1")
    username.textContent = profileData.username
    username.className = "text-2xl font-bold text-white"
    userInfo.appendChild(username)

    // Stats preview
    const stats = document.createElement("div")
    stats.className = "text-sm text-gray-300"
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
    tabs.className = "border-b border-gray-600 mb-6"

    const tabsList = ["Profile Settings", "Game History", "Friends"]
    const tabsContainer = document.createElement("div")
    tabsContainer.className = "flex space-x-8"

    tabsList.forEach((tabName, index) => {
        const tab = document.createElement("button")
        tab.textContent = tabName
        tab.className = index === 0
            ? "border-b-2 border-orange-500 py-4 px-1 text-orange-500 font-medium"
            : "py-4 px-1 text-gray-400 hover:text-orange-500"
        tab.dataset.tab = tabName.toLowerCase().replace(" ", "-")

        tab.addEventListener("click", async () => {
            // Remove active class from all tabs
            tabsContainer.querySelectorAll("button").forEach(t => {
                t.className = "py-4 px-1 text-gray-400 hover:text-orange-500"
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

                // Load friends when the tab is clicked
                if (tab.dataset.tab === "friends") {
                    await loadFriendsTab(contentToShow as HTMLElement, profileData.id)
                }
            }
        })

        tabsContainer.appendChild(tab)
    })

    tabs.appendChild(tabsContainer)
    container.appendChild(tabs)

    // Tab content containers
    const profileSettingsContent = document.createElement("div")
    profileSettingsContent.dataset.content = "profile-settings"
    profileSettingsContent.style.display = "block" // Show by default
    createProfileSettingsContent(profileSettingsContent, profileData)

    const gameHistoryContent = document.createElement("div")
    gameHistoryContent.dataset.content = "game-history"
    gameHistoryContent.style.display = "none"

    const friendsContent = document.createElement("div")
    friendsContent.dataset.content = "friends"
    friendsContent.style.display = "none"

    container.appendChild(profileSettingsContent)
    container.appendChild(gameHistoryContent)
    container.appendChild(friendsContent)

    // Set up change avatar functionality
    changeAvatarBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                // Validate file size (e.g., max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert("File size must be less than 5MB")
                    return
                }

                // Validate file type
                if (!file.type.startsWith("image/")) {
                    alert("Please select an image file")
                    return
                }

                try {
                    const avatarUrl = await userService.updateAvatar(file)
                    // Update the avatar image
                    avatar.src = avatarUrl.avatar
                    // Update the navigation avatar as well
                    updateCurrentAvatar(avatarUrl.avatar)
                    // Show success message
                    const successMsg = document.createElement("div")
                    successMsg.className = "bg-green-800 border border-green-600 text-green-200 px-4 py-3 rounded mt-4"
                    successMsg.textContent = "Avatar updated successfully!"
                    header.appendChild(successMsg)

                    // Remove success message after 3 seconds
                    setTimeout(() => {
                        if (successMsg.parentNode) {
                            successMsg.parentNode.removeChild(successMsg)
                        }
                    }, 3000)
                } catch (error) {
                    console.error("Avatar upload error:", error)

                    // Show error message to user
                    alert(error instanceof Error ? error.message : "Failed to upload avatar")
                }
            }
            document.body.removeChild(fileInput)
        })

        fileInput.click()
    })
}

function createProfileSettingsContent(settingsElement: HTMLElement, profileData: any) {
    settingsElement.className = "bg-zinc-900 rounded-lg shadow-lg p-6 border border-gray-700"

    const settingsForm = document.createElement("form")
    settingsForm.className = "space-y-6"

    // Personal info section
    const personalInfoSection = document.createElement("div")
    personalInfoSection.className = "text-gray-300"

    const personalInfoTitle = document.createElement("h3")
    personalInfoTitle.textContent = "Change Personal Info"
    personalInfoTitle.className = "text-lg font-medium mb-4 text-white"
    personalInfoSection.appendChild(personalInfoTitle)

    // Username field
    const usernameField = createFormField("Username", "text", profileData.username, "username")
    usernameField.className = "text-gray-300 mb-4"
    personalInfoSection.appendChild(usernameField)

    // Email field
    const emailField = createFormField("Email", "email", profileData.email, "email")
    emailField.className = "text-gray-300"
    personalInfoSection.appendChild(emailField)

    settingsForm.appendChild(personalInfoSection)

    // Password change section
    const passwordSection = document.createElement("div")
    passwordSection.className = "pt-4 border-t border-gray-600 text-gray-300"

    const passwordTitle = document.createElement("h3")
    passwordTitle.textContent = "Change Password"
    passwordTitle.className = "text-lg font-medium mb-4 text-white"
    passwordSection.appendChild(passwordTitle)

    // Current Password
    const currentPasswordLabel = document.createElement("label")
    currentPasswordLabel.textContent = "Current Password"
    currentPasswordLabel.className = "block text-sm font-medium text-gray-300 mb-1 text-left"
    passwordSection.appendChild(currentPasswordLabel)

    const currentPasswordInput = createPasswordInput("current-password", "Enter your current password", "w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 placeholder-gray-400")
    const currentToggleBtn = currentPasswordInput.querySelector('button')
    if (currentToggleBtn) {
        currentToggleBtn.className = "absolute right-2 top-2 text-gray-200 hover:text-white"
    }
    passwordSection.appendChild(currentPasswordInput)

    // New Password
    const newPasswordLabel = document.createElement("label")
    newPasswordLabel.textContent = "New Password"
    newPasswordLabel.className = "block text-sm font-medium text-gray-300 mb-1 mt-4 text-left"
    passwordSection.appendChild(newPasswordLabel)

    const newPasswordInput = createPasswordInput("new-password", "Enter your new password", "w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 placeholder-gray-400")
    const newToggleBtn = newPasswordInput.querySelector('button')
    if (newToggleBtn) {
        newToggleBtn.className = "absolute right-2 top-2 text-gray-200 hover:text-white"
    }
    passwordSection.appendChild(newPasswordInput)

    // Confirm New Password
    const confirmPasswordLabel = document.createElement("label")
    confirmPasswordLabel.textContent = "Confirm New Password"
    confirmPasswordLabel.className = "block text-sm font-medium text-gray-300 mb-1 mt-4 text-left"
    passwordSection.appendChild(confirmPasswordLabel)

    const confirmPasswordInput = createPasswordInput("confirm-password", "Confirm your new password", "w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 placeholder-gray-400")
    const confirmToggleBtn = confirmPasswordInput.querySelector('button')
    if (confirmToggleBtn) {
        confirmToggleBtn.className = "absolute right-2 top-2 text-gray-200 hover:text-white"
    }
    passwordSection.appendChild(confirmPasswordInput)

    settingsForm.appendChild(passwordSection)

    // Save button
    const saveButton = document.createElement("button")
    saveButton.type = "submit"
    saveButton.className = "bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded"
    saveButton.textContent = "Save Changes"
    settingsForm.appendChild(saveButton)

    // Form submission handler
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(settingsForm as HTMLFormElement)
        const username = formData.get("username") as string
        const email = formData.get("email") as string
        const currentPassword = formData.get("current-password") as string
        const newPassword = formData.get("new-password") as string
        const confirmPassword = formData.get("confirm-password") as string

        // Remove any existing messages
        const existingMsg = settingsForm.querySelector(".bg-green-800, .bg-red-800")
        if (existingMsg) {
            settingsForm.removeChild(existingMsg)
        }

        // Check if password change is requested
        const isPasswordChange = currentPassword || newPassword || confirmPassword

        if (isPasswordChange) {
            // Validate password fields
            if (!currentPassword) {
                showFormMessage(settingsForm, "Current password is required", "error")
                return
            }
            if (!newPassword) {
                showFormMessage(settingsForm, "New password is required", "error")
                return
            }
            if (newPassword !== confirmPassword) {
                showFormMessage(settingsForm, "New passwords do not match", "error")
                return
            }
            if (newPassword.length < 6) {
                showFormMessage(settingsForm, "New password must be at least 6 characters", "error")
                return
            }
        }

        try {
            // Update profile (username and email)
            const profileResult = await userService.updateProfile({
                username,
                email
            })

            // Update the displayed username in the page header
            const usernameElement = document.querySelector("h1")
            if (usernameElement) {
                usernameElement.textContent = username
            }

            let successMessage = profileResult.message || "Profile updated successfully!"

            // If password change was requested, update password too
            if (isPasswordChange) {
                try {
                    await userService.changePassword(currentPassword, newPassword)
                    successMessage += " Password changed successfully!"

                    // Clear password fields after successful change
                    const currentPwdInput = settingsForm.querySelector("#current-password") as HTMLInputElement
                    const newPwdInput = settingsForm.querySelector("#new-password") as HTMLInputElement
                    const confirmPwdInput = settingsForm.querySelector("#confirm-password") as HTMLInputElement

                    if (currentPwdInput) currentPwdInput.value = ""
                    if (newPwdInput) newPwdInput.value = ""
                    if (confirmPwdInput) confirmPwdInput.value = ""
                } catch (passwordError) {
                    console.error("Error changing password:", passwordError)
                    showFormMessage(settingsForm,
                        passwordError instanceof Error ? passwordError.message : "Error changing password",
                        "error")
                    return
                }
            }

            // Show success message
            showFormMessage(settingsForm, successMessage, "success")

        } catch (error) {
            console.error("Error updating profile:", error)
            showFormMessage(settingsForm,
                error instanceof Error ? error.message : "Network error. Please try again.",
                "error")
        }
    })

    settingsElement.appendChild(settingsForm)
}

// Function to load game history dynamically
async function loadGameHistory(gameHistoryElement: HTMLElement, userId: number) {
    // Clear current content and show loading
    gameHistoryElement.innerHTML = `
        <div class="bg-zinc-900 rounded-lg shadow-lg border border-gray-700">
            <div class="p-4 border-b border-gray-600">
                <h3 class="font-medium text-white">Game History</h3>
            </div>
            <div class="p-4">
                <div class="text-center py-4 text-gray-300">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p class="text-gray-300">Loading game history...</p>
                </div>
            </div>
        </div>
    `

    try {
        const gameHistory = await userService.getGameHistory(userId)

        gameHistoryElement.innerHTML = `
            <div class="bg-zinc-900 rounded-lg shadow-lg border border-gray-700">
                <div class="p-4 border-b border-gray-600">
                    <h3 class="font-medium text-white">Game History</h3>
                </div>
                <div class="p-4">
                    ${gameHistory.games.length === 0 ? `
                        <div class="text-gray-400 text-center py-8">
                            No games played yet. Start playing to see your history!
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${gameHistory.games.map((game: any) => `
                                <div class="border border-gray-600 bg-gray-700 rounded-lg p-4">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <span class="font-semibold ${game.result === 'won' ? 'text-green-400' : 'text-red-400'}">
                                                ${game.result === 'won' ? 'Victory' : 'Defeat'}
                                            </span>
                                            <span class="text-gray-300 ml-2">vs ${game.opponent}</span>
                                        </div>
                                        <div class="text-sm text-gray-400">
                                            ${new Date(game.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div class="mt-2 text-sm text-gray-300">
                                        Score: ${game.score} | Duration: ${game.duration}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `
    } catch (error) {
        console.error("Error loading game history:", error)
        gameHistoryElement.innerHTML = `
            <div class="bg-zinc-900 rounded-lg shadow-lg border border-gray-700">
                <div class="p-4 border-b border-gray-600">
                    <h3 class="font-medium text-white">Game History</h3>
                </div>
                <div class="p-4">
                    <div class="text-red-400 text-center py-8">
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
    field.className = "text-gray-300"

    const labelElement = document.createElement("label")
    labelElement.htmlFor = id
    labelElement.textContent = label
    labelElement.className = "block text-sm font-medium text-gray-300 mb-1 text-left"

    const input = document.createElement("input")
    input.type = type
    input.id = id
    input.name = id
    input.value = value
    input.className = "w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"

    field.appendChild(labelElement)
    field.appendChild(input)

    return field
}

// Helper function to show form messages
function showFormMessage(form: HTMLElement, message: string, type: "success" | "error") {
    // Remove any existing messages
    const existingMsg = form.querySelector(".bg-green-800, .bg-red-800")
    if (existingMsg) {
        form.removeChild(existingMsg)
    }

    const messageDiv = document.createElement("div")
    messageDiv.className = type === "success"
        ? "bg-green-800 border border-green-600 text-green-200 px-4 py-3 rounded mt-4"
        : "bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded mt-4"
    messageDiv.textContent = message
    form.appendChild(messageDiv)
}
