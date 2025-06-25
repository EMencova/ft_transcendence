import { currentUser } from '../logic/auth'

export function LeaderboardView(push = true) {
	const main = document.getElementById("mainContent")
	if (main) {
		if (!currentUser) {
			main.innerHTML = `<p class="text-red-500">You must log in to view the leaderboard.</p>`
			return
		}

		main.innerHTML = `
			<h2 class="text-2xl font-bold mb-4 mt-6" data-translate="leaderboard_title">📊 LeaderBoard</h2>
			<div data-translate="leaderboard_desc" id="leaderboardTable"></div>
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
	if (!data.length) {
		if (container) {
			container.innerHTML = `<p>No leaderboard data available yet.</p>`
		}
		return
	}

	let tableHTML = `
		<table class="min-w-full border-collapse border border-gray-500">
			<thead>
				<tr class="bg-gray-800 text-white">
					<th class="border p-2">#</th>
					<th class="border p-2">Player</th>
					<th class="border p-2">Score</th>
					<th class="border p-2">Rank</th>
					<th class="border p-2">Updated</th>
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
	}
}