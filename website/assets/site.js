const THEME_KEY = 'agent-cloud-theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}

function currentThemeLabel(theme) {
  if (theme === 'system') return `Theme: system (${getSystemTheme()})`;
  return `Theme: ${theme}`;
}

function setButtonLabel(button, theme) {
  button.setAttribute('aria-label', currentThemeLabel(theme));
  button.textContent = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';
}

function initThemeToggle() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!(button instanceof HTMLButtonElement)) return;

  const stored = window.localStorage.getItem(THEME_KEY);
  const initial = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';

  applyTheme(initial);
  setButtonLabel(button, initial);

  button.addEventListener('click', () => {
    const theme = window.localStorage.getItem(THEME_KEY) ?? 'system';
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';

    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setButtonLabel(button, next);
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const theme = window.localStorage.getItem(THEME_KEY) ?? 'system';
    if (theme === 'system') applyTheme('system');
    setButtonLabel(button, theme);
  });
}

initThemeToggle();
