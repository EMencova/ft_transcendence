export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `<span data-translate="counter_text">count is</span> ${counter}`
  }
  element.setAttribute("data-translate", "counter_button")
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}

