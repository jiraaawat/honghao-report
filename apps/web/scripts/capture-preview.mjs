import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
})
await page.goto('http://localhost:3000/preview', { waitUntil: 'networkidle' })
await page.screenshot({
  path: 'public/screenshots/app-preview.png',
  fullPage: true,
})
await browser.close()
console.log('Screenshot saved to public/screenshots/app-preview.png')
