const TAB_STATE_PREFIX = "tab-theme:";
const DEBUGGER_VERSION = "1.3";
const attachedTabs = new Set();

function stateKey(tabId) {
  return `${TAB_STATE_PREFIX}${tabId}`;
}

async function getSavedTheme(tabId) {
  const stored = await chrome.storage.local.get(stateKey(tabId));
  const theme = stored[stateKey(tabId)];
  return theme === "light" || theme === "dark" ? theme : null;
}

async function saveTheme(tabId, theme) {
  await chrome.storage.local.set({ [stateKey(tabId)]: theme });
}

function errorMessage(error) {
  const message = error?.message || String(error);
  if (message.includes("Another debugger")) {
    return "DevTools is already controlling this tab. Close DevTools and try again.";
  }
  if (message.includes("User denied") || message.includes("permission")) {
    return "Browser blocked debugger access. Try disabling 'Block access to debugger' in browser settings.";
  }
  if (message.includes("Cannot access") || message.includes("Receiving end")) {
    return "This page does not allow extensions. Try a normal https:// website.";
  }
  return message;
}

async function attachToTab(tabId) {
  if (attachedTabs.has(tabId)) {
    return { tabId };
  }

  const target = { tabId };
  try {
    await chrome.debugger.attach(target, DEBUGGER_VERSION);
    attachedTabs.add(tabId);
    console.info(`[PerTabMood] Debugger attached to tab ${tabId}`);
    return target;
  } catch (error) {
    throw new Error(errorMessage(error));
  }
}

async function setEmulatedTheme(tabId, theme) {
  if (theme !== "light" && theme !== "dark") {
    throw new Error(`Invalid theme: ${theme}`);
  }

  const target = await attachToTab(tabId);
  try {
    await chrome.debugger.sendCommand(target, "Emulation.setEmulatedMedia", {
      media: "",
      features: [{ name: "prefers-color-scheme", value: theme }],
    });
    console.info(`[PerTabMood] Tab ${tabId} is now ${theme}`);
  } catch (error) {
    throw new Error(`Browser rejected theme emulation: ${errorMessage(error)}`);
  }
}

async function askContentScriptForTheme(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "get-current-theme" });
    if (response?.theme === "dark" || response?.theme === "light") {
      return response.theme;
    }
    throw new Error("The content script returned no theme.");
  } catch (error) {
    throw new Error(`Cannot read this tab's theme: ${errorMessage(error)}`);
  }
}

async function handleMessage(message, sendResponse) {
  const tabId = message.tabId;
  if (!Number.isInteger(tabId)) {
    throw new Error("No valid active tab was found.");
  }

  if (message.type === "get-tab-theme") {
    const savedTheme = await getSavedTheme(tabId);
    const pageTheme = await askContentScriptForTheme(tabId);
    return {
      theme: savedTheme || pageTheme,
      supported: true,
      overridden: Boolean(savedTheme),
      attached: attachedTabs.has(tabId),
    };
  }

  if (message.type === "toggle-tab-theme") {
    const savedTheme = await getSavedTheme(tabId);
    const currentTheme = savedTheme || await askContentScriptForTheme(tabId);
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    await setEmulatedTheme(tabId, nextTheme);
    await saveTheme(tabId, nextTheme);
    return {
      theme: nextTheme,
      supported: true,
      overridden: true,
      attached: true,
    };
  }

  throw new Error(`Unknown message: ${message.type}`);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "content-script-ready") {
    const tabId = sender.tab?.id;
    if (Number.isInteger(tabId)) {
      getSavedTheme(tabId)
        .then((theme) => theme && setEmulatedTheme(tabId, theme))
        .catch((error) => console.warn(`[PerTabMood] ${errorMessage(error)}`));
    }
    return false;
  }

  if (message?.type === "get-tab-theme" || message?.type === "toggle-tab-theme") {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: errorMessage(error) }));
    return true;
  }

  return false;
});

chrome.debugger.onDetach.addListener((source) => {
  if (Number.isInteger(source.tabId)) {
    attachedTabs.delete(source.tabId);
    console.warn(`[PerTabMood] Debugger detached from tab ${source.tabId}`);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  attachedTabs.delete(tabId);
  chrome.storage.local.remove(stateKey(tabId));
});
