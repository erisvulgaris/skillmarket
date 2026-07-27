import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const SCREENSHOTS_DIR = join(__dirname, 'screenshots')
const BASE_URL = 'http://127.0.0.1:3001'

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true })
}

async function screenshot(page: any, name: string) {
  const path = join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  console.log(`📸 Screenshot saved: ${name}.png`)
  return path
}

async function runTests() {
  await ensureDir(SCREENSHOTS_DIR)
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    deviceScaleFactor: 3,
  })
  const page = await context.newPage()

  // Collect console errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  try {
    // === TEST 1: Auth Screen ===
    console.log('\n🧪 TEST 1: Auth Screen')
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    
    // Set localStorage to skip onboarding and PWA prompt
    await page.evaluate(() => {
      localStorage.setItem('sm_onboarding_seen', 'true')
      localStorage.setItem('sm_pwa_dismissed', 'true')
    })
    
    // Wait for either auth screen or loading to finish
    await page.waitForTimeout(3000)
    
    // Debug: log page content
    const bodyText = await page.locator('body').innerText()
    console.log('  Page text (first 200 chars):', bodyText.substring(0, 200))
    
    await screenshot(page, '01-auth-screen')
    
    // Check if login form is visible
    const emailField = await page.locator('input[placeholder*="Email"]').isVisible({ timeout: 5000 }).catch(() => false)
    const passwordField = await page.locator('input[placeholder*="Password"]').isVisible({ timeout: 2000 }).catch(() => false)
    const signInButton = await page.locator('form button[type="submit"]').isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`  Email field: ${emailField ? '✅' : '❌'}`)
    console.log(`  Password field: ${passwordField ? '✅' : '❌'}`)
    console.log(`  Sign In button: ${signInButton ? '✅' : '❌'}`)

    // === TEST 2: Login Flow ===
    console.log('\n🧪 TEST 2: Login Flow')
    await page.fill('input[placeholder*="Email or username"]', 'buyer@example.com')
    await page.fill('input[placeholder*="Password"]', 'password123')
    await screenshot(page, '02-login-filled')
    
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(3000) // Wait for reload
    await page.waitForLoadState('networkidle')
    
    // Dismiss any overlays (onboarding tour, PWA prompt)
    await page.evaluate(() => {
      localStorage.setItem('sm_onboarding_seen', 'true')
      localStorage.setItem('sm_pwa_dismissed', 'true')
    })
    // Click any remaining backdrop overlay
    const backdrop = page.locator('.fixed.inset-0').first()
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ position: { x: 10, y: 10 }, force: true })
      await page.waitForTimeout(500)
    }
    
    await screenshot(page, '03-marketplace-loaded')
    
    // Check marketplace elements
    const welcomeText = await page.locator('text=Welcome back').isVisible().catch(() => false)
    const searchBar = await page.locator('text=Search services').isVisible().catch(() => false)
    console.log(`  Welcome back: ${welcomeText ? '✅' : '❌'}`)
    console.log(`  Search bar: ${searchBar ? '✅' : '❌'}`)

    // === TEST 3: Marketplace Browse ===
    console.log('\n🧪 TEST 3: Marketplace Browse')
    // Scroll down to see categories and services
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(500)
    await screenshot(page, '04-marketplace-scroll')
    
    // Check categories
    const categories = await page.locator('[class*="overflow-x-auto"] >> text=/Design|Development|Writing|Marketing/').count()
    console.log(`  Categories visible: ${categories > 0 ? '✅' : '❌'} (${categories})`)
    
    // Check services
    const serviceCards = await page.locator('[class*="rounded-3xl"]').count()
    console.log(`  Service cards: ${serviceCards > 0 ? '✅' : '❌'} (${serviceCards})`)
    
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)

    // === TEST 4: Search ===
    console.log('\n🧪 TEST 4: Search')
    await page.click('text=Search services', { force: true })
    await page.waitForTimeout(1000)
    await screenshot(page, '05-search-view')
    
    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('logo')
      await page.waitForTimeout(1500) // Wait for debounce
      await screenshot(page, '06-search-results')
      const results = await page.locator('[class*="card"]').count()
      console.log(`  Search results: ${results > 0 ? '✅' : '❌'} (${results})`)
    }

    // Go back to marketplace
    await page.click('[aria-label="Home"]').catch(() => page.locator('text=Home').first().click())
    await page.waitForTimeout(1000)

    // === TEST 5: Wallet ===
    console.log('\n🧪 TEST 5: Wallet')
    await page.click('[aria-label="Wallet"]')
    await page.waitForTimeout(1500)
    await screenshot(page, '07-wallet-view')
    
    const balanceCard = await page.locator('text=Available Balance').isVisible().catch(() => false)
    const scCurrency = await page.locator('text=SC').first().isVisible().catch(() => false)
    console.log(`  Balance card: ${balanceCard ? '✅' : '❌'}`)
    console.log(`  SC currency: ${scCurrency ? '✅' : '❌'}`)
    
    // Scroll to see transactions
    await page.evaluate(() => window.scrollBy(0, 400))
    await page.waitForTimeout(500)
    await screenshot(page, '08-wallet-transactions')

    // === TEST 6: Orders ===
    console.log('\n🧪 TEST 6: Orders')
    await page.click('[aria-label="Orders"]')
    await page.waitForTimeout(1500)
    await screenshot(page, '09-orders-view')
    
    const orderList = await page.locator('[class*="card"]').count()
    console.log(`  Order cards: ${orderList > 0 ? '✅' : '❌'} (${orderList})`)
    
    // Check for empty state or orders
    const emptyState = await page.locator('text=No orders').isVisible().catch(() => false)
    const hasOrders = await page.locator('text=ORD-').first().isVisible().catch(() => false)
    console.log(`  Has orders: ${hasOrders ? '✅' : '❌'}`)
    console.log(`  Empty state: ${emptyState ? '⚠️ (no orders)' : '❌'}`)

    // === TEST 7: Messages ===
    console.log('\n🧪 TEST 7: Messages')
    await page.click('[aria-label="Chats"]')
    await page.waitForTimeout(1500)
    await screenshot(page, '10-messages-view')

    // === TEST 8: Profile ===
    console.log('\n🧪 TEST 8: Profile')
    await page.click('[aria-label="Profile"]')
    await page.waitForTimeout(1500)
    await screenshot(page, '11-profile-view')
    
    const displayName = await page.locator('[class*="font-bold"]').first().isVisible().catch(() => false)
    console.log(`  Display name: ${displayName ? '✅' : '❌'}`)

    // === TEST 9: Settings ===
    console.log('\n🧪 TEST 9: Settings')
    // Look for settings button
    const settingsBtn = page.locator('text=Settings').first()
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click()
      await page.waitForTimeout(1000)
      await screenshot(page, '12-settings-view')
      
      // Toggle dark mode
      const darkModeToggle = page.locator('text=Dark').first()
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click()
        await page.waitForTimeout(500)
        await screenshot(page, '13-dark-mode')
        console.log(`  Dark mode toggle: ✅`)
        
        // Toggle back to light
        const lightModeToggle = page.locator('text=Light').first()
        if (await lightModeToggle.isVisible()) {
          await lightModeToggle.click()
          await page.waitForTimeout(500)
        }
      }
    }

    // === TEST 10: Create Service (FAB) ===
    console.log('\n🧪 TEST 10: Create Service')
    // Go back to marketplace first
    await page.click('[aria-label="Home"]').catch(() => page.locator('text=Home').first().click())
    await page.waitForTimeout(1000)
    
    // Click FAB button
    const fab = page.locator('[aria-label="Create service"]')
    if (await fab.isVisible()) {
      await fab.click()
      await page.waitForTimeout(1000)
      await screenshot(page, '14-create-service')
      console.log(`  Create service form: ✅`)
    }

    // === TEST 11: Admin Panel (Logout + Login as Admin) ===
    console.log('\n🧪 TEST 11: Admin Panel')
    // Navigate back to home
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    
    // Check if we're logged in - look for logout
    const logoutBtn = page.locator('text=Sign Out').first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Login as admin
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    
    const adminEmail = page.locator('input[placeholder*="Email or username"]')
    if (await adminEmail.isVisible()) {
      await adminEmail.fill('admin@skillmarket.app')
      await page.fill('input[placeholder*="Password"]', 'admin12345')
      await page.locator('form button[type="submit"]').click()
      await page.waitForTimeout(3000)
      await page.waitForLoadState('networkidle')
      await screenshot(page, '15-admin-logged-in')
      
      // Look for admin panel access
      const adminLink = page.locator('text=Admin').first()
      if (await adminLink.isVisible()) {
        await adminLink.click()
        await page.waitForTimeout(1500)
        await screenshot(page, '16-admin-dashboard')
        console.log(`  Admin dashboard: ✅`)
      }
    }

    // === SUMMARY ===
    console.log('\n' + '='.repeat(50))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`)
    console.log(`Console errors captured: ${errors.length}`)
    if (errors.length > 0) {
      console.log('\n⚠️  Console Errors:')
      errors.slice(0, 10).forEach(e => console.log(`  - ${e.substring(0, 120)}`))
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
    await screenshot(page, 'error-state')
  } finally {
    await browser.close()
  }
}

runTests().catch(console.error)
