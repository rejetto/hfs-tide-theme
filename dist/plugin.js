exports.version = 1.3
exports.changelog = [{ "version": 1.3, "message": "Added an optional Appearance setting to force light or dark mode. Automatic remains the default and respects visitor preferences." }, { "version": 1.2, "message": "Upload and Zip now use the same colors as other toolbar actions. Accent styling is reserved for active states." }, { "version": 1.1, "message": "Disabled toolbar buttons now lose their accent styling and appear subdued instead of standing out." }]
exports.description = "Tide: a lightweight light/dark theme. Choose the main color in the plugin's admin options; the palette adapts automatically. Clear selection and comfortable touch targets."
exports.apiRequired = 13
exports.repo = "rejetto/hfs-tide-theme"
exports.isTheme = true
exports.frontend_css = 'style.css'
exports.preview = ["https://raw.githubusercontent.com/rejetto/hfs-tide-theme/main/screenshots/tide-green.jpg", "https://raw.githubusercontent.com/rejetto/hfs-tide-theme/main/screenshots/tide-violet.jpg"]

exports.config = {
    mode: {
        type: 'select',
        label: "Appearance",
        options: { "Automatic (visitor preference)": 'auto', "Force light": 'light', "Force dark": 'dark' },
        defaultValue: 'auto',
        helperText: "Automatic keeps the visitor's choice or system theme. Forced modes apply to everyone after reloading the file browser.",
    },
    color: {
        type: 'color',
        frontend: true,
        defaultValue: '#196d56',
        label: "Main color",
        helperText: "Shades are adapted for light and dark mode. Reload the file browser after saving.",
    },
}

exports.init = api => ({
    customHtml() {
        const mode = api.getConfig('mode')
        // set the native override before React starts, without overwriting the visitor's saved preference
        return mode === 'light' || mode === 'dark'
            ? { htmlHead: `<script>HFS.forceTheme=${JSON.stringify(mode)}</script>` }
            : {}
    },
})
