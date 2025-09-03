let translations: Record<string, Record<string, string>> = {};
let currentLang = 'en';

// Load the translations JSON
export async function loadTranslations() {
  try {
    const response = await fetch('/js/translation.json');
    translations = await response.json();
    console.log('✅ Translations loaded:', translations);
  } catch (error) {
    console.error('❌ Failed to load translations:', error);
  }
}

// Set the current language and update the text on the page
export function setLanguage(lang: string) {
  console.log(`🌍 Changing language to: ${lang}`);
  currentLang = lang;
  updateText();
}

// Update all text elements with translations
export function updateText() {
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-translate');
    if (!key) return;

    const translated = translations[currentLang]?.[key];
    if (translated) {
      el.textContent = translated;
    } else {
      console.warn(`⚠️ Missing translation for [${key}] in [${currentLang}]`);
    }
  });

  // Also update the visual state of language flags
  updateLanguageFlags()
}

// Update the visual state of language flags
function updateLanguageFlags() {
  const flags = document.querySelectorAll('.lang-flag')
  flags.forEach(flag => {
    const lang = flag.getAttribute('data-lang')
    if (lang === currentLang) {
      flag.classList.add('border-2', 'border-white', 'active')
    } else {
      flag.classList.remove('border-2', 'border-white', 'active')
    }
  })
}

// Get current language
export function getCurrentLanguage(): string {
  return currentLang
}

// Set up the language switcher buttons
export function setupLanguageSwitcher() {
  const flags = document.querySelectorAll('.lang-flag');
  flags.forEach(flag => {
    flag.addEventListener('click', () => {
      const lang = flag.getAttribute('data-lang');
      if (lang) {
        setLanguage(lang);

        // Optional: visually highlight the selected flag
        flags.forEach(f => f.classList.remove('active'));
        flag.classList.add('active');
      }
    });
  });
}


