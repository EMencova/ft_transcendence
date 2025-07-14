//added

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: {
        className?: string,
        textContent?: string,
        htmlFor?: string,
        id?: string,
        type?: string,
        required?: boolean,
        value?: string,
        [key: string]: any
    }
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);

    if (options) {
        Object.entries(options).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key === 'htmlFor') {
                (el as HTMLLabelElement).htmlFor = value;
            } else {
                el.setAttribute(key, value);
            }
        });
    }

    return el;
}