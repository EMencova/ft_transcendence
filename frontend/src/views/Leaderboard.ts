import { updateText } from '../../public/js/translation'
import { currentUser } from '../logic/auth'

export function LeaderboardView(push = true) {
	const main = document.getElementById("mainContent")
	if (main) {
		// Update URL if push is true
		if (push) {
			window.history.pushState({ page: "leaderboard" }, "", "/leaderboard")
		}

		if (!currentUser) {
			main.innerHTML = `<p class="text-red-500">You must log in to view the leaderboard.</p>`
			return
		}

		main.innerHTML = `
			<h2 class="text-2xl font-bold mb-4 mt-6" data-translate="leaderboard_title">📊 LeaderBoard</h2>
			<div id="leaderboardContainer">
				<div data-translate="leaderboard_desc" class="mb-4 text-gray-300">The player leaderboard table will go here.</div>
				<div id="leaderboardTable"></div>
			</div>
		`

		// Fetch leaderboard data from server
		fetch("/api/leaderboard")
			.then(res => {
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
				return res.json()
			})
			.then(data => {
				if (Array.isArray(data)) {
					renderLeaderboard(data)
				} else if (Array.isArray(data.leaderboard)) {
					renderLeaderboard(data.leaderboard)
				} else {
					const leaderboardTable = document.getElementById("leaderboardTable")
					if (leaderboardTable) {
						leaderboardTable.innerHTML = `<p class="text-red-500">Unexpected leaderboard data format.</p>`
					}
				}
			})
			.catch(err => {
				const leaderboardTable = document.getElementById("leaderboardTable")
				if (leaderboardTable) {
					leaderboardTable.innerHTML = `<p class="text-red-500">Error loading leaderboard: ${err}</p>`
				}
			})

		if (push) history.pushState({ page: "leaderboard" }, "", "/leaderboard")
	}
}

function renderLeaderboard(data: Array<{ username: string; score: number; rank?: number; updated_at: string }>) {
	const container = document.getElementById("leaderboardTable")
	const descElement = document.querySelector('[data-translate="leaderboard_desc"]') as HTMLElement

	if (!data.length) {
		if (container) {
			container.innerHTML = `<p>No leaderboard data available yet.</p>`
		}
		// Show the description when no data
		if (descElement) {
			descElement.style.display = 'block'
		}
		return
	}

	// Hide the description when we have data
	if (descElement) {
		descElement.style.display = 'none'
	}

	let tableHTML = `
		<table class="min-w-full border-collapse border border-gray-500">
			<thead>
				<tr class="bg-gray-800 text-white">
					<th class="border p-2">#</th>
					<th class="border p-2" data-translate="leaderboard_player">Player</th>
					<th class="border p-2" data-translate="leaderboard_score">Score</th>
					<th class="border p-2" data-translate="leaderboard_rank">Rank</th>
					<th class="border p-2" data-translate="leaderboard_updated">Updated</th>
				</tr>
			</thead>
			<tbody>
	`

	data.forEach((row, idx) => {
		tableHTML += `
			<tr class="text-center">
				<td class="border p-2">${idx + 1}</td>
				<td class="border p-2">${row.username}</td>
				<td class="border p-2">${row.score}</td>
				<td class="border p-2">${row.rank ?? "-"}</td>
				<td class="border p-2">${new Date(row.updated_at).toLocaleString()}</td>
			</tr>
		`
	})

	tableHTML += `</tbody></table>`
	if (container) {
		container.innerHTML = tableHTML

		// Apply translations to the dynamically created table headers
		setTimeout(() => {
			updateText()
		}, 10)
	}
}