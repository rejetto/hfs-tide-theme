// HFS_CONFIG must point to the config of a disposable HFS instance
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { setTimeout: delay } = require('node:timers/promises')
const YAML = require('../../hfs/node_modules/yaml')
const { chromium } = require('../../hfs/node_modules/playwright')
const plugin = require('./dist/plugin')

async function check() {
    let mode
    const api = plugin.init({ getConfig: () => mode })
    for (mode of [undefined, 'auto', 'invalid', '</script>']) assert.deepEqual(api.customHtml(), {})
    for (mode of ['light', 'dark']) assert(api.customHtml().htmlHead.includes(JSON.stringify(mode)))
    assert.equal(plugin.config.mode.defaultValue, 'auto')
    assert(process.env.HFS_CONFIG, 'Set HFS_CONFIG to a disposable server config')
    const original = fs.readFileSync(process.env.HFS_CONFIG, 'utf8')
    const browser = await chromium.launch()
    try {
        const page = await browser.newPage({ colorScheme: 'dark' })
        const url = process.env.HFS_URL || 'http://127.0.0.1:8097/'
        for (mode of ['auto', 'light', 'dark', 'auto']) {
            const config = YAML.parse(original)
            config.plugins_config ??= {}
            config.plugins_config['tide-theme'] = { ...config.plugins_config['tide-theme'], mode }
            fs.writeFileSync(process.env.HFS_CONFIG, YAML.stringify(config))
            // wait for HFS's config watcher before loading the page
            let loaded = false
            for (let i = 0; i < 50 && !loaded; i++) {
                const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text())
                loaded = mode === 'auto' ? !html.includes('<script>HFS.forceTheme=')
                    : html.includes(`<script>HFS.forceTheme=${JSON.stringify(mode)}`)
                if (!loaded) await delay(100)
            }
            assert(loaded, 'Config did not reach HTML')
            await page.goto(url)
            await page.locator('#options-button').click()
            assert.equal(await page.locator('#option-theme').isVisible(), mode === 'auto')
            await page.locator('.dialog-closer').click()
            const preference = mode === 'light' ? 'dark' : 'light'
            await page.evaluate(value => { HFS.state.theme = value }, preference)
            await page.locator('body.theme-' + (mode === 'auto' ? preference : mode)).waitFor()
            await page.reload()
            await page.locator('body.theme-' + (mode === 'auto' ? preference : mode)).waitFor()
            assert.equal(await page.evaluate(() => HFS.state.theme), preference)
            console.log(`${mode}: native override, selector visibility and saved preference passed`)
        }
    }
    finally {
        fs.writeFileSync(process.env.HFS_CONFIG, original)
        await browser.close()
    }
}
check().catch(error => { console.error(error); process.exitCode = 1 })
