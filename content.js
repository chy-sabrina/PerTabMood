function currentTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "get-current-theme") {
    sendResponse({ theme: currentTheme() });
  }
});

chrome.runtime.sendMessage({ type: "content-script-ready" });
