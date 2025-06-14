import { currentUser } from '../logic/auth'

export function ProfileView(pushState = true) {
    const main = document.getElementById("mainContent")
    if (!main) return
    // main.innerHTML = `
    //     <div class="p-8">
    //         <h2 class="text-2xl font-bold mb-4">👤 Profile</h2>
    //         <p>User Profile.</p>
    //         <!-- Here the form to update information -->
    //     </div>
    // `

    main.innerHTML = ""
    main.appendChild(createProfileMainContent())

    if (pushState) window.history.pushState({}, "", "/profile")
}

function createProfileMainContent(): HTMLElement {
    // Create the main profile container
    const container = document.createElement("div")
    container.className = "container mx-auto p-8 mt-16"

    // Check if user is logged in
    const CurrentUser = currentUser
    if (!currentUser) {
        const notLoggedIn = document.createElement("div")
        notLoggedIn.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        notLoggedIn.textContent = "You must be logged in to view your profile"
        container.appendChild(notLoggedIn)
        return container
    }

    // Profile header
    const header = document.createElement("div")
    header.className = "flex items-center gap-6 mb-8"

    // Avatar section
    const avatarContainer = document.createElement("div")
    avatarContainer.className = "relative"

    const avatar = document.createElement("img")
    avatar.src = (window as any).currentAvatar || "https://via.placeholder.com/100"
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
    username.textContent = CurrentUser
    username.className = "text-2xl font-bold"
    userInfo.appendChild(username)

    // Stats preview
    const stats = document.createElement("div")
    stats.className = "text-sm text-gray-600"
    stats.innerHTML = `
        <span>Wins: 0</span> | 
        <span>Losses: 0</span> | 
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

        tab.addEventListener("click", () => {
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
    const usernameField = createFormField("Username", "text", CurrentUser ?? "", "username")
    settingsForm.appendChild(usernameField)

    // Email field
    const emailField = createFormField("Email", "email", "user@example.com", "email")
    settingsForm.appendChild(emailField)

    // Two-Factor Authentication
    const twoFAContainer = document.createElement("div")
    twoFAContainer.className = "flex justify-between items-center"

    const twoFALabel = document.createElement("div")
    twoFALabel.innerHTML = "<strong>Two-Factor Authentication</strong><p class='text-sm text-gray-500'>Enable additional security for your account</p>"

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
    passwordTitle.className = "text-lg font-medium mb-4"
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
    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault()

        // Show success message
        const successMsg = document.createElement("div")
        successMsg.className = "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4"
        successMsg.textContent = "Profile updated successfully!"

        // Remove any existing message
        const existingMsg = settingsForm.querySelector(".bg-green-100")
        if (existingMsg) {
            settingsForm.removeChild(existingMsg)
        }

        settingsForm.appendChild(successMsg)

        // In a real app, you would send the form data to your backend here
        console.log("Profile update submitted")
    })

    profileSettings.appendChild(settingsForm)
    container.appendChild(profileSettings)

    // Game History Content (hidden by default)
    const gameHistory = document.createElement("div")
    gameHistory.dataset.content = "game-history"
    gameHistory.style.display = "none"
    gameHistory.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-medium">Recent Games</h3>
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
                <h3 class="font-medium">Friends</h3>
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

        fileInput.addEventListener("change", () => {
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const result = e.target?.result as string
                    avatar.src = result;
                    (window as any).currentAvatar = result
                }
                reader.readAsDataURL(fileInput.files[0])
            }
            document.body.removeChild(fileInput)
        })
    })

    return container
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