


export function Pong(): HTMLElement {
	const container = document.createElement('div')
	container.className = 'flex flex-col bg-black text-white h-screen w-full'

	// Header
	const header = createElement('header', 'flex justify-between items-center p-4 bg-gray-900', container)
	const title = createElement('h1', 'text-2xl font-bold', header)
	title.textContent = 'PONG'

	const avatarContainer = createElement('div', 'relative', header)
	avatarContainer.id = 'avatar-container'

	const avatarButton = createElement('button',
		'w-12 h-12 p-0 rounded-full focus:outline-none focus:ring-2 focus:ring-white',
		avatarContainer
	)
	avatarButton.id = 'avatar-button'

	const avatarImg = createElement('img', 'w-full h-full object-cover', avatarButton) as HTMLImageElement
	avatarImg.src = '/avatar.png'
	avatarImg.alt = 'User avatar'

	const userProfile = createElement('div',
		'hidden absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-10',
		avatarContainer
	)
	userProfile.id = 'user-profile'

	// Profile Content
	const profileHeader = createElement('div', 'flex items-center space-x-4 mb-4', userProfile)
	const profileImg = createElement('img', 'w-12 h-12 rounded-full', profileHeader) as HTMLImageElement
	profileImg.src = '/avatar.png'
	profileImg.alt = 'User avatar'

	const profileText = createElement('div', '', profileHeader)
	createElement('h3', 'font-bold', profileText).textContent = 'Player One'
	createElement('p', 'text-gray-400 text-sm', profileText).textContent = 'Online'

	const stats = createElement('div', 'space-y-2', userProfile);
	[
		['Games Played', '42'],
		['Wins', '24'],
		['Losses', '18']
	].forEach(([label, value]) => {
		const stat = createElement('div', 'flex justify-between', stats)
		createElement('span', '', stat).textContent = label
		createElement('span', '', stat).textContent = value
	})

	const editSection = createElement('div', 'mt-4 pt-4 border-t border-gray-700', userProfile)
	const editButton = createElement('button', 'w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm', editSection)
	editButton.textContent = 'Edit Profile'

	// Game Board
	const gameBoard = createElement('div', 'flex-1 flex flex-col items-center justify-center relative', container)

	// Score
	const score = createElement('div', 'absolute top-8 left-0 right-0 flex justify-center space-x-24', gameBoard)
	createElement('span', 'text-4xl font-mono', score).textContent = '0'
	createElement('span', 'text-4xl font-mono', score).textContent = '0'

	// Center Line
	const lineWrapper = createElement('div', 'absolute inset-0 flex justify-center', gameBoard)
	createElement('div', 'w-1 h-full bg-white opacity-50 dashed-line', lineWrapper)

	// Game Elements
	const field = createElement('div', 'w-full max-w-4xl h-96 relative', gameBoard)
	createElement('div', 'absolute left-4 top-1/2 -translate-y-1/2 w-3 h-20 bg-white', field).id = 'left-paddle'
	createElement('div', 'absolute right-4 top-1/2 -translate-y-1/2 w-3 h-20 bg-white', field).id = 'right-paddle'
	createElement('div', 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-sm', field).id = 'ball'

	// Controls
	const controls = createElement('div', 'p-4 flex justify-center', container)
	const controlsText = createElement('div', 'text-center', controls)
	createElement('p', 'text-gray-400 mb-2', controlsText).textContent = 'CONTROLS'
	createElement('p', 'text-sm text-gray-500', controlsText).textContent = 'Left Paddle: W / S'
	createElement('p', 'text-sm text-gray-500', controlsText).textContent = 'Right Paddle: ↑ / ↓'

	// Profile toggle logic
	avatarButton.addEventListener('click', () => {
		userProfile.classList.toggle('hidden')
	})

	return container
}

function createElement<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className = '',
	parent?: HTMLElement
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag)
	if (className) el.className = className
	if (parent) parent.appendChild(el)
	return el
}

