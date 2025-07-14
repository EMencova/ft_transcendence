export function createPasswordInput(id: string, placeholder: string, customInputClass?: string): HTMLDivElement {
	const wrapper = document.createElement("div")
	wrapper.className = "relative"

	const input = document.createElement("input")
	input.id = id
	input.name = id
	input.type = "password"
	input.placeholder = placeholder
	input.className = customInputClass || "w-full p-2 border rounded pr-10"

	const toggleBtn = document.createElement("button")
	toggleBtn.type = "button"
	toggleBtn.innerText = "👁"
	toggleBtn.className = "absolute right-2 top-2 text-gray-600 hover:text-black"
	toggleBtn.dataset.toggle = id

	toggleBtn.addEventListener("click", () => {
		if (input.type === "password") {
			input.type = "text"
			toggleBtn.innerText = "🙈"
		} else {
			input.type = "password"
			toggleBtn.innerText = "👁"
		}
	})

	wrapper.appendChild(input)
	wrapper.appendChild(toggleBtn)

	return wrapper
}
