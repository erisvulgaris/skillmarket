import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    console.log('[API/Seed] Populating all 10 Marketplace Sections with domain-specific curated listings & Unsplash images...')

    // 1. Ensure 10 Section Categories exist
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

    const categoryMap: Record<string, any> = {}

    for (const cat of sectionCategories) {
      let dbCat = await db.category.findUnique({ where: { slug: cat.slug } })
      if (!dbCat) {
        dbCat = await db.category.create({
          data: { name: cat.name, slug: cat.slug, icon: cat.icon, enabled: cat.enabled }
        })
      } else {
        // Enforce enabled status update
        dbCat = await db.category.update({
          where: { id: dbCat.id },
          data: { enabled: cat.enabled }
        })
      }
      categoryMap[cat.slug] = dbCat
    }

    // 2. Ensure Sellers exist
    const passwordHash = '$2a$10$w095j8.Wv0M1/R48E33s..v2Qf034.W86a45.'
    const pinHash = '$2a$10$w095j8.Wv0M1/R48E33s..'

    const sellersData = [
      { name: 'Ananya Sharma', username: 'ananya_upsc_2026', email: 'ananya.upsc@example.com' },
      { name: 'Rohit Kumar', username: 'delhi_aspirant_hub', email: 'rohit.aspirant@example.com' },
      { name: 'Chaitanya V', username: 'chaitanya_ias', email: 'chaitanya.v@example.com' },
      { name: 'Priya Nair', username: 'studyiq_notes_guru', email: 'priya.nair@example.com' },
      { name: 'Vikramaditya Singh', username: 'ias_baba_fan_99', email: 'vikram.baba@example.com' },
      { name: 'Siddharth Rao', username: 'orn_notes_seller', email: 'siddharth.rao@example.com' },
      { name: 'Alex Rivera', username: 'alex_fullstack_dev', email: 'alex.rivera@example.com' },
      { name: 'Elena Rostova', username: 'ai_prompt_queen', email: 'elena.rostova@example.com' },
      { name: 'Marcus Vance', username: 'ui_system_architect', email: 'marcus.vance@example.com' },
      { name: 'Devon Wright', username: 'saas_indie_maker', email: 'devon.wright@example.com' },
      { name: 'Sarah Chen', username: 'data_quant_insights', email: 'sarah.chen@example.com' },
      { name: 'Liam O’Connor', username: 'audio_beats_master', email: 'liam.oconnor@example.com' },
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
                bio: `Verified Content Creator & Digital Product Specialist (@${s.username})`,
                isVerified: true,
                location: 'Global / Remote',
                languages: '["English", "Hindi"]',
                skills: '["Digital Products", "Software", "Education"]',
              },
            },
            wallet: { create: { availableBalance: 10000 } },
          },
        })
      }
      createdSellers.push(u)
    }

    // 3. Category Listings Catalog with Relevant Unsplash Images
    const catalogData: {
      categorySlug: string;
      title: string;
      description: string;
      price: number;
      image: string;
      tags: string[];
      skills: string[];
    }[] = [
      // 1. Telegram Services (UPSC fixed ₹299)
      {
        categorySlug: 'telegram-services',
        title: 'General Studies Strategist Programme — Hybrid — UPSC 2026 — Sold by Ananya Sharma',
        description: 'Comprehensive GS Foundation lectures, Telegram channel link, module lecture PDFs, test series PDFs, and current affairs compilations.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
        tags: ['UPSC', 'Telegram', 'GS Foundation'],
        skills: ['Prelims', 'Mains', 'Current Affairs']
      },
      {
        categorySlug: 'telegram-services',
        title: 'Integrated GS Prelims + Mains Comprehensive — Online Telegram — UPSC 2026 — Sold by Rohit Kumar',
        description: 'Complete integrated GS batch (Vajiram & Ravi format). Instant private Telegram channel access link, daily lecture notes & evaluated model papers.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
        tags: ['UPSC', 'Telegram', 'Integrated GS'],
        skills: ['GS1', 'GS2', 'GS3', 'GS4']
      },
      {
        categorySlug: 'telegram-services',
        title: 'Anthropology Optional Foundation & Test Series — Hybrid Telegram — UPSC 2026 — Sold by Chaitanya V',
        description: 'Anthropology Optional Paper 1 & 2 full course notes, physical anthropology diagrams, and Telegram discussion group link.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        tags: ['UPSC', 'Optional', 'Anthropology'],
        skills: ['Paper 1', 'Paper 2', 'Test Series']
      },
      {
        categorySlug: 'telegram-services',
        title: 'PSIR Optional Complete Lectures & Handouts — Online Telegram — UPSC 2026 — Sold by Vikramaditya Singh',
        description: 'Shubhra Ranjan format Political Science & International Relations notes, Telegram updates, and western political thought summaries.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        tags: ['UPSC', 'PSIR', 'Optional'],
        skills: ['Political Science', 'IR', 'Notes']
      },
      {
        categorySlug: 'telegram-services',
        title: 'Public Administration Foundation Masterclass — Online Telegram — UPSC 2026 — Sold by Priya Nair',
        description: 'Synergy IAS format Public Administration optional lectures, administrative thought diagrams, and Telegram channel link.',
        price: 299,
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
        tags: ['UPSC', 'Public Admin', 'Telegram'],
        skills: ['Governance', 'Admin Theory', 'Notes']
      },

      // 2. Software & Scripts
      {
        categorySlug: 'software-scripts',
        title: 'SaaSify Next.js 15 Fullstack Starter Kit with Appwrite & Stripe',
        description: 'Production-ready Next.js 15 App Router boilerplate with Appwrite backend, Stripe subscription webhooks, authentication, and Tailwind CSS v4.',
        price: 1499,
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        tags: ['Next.js', 'Boilerplate', 'SaaS'],
        skills: ['React 19', 'TypeScript', 'Appwrite']
      },
      {
        categorySlug: 'software-scripts',
        title: 'Automated Python Web Scraping & Lead Enrichment Engine',
        description: 'High-performance Playwright & BeautifulSoup Python script with proxy rotation, anti-bot bypass, and CSV/JSON exporter.',
        price: 899,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        tags: ['Python', 'Scraper', 'Automation'],
        skills: ['Playwright', 'Data Mining', 'AsyncIO']
      },
      {
        categorySlug: 'software-scripts',
        title: 'Telegram Bot Automation Framework for Content Distribution',
        description: 'Node.js Telegraf bot script for automated channel broadcasts, paid subscription membership gates, and user management.',
        price: 599,
        image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80',
        tags: ['Telegram Bot', 'Node.js', 'Automation'],
        skills: ['Telegraf', 'Webhooks', 'Express']
      },

      // 3. AI Prompts & Models
      {
        categorySlug: 'ai-prompts-models',
        title: 'Midjourney v6 Photorealistic Architecture & UI Design Prompt Bundle',
        description: 'Curated collection of 150+ ultra-detailed Midjourney v6 prompts for generating high-converting UI mockups, 3D renders, and web banners.',
        price: 499,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        tags: ['Midjourney', 'AI Prompts', 'Design'],
        skills: ['Prompt Engineering', 'Generative AI', '3D']
      },
      {
        categorySlug: 'ai-prompts-models',
        title: 'ChatGPT 4o Autonomous SEO Article & Copywriting Prompt Chain',
        description: 'Multi-step prompt chain for ChatGPT 4o to research keyword intent, outline, write 2500+ word SEO articles, and generate schema markup.',
        price: 399,
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
        tags: ['ChatGPT', 'SEO', 'Copywriting'],
        skills: ['AI Content', 'Prompt Chain', 'Marketing']
      },
      {
        categorySlug: 'ai-prompts-models',
        title: 'Claude 3.5 Sonnet Senior Fullstack Engineer Coding System Prompt',
        description: 'Battle-tested system prompt that transforms Claude 3.5 Sonnet into an elite Staff Software Engineer for refactoring and debugging.',
        price: 499,
        image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
        tags: ['Claude 3.5', 'Coding', 'System Prompt'],
        skills: ['TypeScript', 'Refactoring', 'Architecture']
      },

      // 4. UI/UX Design Kits
      {
        categorySlug: 'ui-ux-design-kits',
        title: 'Fintech Banking & Crypto Mobile App UI Kit for Figma (120+ Screens)',
        description: 'Comprehensive Figma design system with dark mode components, responsive auto-layout frames, interactive prototypes, and 120+ screens.',
        price: 1299,
        image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
        tags: ['Figma', 'UI Kit', 'Fintech'],
        skills: ['Mobile UI', 'Auto Layout', 'Prototypes']
      },
      {
        categorySlug: 'ui-ux-design-kits',
        title: 'Dark Mode SaaS Admin Dashboard Design System',
        description: 'Obsidian dark mode SaaS UI kit with charts, tables, navigation headers, metric cards, and 50+ reusable Figma components.',
        price: 999,
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
        tags: ['SaaS', 'Dashboard', 'Figma'],
        skills: ['Dark Mode', 'Design System', 'Charts']
      },

      // 5. E-Books & Guides
      {
        categorySlug: 'e-books-guides',
        title: 'The System Design & Distributed Systems Handbook for Senior Engineers',
        description: '250-page PDF guide covering database sharding, microservices caching, load balancing, consensus protocols, and real interview case studies.',
        price: 699,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        tags: ['System Design', 'E-Book', 'Engineering'],
        skills: ['Architecture', 'Distributed Systems', 'Interviews']
      },
      {
        categorySlug: 'e-books-guides',
        title: 'Zero to $10,000/mo Micro-SaaS Blueprint by Indie Hackers',
        description: 'Actionable step-by-step PDF guide on finding profitable SaaS ideas, building MVP in 14 days, SEO growth hacks, and pricing strategies.',
        price: 499,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
        tags: ['Micro-SaaS', 'Indie Hacking', 'Guide'],
        skills: ['Product Growth', 'Marketing', 'Monetization']
      },

      // 6. Video Tutorials & Courses
      {
        categorySlug: 'video-tutorials-courses',
        title: 'Advanced Next.js 15, Turbopack & React 19 Production Masterclass',
        description: '12-hour video course on building enterprise Next.js applications, Server Actions, PPR (Partial Prerendering), and performance optimization.',
        price: 1999,
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
        tags: ['Next.js 15', 'Course', 'React 19'],
        skills: ['Server Actions', 'Turbopack', 'Performance']
      },
      {
        categorySlug: 'video-tutorials-courses',
        title: 'Fullstack Rust & WebAssembly Microservices Bootcamp',
        description: '18-hour HD video course covering Axum, Tokio async runtime, WebAssembly frontend compilation, and PostgreSQL integration.',
        price: 2499,
        image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=80',
        tags: ['Rust', 'Wasm', 'Course'],
        skills: ['Axum', 'WebAssembly', 'Backend']
      },

      // 7. Templates & Themes
      {
        categorySlug: 'templates-themes',
        title: 'Vite + Tailwind CSS Modern Developer Portfolio Theme',
        description: 'Ultra-fast, responsive developer portfolio website template with dark mode, interactive project showcase, and animated resume timeline.',
        price: 499,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        tags: ['Portfolio', 'Template', 'Tailwind'],
        skills: ['Vite', 'React', 'Framer Motion']
      },
      {
        categorySlug: 'templates-themes',
        title: 'Next.js High-Performance E-Commerce Storefront Template',
        description: 'Full-featured online store template with cart drawer, product filter sidebar, search autocomplete, and instant checkout flow.',
        price: 1199,
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
        tags: ['E-Commerce', 'Next.js', 'Template'],
        skills: ['Storefront', 'Cart', 'Stripe UI']
      },

      // 8. Audio & Music Assets
      {
        categorySlug: 'audio-music-assets',
        title: 'Lofi Beats for Deep Work & Coding (50 Royalty-Free Tracks)',
        description: '50 original high-quality 320kbps WAV/MP3 lofi hip-hop instrumental tracks perfect for background coding, videos, and live streams.',
        price: 599,
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        tags: ['Lofi Beats', 'Music', 'Royalty-Free'],
        skills: ['Audio', 'Background Music', 'Coding Beats']
      },
      {
        categorySlug: 'audio-music-assets',
        title: 'Unreal Engine 5 & Unity Game SFX Library (1,000 Sound Effects)',
        description: '1,000 professionally mastered 24-bit sound effects including UI clicks, sci-fi weapons, ambient environments, and impact sounds.',
        price: 899,
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
        tags: ['Game SFX', 'Audio Assets', 'Unreal Engine'],
        skills: ['Sound Design', 'Foley', 'Game Audio']
      },

      // 9. Memberships & Subscriptions
      {
        categorySlug: 'memberships-subscriptions',
        title: 'Senior Fullstack Architect Private Telegram Alpha Group Pass',
        description: '30-day pass to exclusive private Telegram community for senior software engineers, indie hackers, and tech founders sharing architectural breakdowns.',
        price: 1499,
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80',
        tags: ['Membership', 'Telegram Alpha', 'Community'],
        skills: ['Networking', 'Architecture', 'Mentorship']
      },
      {
        categorySlug: 'memberships-subscriptions',
        title: 'VIP High-Ticket Remote Freelance Job Alerts Channel',
        description: 'Real-time Telegram feed delivering verified $5,000+ remote contract job leads directly from YC startups and US enterprise clients.',
        price: 999,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80',
        tags: ['Freelance', 'Job Leads', 'Subscription'],
        skills: ['Remote Jobs', 'Contracting', 'Telegram Alert']
      },

      // 10. Data & Analytics Datasets
      {
        categorySlug: 'data-analytics-datasets',
        title: 'Global B2B SaaS Companies & Decision Maker Lead Database 2026',
        description: 'Cleaned CSV dataset containing 25,000+ verified B2B SaaS company profiles, executive emails, LinkedIn URLs, tech stack data, and funding rounds.',
        price: 2999,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        tags: ['B2B Data', 'Lead Database', 'Analytics'],
        skills: ['Lead Gen', 'Sales Data', 'CSV']
      },
      {
        categorySlug: 'data-analytics-datasets',
        title: 'Top 500 Cryptocurrency Historical OHLCV Daily Price Feed (2018-2026)',
        description: 'Complete historical OHLCV price and volume market data for top 500 cryptocurrencies formatted in Parquet and CSV for backtesting.',
        price: 1899,
        image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
        tags: ['Crypto Data', 'Backtesting', 'Dataset'],
        skills: ['Quant Data', 'OHLCV', 'Python Analytics']
      },
    ]

    let inserted = 0
    let errors: string[] = []

    for (let i = 0; i < catalogData.length; i++) {
      try {
        const item = catalogData[i]
        const cat = categoryMap[item.categorySlug]
        if (!cat) continue

        const seller = createdSellers[i % createdSellers.length]
        const slug = `${item.categorySlug}-${i}-${Date.now()}`

        const exists = await db.service.findFirst({ where: { title: item.title } })
        if (!exists) {
          await db.service.create({
            data: {
              sellerId: seller.id,
              categoryId: cat.id,
              title: item.title,
              slug,
              description: item.description,
              price: item.price,
              deliveryDays: 1,
              status: 'active',
              featured: i % 2 === 0,
              views: 300 + i * 20,
              completedOrders: 25 + i * 4,
              ratingAvg: 4.8 + (i % 3) * 0.1,
              ratingCount: 20 + i * 2,
              tags: JSON.stringify(item.tags),
              skills: JSON.stringify(item.skills),
              images: JSON.stringify([item.image]),
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
    return ok({
      message: 'All 10 Marketplace Sections successfully populated with curated Unsplash listings!',
      inserted,
      totalServices: serviceCount,
      errors
    })
  } catch (e: any) {
    return handleError(e)
  }
}
