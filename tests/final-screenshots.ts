import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, 'screenshots', 'final')
const BASE_URL = 'http://127.0.0.1:3001'

async function run() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  const page = await context.newPage()

  // Skip onboarding
  await page.addInitScript(() => {
    localStorage.setItem('sm_onboarding_seen', 'true')
    localStorage.setItem('sm_pwa_dismissed', 'true')
  })

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.fill('input[placeholder*="Email"]', 'buyer@example.com')
  await page.fill('input[placeholder*="Password"]', 'password123')
  await page.locator('form button[type="submit"]').click()
  await page.waitForTimeout(3000)
  await page.waitForLoadState('networkidle')
  
  // Dismiss any overlays
  await page.evaluate(() => {
    localStorage.setItem('sm_onboarding_seen', 'true')
    localStorage.setItem('sm_pwa_dismissed', 'true')
  })
  const backdrop = page.locator('.fixed.inset-0').first()
  if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
    await backdrop.click({ position: { x: 10, y: 10 }, force: true })
    await page.waitForTimeout(500)
  }

  // Screenshot marketplace
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'marketplace.png'), fullPage: false })
  console.log('📸 Marketplace screenshot saved')

  // Scroll down to see services
  await page.evaluate(() => window.scrollBy(0, 400))
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'marketplace-services.png'), fullPage: false })
  console.log('📸 Marketplace services screenshot saved')

  // Scroll to bottom to see FAB + nav
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'marketplace-bottom.png'), fullPage: false })
  console.log('📸 Marketplace bottom (FAB) screenshot saved')

  // Wallet
  await page.click('[aria-label="Wallet"]')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'wallet.png'), fullPage: false })
  console.log('📸 Wallet screenshot saved')

  // Orders
  await page.click('[aria-label="Orders"]')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'orders.png'), fullPage: false })
  console.log('📸 Orders screenshot saved')

  // Profile
  await page.click('[aria-label="Profile"]')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile.png'), fullPage: false })
  console.log('📸 Profile screenshot saved')

  await browser.close()
  console.log('\n✅ All final screenshots saved to', SCREENSHOTS_DIR)
}

run().catch(console.error)
