const status = document.querySelector("#status");
const toggle = document.querySelector("#toggle");
const diagnostics = document.querySelector("#diagnostics");

function setStatus(theme, supported = true, overridden = false) {
  status.textContent = overridden
    ? `This tab is using ${theme} mode`
    : `Detected device mode: ${theme}`;
  toggle.textContent = `Switch to ${theme === "dark" ? "light" : "dark"}`;
  toggle.disabled = !supported;
  if (!supported) {
    status.textContent = "Theme emulation is unavailable on this page.";
  }
}

function setDiagnostics(response) {
  diagnostics.textContent = response.attached
    ? "Per-tab browser emulation is active."
    : "Browser emulation will start when you toggle.";
}

async function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab is available.");
  }

  const response = await sendMessage({ type: "get-tab-theme", tabId: tab.id });
  if (response?.error) {
    throw new Error(response.error);
  }

  setStatus(response.theme, response.supported, response.overridden);
  setDiagnostics(response);
  toggle.addEventListener("click", async () => {
    toggle.disabled = true;
    diagnostics.textContent = "Requesting browser per-tab theme permission...";
    try {
      const result = await sendMessage({ type: "toggle-tab-theme", tabId: tab.id });
      if (result?.error) {
        throw new Error(result.error);
      }
      setStatus(result.theme, result.supported, result.overridden);
      setDiagnostics(result);
    } catch (error) {
      status.textContent = `Could not switch theme: ${error.message}`;
      diagnostics.textContent = "Open <browser>://extensions, reload this extension, then try again.";
    } finally {
      toggle.disabled = false;
    }
  });
}

initialize().catch((error) => {
  status.textContent = error.message;
  toggle.textContent = "Unavailable on this page";
  diagnostics.textContent = "Check that this is a normal website tab and reload the extension.";
});
