import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    let telegramCat = await db.category.findFirst({ where: { slug: 'telegram-services' } })
    if (!telegramCat) {
      telegramCat = await db.category.create({
        data: { name: 'Telegram Services', slug: 'telegram-services', icon: 'telegram' }
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

    // Sellers
    const passwordHash = '$2a$10$w095j8.Wv0M1/R48E33s..v2Qf034.W86a45.'
    const pinHash = '$2a$10$w095j8.Wv0M1/R48E33s..'

    const sellersData = [
      { name: 'Ananya Sharma', username: 'ananya_upsc_2026', email: 'ananya.upsc@example.com' },
      { name: 'Rohit Kumar', username: 'delhi_aspirant_hub', email: 'rohit.aspirant@example.com' },
      { name: 'Chaitanya V', username: 'chaitanya_ias', email: 'chaitanya.v@example.com' },
      { name: 'Priya Nair', username: 'studyiq_notes_guru', email: 'priya.nair@example.com' },
      { name: 'Vikramaditya Singh', username: 'ias_baba_fan_99', email: 'vikram.baba@example.com' },
      { name: 'Siddharth Rao', username: 'orn_notes_seller', email: 'siddharth.rao@example.com' },
      { name: 'Meera Mukherjee', username: 'upsc_topper_notes', email: 'meera.topper@example.com' },
      { name: 'Aditya Verma', username: 'civil_services_prep', email: 'aditya.verma@example.com' },
      { name: 'Kavita Reddy', username: 'ias_mains_crack', email: 'kavita.reddy@example.com' },
      { name: 'Gaurav Joshi', username: 'csat_master_299', email: 'gaurav.csat@example.com' },
      { name: 'Neeraj Gupta', username: 'optional_hub_delhi', email: 'neeraj.gupta@example.com' },
      { name: 'Swati Deshmukh', username: 'upsc_drive_links', email: 'swati.deshmukh@example.com' },
    ]

    const createdSellers: any[] = []
    for (const s of sellersData) {
      let u = await db.user.findUnique({ where: { email: s.email } })
      if (!u) {
        u = await db.user.create({
          data: {
            email: s.email,
            username: s.username,
            passwordHash,
            transactionPinHash: pinHash,
            role: 'seller',
            referralCode: `REF_${s.username.toUpperCase()}`,
            emailVerifiedAt: new Date(),
            profile: {
              create: {
                displayName: s.name,
                bio: `Independent UPSC Content Creator & Telegram Educator (@${s.username})`,
                isVerified: true,
                location: 'Delhi, India',
                languages: '["English", "Hindi"]',
                skills: '["GS", "UPSC", "Telegram"]',
              },
            },
            wallet: { create: { availableBalance: 5000 } },
          },
        })
      }
      createdSellers.push(u)
    }

    // UPSC Courses
    const upscListings = [
      { name: 'General Studies Strategist Programme', institute: 'ALS IAS', mode: 'Hybrid', year: '2026' },
      { name: 'Integrated GS Prelims + Mains Comprehensive', institute: 'Vajiram & Ravi', mode: 'Online Telegram', year: '2026' },
      { name: 'Anthropology Optional Foundation & Test Series', institute: 'ALS IAS', mode: 'Hybrid Telegram', year: '2026' },
      { name: 'Public Administration Foundation Masterclass', institute: 'Synergy IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'PSIR Optional Complete Lectures & Handouts', institute: 'Shubhra Ranjan IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'Geography Optional Comprehensive Notes', institute: 'Shabbir Sir Neostencil', mode: 'Online Telegram', year: '2026' },
      { name: 'Sociology Optional Master Course & PDFs', institute: 'Vikas Ranjan Triumph IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'CSAT Complete Shortcut & Strategy Batch', institute: 'StudyIQ IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'Ethics, Integrity & Aptitude Case Studies (GS IV)', institute: 'Lukmaan IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'Current Affairs Monthly Compilations & Tests', institute: 'Vision IAS', mode: 'Online Telegram', year: '2026' },
      { name: 'Essay Writing Master Programme & Evaluated Model Papers', institute: 'Vikas Divyakirti Driscoll', mode: 'Online Telegram', year: '2026' },
      { name: 'History Optional Ancient, Medieval & Modern Notes', institute: 'Baliyan Sir IAS', mode: 'Online Telegram', year: '2026' },
    ]

    let inserted = 0
    let errors: string[] = []

    for (let i = 0; i < upscListings.length; i++) {
      try {
        const l = upscListings[i]
        const seller = createdSellers[i % createdSellers.length]
        const sellerName = sellersData[i % sellersData.length].name
        const title = `${l.name} — ${l.mode} — UPSC ${l.year} — Sold by ${sellerName}`
        const slug = `upsc-${i}-${Date.now()}`

        const exists = await db.service.findFirst({ where: { title } })
        if (!exists) {
          await db.service.create({
            data: {
              sellerId: seller.id,
              categoryId: telegramCat.id,
              title,
              slug,
              description: `Independent third-party listing for ${l.name} (${l.institute}). Includes lecture PDFs, Telegram channel access, current affairs updates, and test series PDFs. Listed by independent seller ${sellerName}.`,
              price: 299,
              deliveryDays: 1,
              status: 'active',
              featured: i % 3 === 0,
              views: 250 + i * 15,
              completedOrders: 40 + i * 3,
              ratingAvg: 4.9,
              ratingCount: 30 + i,
              tags: '["UPSC", "Telegram", "Notes"]',
              skills: '["GS", "Prelims", "Mains"]',
              images: '["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"]',
              faqs: '[]',
              availability: 'available',
            },
          })
          inserted++
        }
      } catch (err: any) {
        errors.push(err?.message || String(err))
      }
    }

    const serviceCount = await db.service.count()
    return ok({ message: 'Seeded successfully!', inserted, totalServices: serviceCount, errors })
  } catch (e: any) {
    return handleError(e)
  }
}
