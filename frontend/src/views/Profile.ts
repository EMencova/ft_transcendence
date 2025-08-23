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
    const container = document.createElement("div")
    container.className = "container mx-auto p-8 mt-16"

    if (!currentUser || !currentUserId) {
        const notLoggedIn = document.createElement("div")
        notLoggedIn.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        notLoggedIn.dataset.translate = "profile_login_required"
        container.appendChild(notLoggedIn)
        return container
    }

    const loadingDiv = document.createElement("div")
    loadingDiv.className = "text-center py-8"
    loadingDiv.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p data-translate="profile_loading"></p>
    `
    container.appendChild(loadingDiv)

    try {
        const profileData = await userService.getProfile(currentUserId)
        if (profileData.avatar && !localStorage.getItem("currentAvatar")) {
            updateCurrentAvatar(profileData.avatar)
        }

        container.removeChild(loadingDiv)
        createProfileContent(container, profileData)
    } catch (error) {
        console.error("Error loading profile:", error)
        container.removeChild(loadingDiv)

        const errorDiv = document.createElement("div")
        errorDiv.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        errorDiv.dataset.translate = "profile_error_loading"
        container.appendChild(errorDiv)
    }

    return container
}

function createProfileContent(container: HTMLElement, profileData: any) {
    const header = document.createElement("div")
    header.className = "flex items-center gap-6 mb-8"

    const avatarContainer = document.createElement("div")
    avatarContainer.className = "relative"

    const avatar = document.createElement("img")
    avatar.src = profileData.avatar || "/avatar.png"
    avatar.alt = "Profile avatar"
    avatar.className = "w-24 h-24 rounded-full object-cover"

    const changeAvatarBtn = document.createElement("button")
    changeAvatarBtn.className = "absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-2 shadow-md"
    changeAvatarBtn.innerHTML = "📷"
    changeAvatarBtn.dataset.translate = "profile_change_avatar"

    avatarContainer.appendChild(avatar)
    avatarContainer.appendChild(changeAvatarBtn)

    const userInfo = document.createElement("div")
    const username = document.createElement("h1")
    username.textContent = profileData.username
    username.className = "text-2xl font-bold"
    userInfo.appendChild(username)

    const stats = document.createElement("div")
    stats.className = "text-sm text-gray-600"
    stats.innerHTML = `
        <span data-translate="profile_wins">Wins: ${profileData.wins || 0}</span> | 
        <span data-translate="profile_losses">Losses: ${profileData.losses || 0}</span> | 
        <span data-translate="profile_rank">Rank: Rookie</span>
    `
    userInfo.appendChild(stats)

    header.appendChild(avatarContainer)
    header.appendChild(userInfo)
    container.appendChild(header)

    // Tabs
    const tabs = document.createElement("div")
    tabs.className = "border-b border-gray-200 mb-6"

    const tabsList = [
        { key: "profile_settings_title", tab: "profile-settings" },
        { key: "profile_game_history_title", tab: "game-history" },
        { key: "profile_friends_title", tab: "friends" }
    ]
    const tabsContainer = document.createElement("div")
    tabsContainer.className = "flex space-x-8"

    tabsList.forEach((tabData, index) => {
        const tab = document.createElement("button")
        tab.dataset.tab = tabData.tab
        tab.dataset.translate = tabData.key
        tab.className = index === 0
            ? "border-b-2 border-orange-500 py-4 px-1 text-orange-500 font-medium"
            : "py-4 px-1 text-gray-500 hover:text-orange-500"

        tab.addEventListener("click", async () => {
            tabsContainer.querySelectorAll("button").forEach(t => {
                t.className = "py-4 px-1 text-gray-500 hover:text-orange-500"
            })
            tab.className = "border-b-2 border-orange-500 py-4 px-1 text-orange-500 font-medium"

            const allContent = container.querySelectorAll("[data-content]")
            allContent.forEach(c => (c as HTMLElement).style.display = "none")

            const contentToShow = container.querySelector(`[data-content="${tab.dataset.tab}"]`)
            if (contentToShow) {
                (contentToShow as HTMLElement).style.display = "block"

                if (tab.dataset.tab === "game-history") {
                    await loadGameHistory(contentToShow as HTMLElement, profileData.id)
                }
                if (tab.dataset.tab === "friends") {
                    await loadFriendsTab(contentToShow as HTMLElement, profileData.id)
                }
            }
        })

        tabsContainer.appendChild(tab)
    })

    tabs.appendChild(tabsContainer)
    container.appendChild(tabs)

    const profileSettingsContent = document.createElement("div")
    profileSettingsContent.dataset.content = "profile-settings"
    profileSettingsContent.style.display = "block"
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

    changeAvatarBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"
        fileInput.style.display = "none"
        document.body.appendChild(fileInput)

        fileInput.addEventListener("change", async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                if (file.size > 5 * 1024 * 1024) { alert("profile_avatar_error_size"); return }
                if (!file.type.startsWith("image/")) { alert("profile_avatar_error_type"); return }

                try {
                    const avatarUrl = await userService.updateAvatar(file)
                    avatar.src = avatarUrl.avatar
                    updateCurrentAvatar(avatarUrl.avatar)
                    alert("profile_avatar_success")
                } catch (error) {
                    console.error("Avatar upload error:", error)
                    alert("profile_avatar_upload_error")
                }
            }
            document.body.removeChild(fileInput)
        })

        fileInput.click()
    })
}

function createProfileSettingsContent(settingsElement: HTMLElement, profileData: any) {
    settingsElement.className = "bg-white rounded-lg shadow p-6"

    const settingsForm = document.createElement("form")
    settingsForm.className = "space-y-6"

    const personalInfoSection = document.createElement("div")
    personalInfoSection.className = "text-gray-700"

    const personalInfoTitle = document.createElement("h3")
    personalInfoTitle.dataset.translate = "profile_change_personal_info"
    personalInfoTitle.className = "text-lg font-medium mb-4 text-black"
    personalInfoSection.appendChild(personalInfoTitle)

    const usernameField = createFormField("profile_username", "text", profileData.username, "username")
    usernameField.className = "text-gray-700 mb-4"
    personalInfoSection.appendChild(usernameField)

    const emailField = createFormField("profile_email", "email", profileData.email, "email")
    emailField.className = "text-gray-700"
    personalInfoSection.appendChild(emailField)

    settingsForm.appendChild(personalInfoSection)

    const passwordSection = document.createElement("div")
    passwordSection.className = "pt-4 border-t border-gray-200 text-gray-700"

    const passwordTitle = document.createElement("h3")
    passwordTitle.dataset.translate = "profile_change_password"
    passwordTitle.className = "text-lg font-medium mb-4 text-black"
    passwordSection.appendChild(passwordTitle)

    const currentPasswordLabel = document.createElement("label")
    currentPasswordLabel.dataset.translate = "profile_current_password"
    currentPasswordLabel.className = "block text-sm font-medium text-gray-700 mb-1 text-left"
    passwordSection.appendChild(currentPasswordLabel)
    passwordSection.appendChild(createPasswordInput("current-password", "profile_current_password_placeholder", "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"))

    const newPasswordLabel = document.createElement("label")
    newPasswordLabel.dataset.translate = "profile_new_password"
    newPasswordLabel.className = "block text-sm font-medium text-gray-700 mb-1 mt-4 text-left"
    passwordSection.appendChild(newPasswordLabel)
    passwordSection.appendChild(createPasswordInput("new-password", "profile_new_password_placeholder", "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"))

    const confirmPasswordLabel = document.createElement("label")
    confirmPasswordLabel.dataset.translate = "profile_confirm_new_password"
    confirmPasswordLabel.className = "block text-sm font-medium text-gray-700 mb-1 mt-4 text-left"
    passwordSection.appendChild(confirmPasswordLabel)
    passwordSection.appendChild(createPasswordInput("confirm-password", "profile_confirm_new_password_placeholder", "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"))

    settingsForm.appendChild(passwordSection)

    const saveButton = document.createElement("button")
    saveButton.type = "submit"
    saveButton.className = "bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded"
    saveButton.dataset.translate = "profile_save_changes"
    settingsForm.appendChild(saveButton)

    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(settingsForm as HTMLFormElement)
        const username = formData.get("username") as string
        const email = formData.get("email") as string
        const currentPassword = formData.get("current-password") as string
        const newPassword = formData.get("new-password") as string
        const confirmPassword = formData.get("confirm-password") as string

        const isPasswordChange = currentPassword || newPassword || confirmPassword

        if (isPasswordChange) {
            if (!currentPassword) { showFormMessage(settingsForm, "profile_current_password_required", "error"); return }
            if (!newPassword) { showFormMessage(settingsForm, "profile_new_password_required", "error"); return }
            if (newPassword !== confirmPassword) { showFormMessage(settingsForm, "profile_new_password_mismatch", "error"); return }
            if (newPassword.length < 6) { showFormMessage(settingsForm, "profile_new_password_length", "error"); return }
        }

        try {
            await userService.updateProfile({ username, email })
            const usernameElement = document.querySelector("h1")
            if (usernameElement) usernameElement.textContent = username

            let successMessage = "profile_update_success"
            if (isPasswordChange) {
                try { await userService.changePassword(currentPassword, newPassword) } 
                catch (err) { showFormMessage(settingsForm, "profile_password_change_error", "error"); return }
            }

            showFormMessage(settingsForm, successMessage, "success")
        } catch (error) {
            showFormMessage(settingsForm, "profile_update_error", "error")
        }
    })

    settingsElement.appendChild(settingsForm)
}

async function loadGameHistory(gameHistoryElement: HTMLElement, userId: number) {
    gameHistoryElement.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
                <h3 data-translate="profile_game_history_title" class="font-medium text-black"></h3>
            </div>
            <div class="p-4">
                <div class="text-center py-4 text-gray-600">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p data-translate="profile_loading_games"></p>
                </div>
            </div>
        </div>
    `

    try {
        const gameHistory = await userService.getGameHistory(userId)
        if (!gameHistory.games.length) {
            gameHistoryElement.innerHTML = `
                <div class="bg-white rounded-lg shadow p-4 text-gray-500 text-center" data-translate="profile_no_games"></div>
            `
        } else {
            gameHistoryElement.innerHTML = `
                <div class="bg-white rounded-lg shadow p-4 space-y-3">
                    ${gameHistory.games.map((game: any) => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <span class="${game.result==='won'?'text-green-600':'text-red-600'}" data-translate="${game.result==='won'?'profile_game_victory':'profile_game_defeat'}"></span>
                                    <span class="text-gray-500 ml-2">${game.opponent}</span>
                                </div>
                                <div class="text-sm text-gray-500">${new Date(game.date).toLocaleDateString()}</div>
                            </div>
                            <div class="mt-2 text-sm text-gray-600" data-translate="profile_game_score_duration">Score: ${game.score} | Duration: ${game.duration}</div>
                        </div>
                    `).join('')}
                </div>
            `
        }
    } catch {
        gameHistoryElement.innerHTML = `
            <div class="bg-white rounded-lg shadow p-4 text-red-500 text-center" data-translate="profile_game_history_error"></div>
        `
    }
}

function createFormField(key: string, type: string, value: string, id: string): HTMLElement {
    const field = document.createElement("div")
    field.className = "text-gray-700"

    const labelElement = document.createElement("label")
    labelElement.htmlFor = id
    labelElement.dataset.translate = key
    labelElement.className = "block text-sm font-medium text-gray-700 mb-1 text-left"

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

function showFormMessage(form: HTMLElement, messageKey: string, type: "success" | "error") {
    const existingMsg = form.querySelector(".bg-green-100, .bg-red-100")
    if (existingMsg) form.removeChild(existingMsg)

    const messageDiv = document.createElement("div")
    messageDiv.dataset.translate = messageKey
    messageDiv.className = type === "success"
        ? "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4"
        : "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4"
    form.appendChild(messageDiv)
}
