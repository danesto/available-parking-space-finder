/**
 * Inline script for layout.tsx. Chrome can fire `beforeinstallprompt` before
 * React hydrates, so we stash the event on window for InstallBanner to use.
 */
export const captureInstallPromptScript = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;});`;
