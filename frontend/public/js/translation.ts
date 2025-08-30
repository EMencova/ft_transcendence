let translations: Record<string, Record<string, string>> = {};
export let currentLang = 'en';

// Load translations JSON
export async function loadTranslations() {
    try {
        const response = await fetch('/js/translation.json');
        translations = await response.json();
        console.log('✅ Translations loaded:', translations);

        // Set language from localStorage if available
        const savedLang = localStorage.getItem('lang');
        if (savedLang) {
            currentLang = savedLang;
        }

        updateText(document); // apply translation to current page
    } catch (error) {
        console.error('❌ Failed to load translations:', error);
    }
}

// Set the current language and update the text on the page
export function setLanguage(lang: string) {
    console.log(`🌍 Changing language to: ${lang}`);
    currentLang = lang;
    localStorage.setItem('lang', lang); // save preference
    updateText(document); // translate whole page
}

// ✅ Updated function: works for whole page OR specific container
export function updateText(container: Document | HTMLElement = document) {
    // Update text elements
    const elements = container.querySelectorAll('[data-translate]');
    elements.forEach((el) => {
        const key = el.getAttribute('data-translate');
        if (!key) return;
        const translated = translations[currentLang]?.[key];
        if (translated) el.textContent = translated;
    });

    // Update placeholders
    const placeholders = container.querySelectorAll<HTMLInputElement>('[data-translate-placeholder]');
    placeholders.forEach((el) => {
        const key = el.getAttribute('data-translate-placeholder');
        if (!key) return;
        const translated = translations[currentLang]?.[key];
        if (translated) el.placeholder = translated;
    });
}

// Language switcher setup
export function setupLanguageSwitcher() {
    const flags = document.querySelectorAll('.lang-flag');
    flags.forEach(flag => {
        flag.addEventListener('click', () => {
            const lang = flag.getAttribute('data-lang');
            if (!lang) return;

            setLanguage(lang);

            // Highlight the selected flag
            flags.forEach(f => f.classList.remove('active'));
            flag.classList.add('active');
        });
    });
}




