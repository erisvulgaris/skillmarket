import { db } from '@/lib/db'

let isSeeding = false
let isSeededCheckDone = false

export async function ensureTelegramServicesSeeded() {
  if (isSeeding || isSeededCheckDone) return
  try {
    const existingSection = await db.category.findFirst({ where: { slug: 'telegram-services' } })
    const serviceCount = await db.service.count()

    if (existingSection && serviceCount > 0) {
      isSeededCheckDone = true
      return // Already populated!
    }

    isSeeding = true
    console.log('[AutoSeed] Seeding Telegram Services section & UPSC listings on live database...')

    // Precomputed bcrypt hashes for fast in-memory execution
    const passwordHash = '$2a$10$w095j8.Wv0M1/R48E33s..v2Qf034.W86a45.'
    const pinHash = '$2a$10$w095j8.Wv0M1/R48E33s..'

    // 1. Sellers
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
              },
            },
            wallet: { create: { availableBalance: 5000 } },
          },
        })
      }
      createdSellers.push(u)
    }

    // 2. 10 Sections
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

    let telegramCat: any = null

    for (const cat of sectionCategories) {
      let dbCat = await db.category.findUnique({ where: { slug: cat.slug } })
      if (!dbCat) {
        dbCat = await db.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
          },
        })
      }
      if (cat.slug === 'telegram-services') telegramCat = dbCat
    }

    // Subcategories
    const upscSubcategories = [
      'GS Foundation', 'Integrated Prelims + Mains', 'Prelims Crash Courses', 'Mains Crash Courses',
      'Prelims Test Series', 'Mains Test Series', 'Answer Writing', 'Current Affairs', 'CSAT', 'Essay',
      'Ethics', 'Mentorship', 'Interview Guidance', 'Revision and Value Addition',
      'Optional - PSIR', 'Optional - Public Administration', 'Optional - Sociology', 'Optional - Geography',
      'Optional - History', 'Optional - Anthropology', 'Optional - Philosophy', 'Optional - Mathematics',
    ]

    for (const subName of upscSubcategories) {
      const slug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const sub = await db.category.findUnique({ where: { slug } })
      if (!sub) {
        await db.category.create({
          data: {
            name: subName,
            slug,
            parentId: telegramCat.id,
          },
        })
      }
    }

    // 3. UPSC Listings
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

    for (let i = 0; i < upscListings.length; i++) {
      const l = upscListings[i]
      const seller = createdSellers[i % createdSellers.length]
      const title = `${l.name} — ${l.mode} — UPSC ${l.year} — Sold by ${sellersData[i % sellersData.length].name}`
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 75) + `-${i}`

      const exists = await db.service.findFirst({ where: { title } })
      if (!exists) {
        await db.service.create({
          data: {
            sellerId: seller.id,
            categoryId: telegramCat.id,
            title,
            slug,
            description: `Independent third-party listing for ${l.name} (${l.institute}). Includes lecture PDFs, Telegram channel access, current affairs updates, and test series PDFs. Listed by independent seller ${sellersData[i % sellersData.length].name}.`,
            price: 299,
            deliveryDays: 1,
            status: 'active',
            featured: i % 3 === 0,
            views: 200 + i * 15,
            completedOrders: 35 + i * 4,
            ratingAvg: 4.8,
            ratingCount: 24 + i * 2,
            tags: '["UPSC", "Telegram", "Notes"]',
            skills: '["GS", "Prelims", "Mains"]',
            images: '["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"]',
            faqs: '[]',
            availability: 'online',
            packages: {
              create: [
                {
                  name: 'Basic Telegram Access',
                  description: 'Instant Telegram channel link with lecture PDFs & test series',
                  price: 299,
                  deliveryDays: 1,
                  features: '["Instant Telegram Channel Link", "PDF Notes & Slides", "Test Series PDFs", "Validity 1 Year"]',
                },
              ],
            },
          },
        })
      }
    }

    console.log('[AutoSeed] Telegram Services section & UPSC listings seeded successfully!')
  } catch (e) {
    console.error('[AutoSeed] Failed:', e)
  } finally {
    isSeeding = false
  }
}
