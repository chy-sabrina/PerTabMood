# PerTabMood

**Every tab, its own mood.**

Ever wanted to read one website in light mode while keeping the rest of your browser in dark mode?

**PerTabMood lets each browser tab have its own native light/dark theme preference.** Switch one tab to light mode without affecting the others. Even two tabs displaying the same website can use different themes.

## What makes it different?

- **Independent per-tab themes** — Switch between light and dark mode for one tab without affecting other tabs.
- **Native theme rendering** — Emulates the tab's `prefers-color-scheme` preference, letting websites render their own light or dark themes.
- **No color inversion** — No filters, forced color changes, or modifications to website theme classes.
- **Remembers your choice** — Stores each tab's theme preference locally.

## How it works

PerTabMood uses the Chromium Debugger API to emulate `prefers-color-scheme` for the selected tab. Websites can then respond to the preference using their existing theme implementation.

For example:

| Browser tab | Theme preference |
|---|---|
| GitHub | Dark |
| ChatGPT Tab A | Dark |
| ChatGPT Tab B | Light |

Each tab can have a different preference, even when multiple tabs display the same website. PerTabMood changes the preference the website receives rather than simply recoloring the page.

> [!IMPORTANT]
> **Website theme settings matter!**
>
> PerTabMood works best on websites whose theme is set to **System**, **Automatic**, or **Follow system settings**.
>
> If a website has its own theme setting, that setting may take priority over the browser preference. For example, if ChatGPT is explicitly set to Light mode, switching the tab's preference to Dark mode **will not necessarily change the website's appearance**.
>
> **To let PerTabMood control the appearance, set the website's theme to follow system settings.**

## Browser compatibility

PerTabMood supports Chromium-based browsers that provide the required Debugger API, including:

- Google Chrome
- Brave
- Other compatible Chromium-based browsers

Safari is not supported because it does not provide the required API for this per-tab override.

## Installation

1. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Other Chromium browsers: their respective extensions page.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the PerTabMood project folder.
5. Open the extension popup on the tab you want to control.
6. Switch the tab between light and dark mode.

## Permissions and browser warning

When PerTabMood connects to a tab, the browser may display a warning such as **"PerTabMood started debugging this browser."** This is expected: the extension uses the Debugger API to override the tab's theme preference.

Allow the connection if you want to use the feature. If you cancel or deny it, the override cannot be applied.

This permission is used to control the selected tab's theme preference. It does not change your operating system's global light/dark setting.

## Troubleshooting

- **Theme does not change:** Check the extension's status message, verify the website is set to follow system settings, and refresh the website.
- **Debugger connection fails:** Close DevTools for the affected tab. Browsers generally allow only one debugger connection per tab.
- **Unsupported page:** Browser-internal pages (`chrome://...`), extension pages, and the Web Store cannot be controlled.
- **Preference is no longer available:** Closing or removing a tab removes its saved theme override.

A website must respond to `prefers-color-scheme` for PerTabMood's override to affect its appearance. If the theme still does not change, the website may enforce its own theme independently of the browser preference.
