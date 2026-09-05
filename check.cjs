// run against a disposable HFS instance with Tide enabled, two entries and a folder
const assert = require('node:assert/strict')
const { chromium } = require('../../hfs/node_modules/playwright')

async function check() {
    const browser = await chromium.launch()
    try {
        for (const width of [1280, 673, 672, 601, 600, 390, 320]) {
            for (const colorScheme of ['light', 'dark']) {
                const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme,
                    isMobile: width < 600, hasTouch: width < 600 })
                const errors = []
                page.on('pageerror', error => errors.push(error.message))
                await page.goto(process.env.HFS_URL || 'http://127.0.0.1:8097/?lang=it')
                await page.locator('ul.dir > li').nth(1).waitFor()
                assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).getPropertyValue('--tide-color').trim()), '#196d56')
                const breadcrumbBackground = await page.locator('.breadcrumb').last().evaluate(e => getComputedStyle(e).backgroundColor)
                assert.notEqual(breadcrumbBackground, 'rgba(0, 0, 0, 0)')
                await page.locator('ul.dir > li.folder .link-wrapper > a').first().click()
                await page.locator('#breadcrumb-parent.disabled').waitFor({ state: 'detached' })
                // wait for the breadcrumb background transition to finish
                await page.waitForFunction(() => getComputedStyle(document.getElementById('breadcrumb-home')).backgroundColor === 'rgba(0, 0, 0, 0)')
                assert.equal(await page.locator('.breadcrumb').last().evaluate(e => getComputedStyle(e).backgroundColor), breadcrumbBackground)
                assert.equal(await page.locator('#breadcrumb-home').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)')
                await page.locator('#breadcrumb-parent').click()
                await page.locator('ul.dir > li').nth(1).waitFor()
                await page.locator('#select-button').click()
                await page.locator('ul.dir input[type=checkbox]').nth(1).check()
                assert.notEqual(await page.locator('ul.dir > li').nth(1).evaluate(e => getComputedStyle(e).backgroundColor),
                    await page.locator('ul.dir > li').nth(0).evaluate(e => getComputedStyle(e).backgroundColor))
                await checkLayout()
                await page.locator('#filter').fill('no-match-tide-92731')
                await page.waitForFunction(() => !document.querySelector('ul.dir > li'))
                await page.locator('#filter').fill('')
                await page.locator('ul.dir > li').nth(1).waitFor()
                await page.locator('#options-button').click()
                await page.locator('.dialog').waitFor()
                await checkLayout()
                await page.locator('.dialog-closer').click()
                await page.evaluate(() => { HFS.state.tile_size = 5 })
                await page.locator('.tiles-mode').waitFor()
                await checkLayout()
                await page.evaluate(() => { HFS.state.tile_size = 0 })
                await page.locator('.list-mode').waitFor()
                if (process.env.SCREENSHOTS) {
                    await page.screenshot({ path: `${process.env.SCREENSHOTS}/tide-${width}-${colorScheme}.png` })
                }
                if (width === 1280) {
                    await page.evaluate(() => {
                        for (const type of ['info', 'success', 'warning', 'error'])
                            HFS.toast(type, type, { timeout: 60000 })
                    })
                    await page.locator('.toast').nth(3).waitFor()
                    for (const color of ['#196d56', '#7048e8', '#ffff00', '#ffffff', '#000000']) {
                        const style = await page.addStyleTag({ content: `:root { --tide-theme-color: ${color} }` })
                        const contrasts = await page.locator('#zip-button button, .toast').evaluateAll(elements => elements.map(button => {
                            const css = getComputedStyle(button)
                            const canvas = document.createElement('canvas')
                            canvas.width = canvas.height = 1
                            const context = canvas.getContext('2d')
                            const values = [css.color, css.backgroundColor].map(color => {
                                context.fillStyle = color
                                context.fillRect(0, 0, 1, 1)
                                const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => {
                                    v /= 255
                                    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
                                })
                                return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
                            })
                            return (Math.max(...values) + .05) / (Math.min(...values) + .05)
                        }))
                        assert(contrasts.every(value => value >= 4.5), `${color} ${colorScheme}: insufficient button/toast contrast (${contrasts})`)
                        await style.evaluate(e => e.remove())
                    }
                }
                assert.deepEqual(errors, [])
                await page.close()
                console.log(`${width}px ${colorScheme}: breadcrumbs, selection, filter, dialog, tiles and toolbar passed`)

                async function checkLayout() {
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow')
                    const bar = await page.locator('.bottom-bar-stack-positioner').boundingBox()
                    assert(bar.y >= 0 && bar.y + bar.height <= 845, 'toolbar outside viewport')
                    assert(await page.locator('#options-button .label').isVisible(), 'toolbar label hidden')
                }
            }
        }
    }
    finally {
        await browser.close()
    }
}
check().catch(error => { console.error(error); process.exitCode = 1 })
