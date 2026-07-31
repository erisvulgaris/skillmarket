import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { ensureTelegramServicesSeeded } from '@/lib/auto-seed'

export async function GET() {
  try {
    console.log('[API/Seed] Explicit seed endpoint triggered...')
    
    // Force reset/seed
    let telegramCat = await db.category.findFirst({ where: { slug: 'telegram-services' } })
    
    if (!telegramCat) {
      telegramCat = await db.category.create({
        data: {
          name: 'Telegram Services',
          slug: 'telegram-services',
          icon: 'telegram',
        },
      })
    }

    // 10 Sections
    const sectionCategories = [
      { name: 'Telegram Services', slug: 'telegram-services', icon: 'telegram' },
      { name: 'Software & Scripts', slug: 'software-scripts', icon: 'code' },
      { name: 'AI Prompts & Models', slug: 'ai-prompts-models', icon: 'bot' },
      { name: 'UI/UX Design Kits', slug: 'ui-ux-design-kits', icon: 'palette' },
      { name: 'E-Books & Guides', slug: 'e-books-guides', icon: 'book' },
      { name: 'Video Tutorials & Courses', slug: 'video-tutorials-courses', icon: 'video' },
      { name: 'Templates & Themes', slug: 'templates-themes', icon: 'layout' },
      { name: 'Audio & Music Assets', slug: 'audio-music-assets', icon: 'music' },
      { name: 'Memberships & Subscriptions', slug: 'memberships-subscriptions', icon: 'star' },
      { name: 'Data & Analytics Datasets', slug: 'data-analytics-datasets', icon: 'bar-chart' },
    ]

    for (const cat of sectionCategories) {
      const exists = await db.category.findUnique({ where: { slug: cat.slug } })
      if (!exists) {
        await db.category.create({
          data: { name: cat.name, slug: cat.slug, icon: cat.icon }
        })
      }
    }

    await ensureTelegramServicesSeeded()

    const catCount = await db.category.count()
    const serviceCount = await db.service.count()

    return ok({ message: 'Seeding completed!', categories: catCount, services: serviceCount })
  } catch (e) {
    return handleError(e)
  }
}
