import json

auto_seed_code = '''import { db } from '@/lib/db'

let isSeeding = false
let isSeededCheckDone = false

export async function ensureTelegramServicesSeeded() {
  if (isSeeding || isSeededCheckDone) return
  try {
    const existingSection = await db.category.findFirst({ where: { slug: 'software-scripts' } })
    const serviceCount = await db.service.count()

    if (existingSection && serviceCount >= 30) {
      isSeededCheckDone = true
      return
    }

    isSeeding = true
    console.log('[AutoSeed] Seeding all 10 Marketplace Sections on live database...')

    // 10 Section Categories
    const sectionCategories = [
      { name: 'Telegram Services', slug: 'telegram-services', icon: 'telegram', enabled: false },
      { name: 'Software & Scripts', slug: 'software-scripts', icon: 'code', enabled: true },
      { name: 'AI Prompts & Models', slug: 'ai-prompts-models', icon: 'bot', enabled: true },
      { name: 'UI/UX Design Kits', slug: 'ui-ux-design-kits', icon: 'palette', enabled: true },
      { name: 'E-Books & Guides', slug: 'e-books-guides', icon: 'book', enabled: true },
      { name: 'Video Tutorials & Courses', slug: 'video-tutorials-courses', icon: 'video', enabled: true },
      { name: 'Templates & Themes', slug: 'templates-themes', icon: 'layout', enabled: true },
      { name: 'Audio & Music Assets', slug: 'audio-music-assets', icon: 'music', enabled: true },
      { name: 'Memberships & Subscriptions', slug: 'memberships-subscriptions', icon: 'star', enabled: true },
      { name: 'Data & Analytics Datasets', slug: 'data-analytics-datasets', icon: 'bar-chart', enabled: true },
    ]

    for (const cat of sectionCategories) {
      let dbCat = await db.category.findUnique({ where: { slug: cat.slug } })
      if (!dbCat) {
        await db.category.create({
          data: { name: cat.name, slug: cat.slug, icon: cat.icon, enabled: cat.enabled }
        })
      } else {
        await db.category.update({
          where: { id: dbCat.id },
          data: { enabled: cat.enabled }
        })
      }
    }

    isSeededCheckDone = true
  } catch (e) {
    console.error('[AutoSeed] Failed:', e)
  } finally {
    isSeeding = false
  }
}
'''

with open("c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/lib/auto-seed.ts", "w", encoding="utf-8") as f:
    f.write(auto_seed_code)

print("Successfully updated src/lib/auto-seed.ts!")
