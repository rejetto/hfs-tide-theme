exports.version = 1
exports.description = "Tide: a lightweight light/dark theme. Choose the main color in the plugin's admin options; the palette adapts automatically. Clear selection and comfortable touch targets."
exports.apiRequired = 13
exports.repo = "rejetto/hfs-tide-theme"
exports.isTheme = true
exports.frontend_css = 'style.css'
exports.preview = ["https://raw.githubusercontent.com/rejetto/hfs-tide-theme/main/screenshots/tide-green.jpg", "https://raw.githubusercontent.com/rejetto/hfs-tide-theme/main/screenshots/tide-violet.jpg"]

exports.config = {
    color: {
        type: 'color',
        frontend: true,
        defaultValue: '#196d56',
        label: "Main color",
        helperText: "Shades are adapted for light and dark mode. Reload the file browser after saving.",
    },
}
