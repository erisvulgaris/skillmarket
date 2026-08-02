import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, handleError } from '@/lib/api'
import { clearCategoryCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  try {
    console.log('[API/Seed] Seeding all 10 Marketplace Sections with custom branded title images...')

    // Clear existing services to ensure 100% clean custom WebP image paths
    await db.service.deleteMany({})

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
                languages: '[]',
                skills: '[]',
              },
            },
            wallet: { create: { availableBalance: 10000 } },
          },
        })
      }
      createdSellers.push(u)
    }

    // 3. Complete Catalogue of 42 Services across all 10 sections with Custom WebP Image Thumbnails
    const catalogData = [
      // 1. Telegram Services (Fixed ₹299)
      { categorySlug: 'telegram-services', title: 'GS Foundation Strategist Batch — UPSC 2026', description: 'Comprehensive GS Foundation lectures, Telegram channel link, module lecture PDFs, test series PDFs, and current affairs compilations.', price: 299, image: '/images/services/telegram_01.webp', tags: ['UPSC', 'Telegram', 'GS'], skills: ['Prelims', 'Mains'] },
      { categorySlug: 'telegram-services', title: 'Integrated GS Prelims + Mains Comprehensive — UPSC 2026', description: 'Complete integrated GS batch (Vajiram & Ravi format). Instant private Telegram channel access link, daily lecture notes & evaluated model papers.', price: 299, image: '/images/services/telegram_02.webp', tags: ['UPSC', 'Telegram', 'Integrated GS'], skills: ['GS1', 'GS2', 'GS3', 'GS4'] },
      { categorySlug: 'telegram-services', title: 'Anthropology Optional Foundation & Test Series — UPSC 2026', description: 'Anthropology Optional Paper 1 & 2 full course notes, physical anthropology diagrams, and Telegram discussion group link.', price: 299, image: '/images/services/telegram_03.webp', tags: ['UPSC', 'Optional', 'Anthropology'], skills: ['Paper 1', 'Paper 2'] },
      { categorySlug: 'telegram-services', title: 'PSIR Optional Complete Lectures & Handouts — UPSC 2026', description: 'Shubhra Ranjan format Political Science & International Relations notes, Telegram updates, and western political thought summaries.', price: 299, image: '/images/services/telegram_04.webp', tags: ['UPSC', 'PSIR', 'Optional'], skills: ['Political Science', 'IR'] },
      { categorySlug: 'telegram-services', title: 'Public Administration Foundation Masterclass — UPSC 2026', description: 'Synergy IAS format Public Administration optional lectures, administrative thought diagrams, and Telegram channel link.', price: 299, image: '/images/services/telegram_05.webp', tags: ['UPSC', 'Public Admin'], skills: ['Governance', 'Admin Theory'] },
      { categorySlug: 'telegram-services', title: 'Geography Optional Comprehensive Notes — UPSC 2026', description: 'Shabbir Sir Neostencil format Geography optional notes, map pointing diagrams, and test series PDFs.', price: 299, image: '/images/services/telegram_06.webp', tags: ['UPSC', 'Geography', 'Optional'], skills: ['Maps', 'Physical Geography'] },

      // 2. Software & Scripts
      { categorySlug: 'software-scripts', title: 'SaaSify Next.js 15 Fullstack Starter Kit', description: 'Production-ready Next.js 15 App Router boilerplate with Appwrite backend, Stripe subscription webhooks, authentication, and Tailwind CSS v4.', price: 1499, image: '/images/services/software_01.webp', tags: ['Next.js', 'Boilerplate', 'SaaS'], skills: ['React 19', 'TypeScript', 'Appwrite'] },
      { categorySlug: 'software-scripts', title: 'Automated Python Scraping & Lead Engine', description: 'High-performance Playwright & BeautifulSoup Python script with proxy rotation, anti-bot bypass, and CSV/JSON exporter.', price: 899, image: '/images/services/software_02.webp', tags: ['Python', 'Scraper', 'Automation'], skills: ['Playwright', 'Data Mining'] },
      { categorySlug: 'software-scripts', title: 'Telegram Bot Automation Framework', description: 'Node.js Telegraf bot script for automated channel broadcasts, paid subscription membership gates, and user management.', price: 599, image: '/images/services/software_03.webp', tags: ['Telegram Bot', 'Node.js'], skills: ['Telegraf', 'Webhooks'] },
      { categorySlug: 'software-scripts', title: 'React 19 Multi-Tenant SaaS UI System', description: 'TypeScript + Tailwind CSS v4 multi-tenant admin dashboard UI boilerplate with dynamic permission control.', price: 1299, image: '/images/services/software_04.webp', tags: ['React 19', 'Tailwind', 'SaaS'], skills: ['TypeScript', 'UI System'] },

      // 3. AI Prompts & Models
      { categorySlug: 'ai-prompts-models', title: 'Midjourney v6 Photorealistic Prompt Pack', description: 'Curated collection of 150+ ultra-detailed Midjourney v6 prompts for generating high-converting UI mockups, 3D renders, and web banners.', price: 499, image: '/images/services/ai_01.webp', tags: ['Midjourney', 'AI Prompts'], skills: ['Prompt Engineering', '3D'] },
      { categorySlug: 'ai-prompts-models', title: 'ChatGPT 4o Autonomous SEO Prompt Chain', description: 'Multi-step prompt chain for ChatGPT 4o to research keyword intent, outline, write 2500+ word SEO articles, and generate schema markup.', price: 399, image: '/images/services/ai_02.webp', tags: ['ChatGPT', 'SEO', 'Copywriting'], skills: ['AI Content', 'Marketing'] },
      { categorySlug: 'ai-prompts-models', title: 'Claude 3.5 Sonnet Senior Staff Engineer System Prompt', description: 'Battle-tested system prompt that transforms Claude 3.5 Sonnet into an elite Staff Software Engineer for refactoring and debugging.', price: 499, image: '/images/services/ai_03.webp', tags: ['Claude 3.5', 'Coding', 'System Prompt'], skills: ['TypeScript', 'Architecture'] },
      { categorySlug: 'ai-prompts-models', title: 'Stable Diffusion XL Cyberpunk LoRA Weights', description: 'Fine-tuned SDXL LoRA model weights for rendering futuristic cyberpunk environments and digital character concepts.', price: 699, image: '/images/services/ai_04.webp', tags: ['SDXL', 'LoRA', 'Generative AI'], skills: ['Character Art', 'Stable Diffusion'] },

      // 4. UI/UX Design Kits
      { categorySlug: 'ui-ux-design-kits', title: 'Fintech Banking & Crypto Mobile Figma Kit', description: 'Comprehensive Figma design system with dark mode components, responsive auto-layout frames, interactive prototypes, and 120+ screens.', price: 1299, image: '/images/services/ui_01.webp', tags: ['Figma', 'UI Kit', 'Fintech'], skills: ['Mobile UI', 'Auto Layout'] },
      { categorySlug: 'ui-ux-design-kits', title: 'Dark Mode SaaS Admin Dashboard Design System', description: 'Obsidian dark mode SaaS UI kit with charts, tables, navigation headers, metric cards, and 50+ reusable Figma components.', price: 999, image: '/images/services/ui_02.webp', tags: ['SaaS', 'Dashboard', 'Figma'], skills: ['Dark Mode', 'Design System'] },
      { categorySlug: 'ui-ux-design-kits', title: 'E-Commerce Mobile iOS App UI Design System', description: '80+ clean shopping screens, checkout drawers, and product detail frames built with Figma auto-layout tokens.', price: 899, image: '/images/services/ui_03.webp', tags: ['iOS App', 'E-Commerce', 'Figma'], skills: ['Shopping UI', 'Tokens'] },
      { categorySlug: 'ui-ux-design-kits', title: 'Design System Token Library for Figma', description: 'Variables, typography scales, and responsive layout grid systems for enterprise Figma component libraries.', price: 1099, image: '/images/services/ui_04.webp', tags: ['Tokens', 'Figma', 'Design System'], skills: ['Variables', 'Auto Layout'] },

      // 5. E-Books & Guides
      { categorySlug: 'e-books-guides', title: 'The System Design & Distributed Systems Handbook', description: '250-page PDF guide covering database sharding, microservices caching, load balancing, consensus protocols, and real interview case studies.', price: 699, image: '/images/services/ebook_01.webp', tags: ['System Design', 'E-Book'], skills: ['Architecture', 'Distributed Systems'] },
      { categorySlug: 'e-books-guides', title: 'Zero to $10,000/mo Micro-SaaS Blueprint', description: 'Actionable step-by-step PDF guide on finding profitable SaaS ideas, building MVP in 14 days, SEO growth hacks, and pricing strategies.', price: 499, image: '/images/services/ebook_02.webp', tags: ['Micro-SaaS', 'Indie Hacking'], skills: ['Product Growth', 'Marketing'] },
      { categorySlug: 'e-books-guides', title: 'Fullstack TypeScript Architecture & Testing Bible', description: 'Production guide to testing Next.js 15, Vitest, Playwright, and Zod schemas with 100% test coverage patterns.', price: 599, image: '/images/services/ebook_03.webp', tags: ['TypeScript', 'Testing', 'Guide'], skills: ['Vitest', 'Playwright'] },
      { categorySlug: 'e-books-guides', title: 'Quant Crypto Trading & Backtesting Guide', description: 'Python quantitative trading strategies, OHLCV data backtesting, and automated risk management algorithms.', price: 799, image: '/images/services/ebook_04.webp', tags: ['Crypto', 'Quant', 'Python'], skills: ['Backtesting', 'Algorithms'] },

      // 6. Video Tutorials & Courses
      { categorySlug: 'video-tutorials-courses', title: 'Advanced Next.js 15 & React 19 Masterclass', description: '12-hour video course on building enterprise Next.js applications, Server Actions, PPR (Partial Prerendering), and performance optimization.', price: 1999, image: '/images/services/video_01.webp', tags: ['Next.js 15', 'Course', 'React 19'], skills: ['Server Actions', 'Turbopack'] },
      { categorySlug: 'video-tutorials-courses', title: 'Fullstack Rust & WebAssembly Bootcamp', description: '18-hour HD video course covering Axum, Tokio async runtime, WebAssembly frontend compilation, and PostgreSQL integration.', price: 2499, image: '/images/services/video_02.webp', tags: ['Rust', 'Wasm', 'Course'], skills: ['Axum', 'WebAssembly'] },
      { categorySlug: 'video-tutorials-courses', title: 'Mastering Docker & Kubernetes CI/CD', description: '10-hour DevOps video course covering Docker containerization, Swarm, Kubernetes clusters, and automated GitHub Actions.', price: 1799, image: '/images/services/video_03.webp', tags: ['DevOps', 'Docker', 'Kubernetes'], skills: ['CI/CD', 'Swarm'] },
      { categorySlug: 'video-tutorials-courses', title: 'Fullstack Flutter & Riverpod Mobile Course', description: 'Comprehensive video bootcamp building iOS and Android apps with Flutter, Riverpod 2.0, and Supabase backend.', price: 1899, image: '/images/services/video_04.webp', tags: ['Flutter', 'Riverpod', 'Mobile'], skills: ['Dart', 'iOS', 'Android'] },

      // 7. Templates & Themes
      { categorySlug: 'templates-themes', title: 'Vite + Tailwind Modern Developer Portfolio', description: 'Ultra-fast, responsive developer portfolio website template with dark mode, interactive project showcase, and animated resume timeline.', price: 499, image: '/images/services/template_01.webp', tags: ['Portfolio', 'Template', 'Tailwind'], skills: ['Vite', 'React'] },
      { categorySlug: 'templates-themes', title: 'Next.js High-Performance E-Commerce Storefront', description: 'Full-featured online store template with cart drawer, product filter sidebar, search autocomplete, and instant checkout flow.', price: 1199, image: '/images/services/template_02.webp', tags: ['E-Commerce', 'Next.js'], skills: ['Storefront', 'Cart'] },
      { categorySlug: 'templates-themes', title: 'Shadcn UI Sleek SaaS Landing Page Kit', description: 'Conversion-optimized Next.js marketing landing page with glassmorphism UI elements, pricing cards, and FAQ accordion.', price: 399, image: '/images/services/template_03.webp', tags: ['Landing Page', 'Shadcn UI'], skills: ['Marketing', 'Framer Motion'] },
      { categorySlug: 'templates-themes', title: 'Framer Motion Interactive Agency Portfolio', description: 'Dynamic agency portfolio theme featuring smooth page transitions, 3D card tilt effects, and contact form modal.', price: 599, image: '/images/services/template_04.webp', tags: ['Agency', 'Framer Motion'], skills: ['Animation', 'React'] },

      // 8. Audio & Music Assets
      { categorySlug: 'audio-music-assets', title: 'Lofi Beats for Deep Work (50 Tracks)', description: '50 original high-quality 320kbps WAV/MP3 lofi hip-hop instrumental tracks perfect for background coding, videos, and live streams.', price: 599, image: '/images/services/audio_01.webp', tags: ['Lofi Beats', 'Music'], skills: ['Audio', 'Royalty-Free'] },
      { categorySlug: 'audio-music-assets', title: 'Unreal 5 & Unity Game SFX Library (1,000 SFX)', description: '1,000 professionally mastered 24-bit sound effects including UI clicks, sci-fi weapons, ambient environments, and impact sounds.', price: 899, image: '/images/services/audio_02.webp', tags: ['Game SFX', 'Audio Assets'], skills: ['Sound Design', 'Unreal Engine'] },
      { categorySlug: 'audio-music-assets', title: 'Cinematic Film Trailer Soundscapes & Ambient Pads', description: '200+ high-definition orchestral risers, deep bass drops, and atmospheric ambient drone audio tracks.', price: 699, image: '/images/services/audio_03.webp', tags: ['Cinematic', 'Soundscapes'], skills: ['Film Audio', 'Ambient'] },
      { categorySlug: 'audio-music-assets', title: 'UI Micro-Interaction Click & Pop Sound Pack', description: '200 crisp, modern user interface sound effects for mobile apps, web applications, and game menus.', price: 399, image: '/images/services/audio_04.webp', tags: ['UI Audio', 'SFX'], skills: ['Micro-Interactions', 'App Sounds'] },

      // 9. Memberships & Subscriptions
      { categorySlug: 'memberships-subscriptions', title: 'Senior Fullstack Architect Telegram Alpha', description: '30-day pass to exclusive private Telegram community for senior software engineers, indie hackers, and tech founders sharing architectural breakdowns.', price: 1499, image: '/images/services/membership_01.webp', tags: ['Membership', 'Telegram Alpha'], skills: ['Networking', 'Architecture'] },
      { categorySlug: 'memberships-subscriptions', title: 'VIP Remote Freelance Job Leads Channel', description: 'Real-time Telegram feed delivering verified $5,000+ remote contract job leads directly from YC startups and US enterprise clients.', price: 999, image: '/images/services/membership_02.webp', tags: ['Freelance', 'Job Leads'], skills: ['Remote Jobs', 'Contracting'] },
      { categorySlug: 'memberships-subscriptions', title: 'Indie Hacker Founders Mastermind Circle', description: 'Private community for micro-SaaS builders featuring weekly code reviews, growth teardowns, and monthly revenue accountability.', price: 1299, image: '/images/services/membership_03.webp', tags: ['Indie Hacker', 'Mastermind'], skills: ['SaaS Growth', 'Peer Review'] },
      { categorySlug: 'memberships-subscriptions', title: 'Quant Crypto Signals & Algorithmic Club', description: 'Real-time quantitative trading signals, market sentiment feeds, and automated Python trading bot strategies.', price: 1899, image: '/images/services/membership_04.webp', tags: ['Quant', 'Crypto Club'], skills: ['Trading Signals', 'Market Data'] },

      // 10. Data & Analytics Datasets
      { categorySlug: 'data-analytics-datasets', title: 'Global B2B SaaS Companies Lead Database', description: 'Cleaned CSV dataset containing 25,000+ verified B2B SaaS company profiles, executive emails, LinkedIn URLs, tech stack data, and funding rounds.', price: 2999, image: '/images/services/data_01.webp', tags: ['B2B Data', 'Lead Database'], skills: ['Lead Gen', 'Sales Data'] },
      { categorySlug: 'data-analytics-datasets', title: 'Top 500 Crypto Historical OHLCV Price Feed', description: 'Complete historical OHLCV price and volume market data for top 500 cryptocurrencies formatted in Parquet and CSV for backtesting.', price: 1899, image: '/images/services/data_02.webp', tags: ['Crypto Data', 'Backtesting'], skills: ['Quant Data', 'OHLCV'] },
      { categorySlug: 'data-analytics-datasets', title: 'US Tech Startups Funding & Employee Growth Data', description: '10,000+ venture capital funding rounds, headcount growth metrics, and technology adoption trends in CSV format.', price: 2199, image: '/images/services/data_03.webp', tags: ['Startups Data', 'VC Analytics'], skills: ['Market Research', 'CSV'] },
      { categorySlug: 'data-analytics-datasets', title: 'Global E-Commerce Products Pricing Analytics', description: 'Multi-retailer price tracking benchmarks, product taxonomy metrics, and discount trends across 50 major storefronts.', price: 1699, image: '/images/services/data_04.webp', tags: ['E-Commerce Data', 'Pricing'], skills: ['Benchmarking', 'Analytics'] },
    ]

    let inserted = 0
    let updated = 0
    let errors: string[] = []

    for (let i = 0; i < catalogData.length; i++) {
      try {
        const item = catalogData[i]
        const cat = categoryMap[item.categorySlug]
        if (!cat) continue

        const seller = createdSellers[i % createdSellers.length]
        const slug = `${item.categorySlug}-${i}`

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
              views: 350 + i * 15,
              completedOrders: 30 + i * 3,
              ratingAvg: 4.9,
              ratingCount: 25 + i * 2,
              tags: JSON.stringify(item.tags),
              skills: JSON.stringify(item.skills),
              images: JSON.stringify([item.image]),
              faqs: '[]',
              availability: 'available',
            },
          })
          inserted++
        } else {
          // Update images and category assignment
          await db.service.update({
            where: { id: exists.id },
            data: {
              categoryId: cat.id,
              images: JSON.stringify([item.image]),
              price: item.price,
              status: 'active',
            },
          })
          updated++
        }
      } catch (err: any) {
        errors.push(err?.message || String(err))
      }
    }

    // 4. Force update all existing services to custom WebP title thumbnails
    const allServices = await db.service.findMany()
    for (const s of allServices) {
      let newImg = '/images/services/software_01.webp'
      const t = s.title.toLowerCase()
      if (t.includes('telegram') || t.includes('gs ') || t.includes('upsc') || t.includes('anthropology') || t.includes('psir') || t.includes('public admin') || t.includes('geography')) {
        newImg = '/images/services/telegram_01.webp'
      } else if (t.includes('saas') || t.includes('next.js') || t.includes('python') || t.includes('bot') || t.includes('script') || t.includes('react')) {
        newImg = '/images/services/software_01.webp'
      } else if (t.includes('midjourney') || t.includes('chatgpt') || t.includes('claude') || t.includes('ai') || t.includes('diffusion')) {
        newImg = '/images/services/ai_01.webp'
      } else if (t.includes('figma') || t.includes('ui') || t.includes('design') || t.includes('dashboard') || t.includes('kit')) {
        newImg = '/images/services/ui_01.webp'
      } else if (t.includes('system design') || t.includes('handbook') || t.includes('blueprint') || t.includes('book') || t.includes('guide') || t.includes('quant')) {
        newImg = '/images/services/ebook_01.webp'
      } else if (t.includes('course') || t.includes('bootcamp') || t.includes('masterclass') || t.includes('video') || t.includes('flutter')) {
        newImg = '/images/services/video_01.webp'
      } else if (t.includes('template') || t.includes('theme') || t.includes('portfolio') || t.includes('storefront') || t.includes('landing')) {
        newImg = '/images/services/template_01.webp'
      } else if (t.includes('lofi') || t.includes('sfx') || t.includes('audio') || t.includes('sound') || t.includes('beats')) {
        newImg = '/images/services/audio_01.webp'
      } else if (t.includes('membership') || t.includes('alpha') || t.includes('club') || t.includes('vip') || t.includes('freelance')) {
        newImg = '/images/services/membership_01.webp'
      } else if (t.includes('data') || t.includes('lead') || t.includes('ohlcv') || t.includes('database') || t.includes('analytics')) {
        newImg = '/images/services/data_01.webp'
      }

      await db.service.update({
        where: { id: s.id },
        data: { images: JSON.stringify([newImg]) }
      })
    }

    clearCategoryCache()
    const serviceCount = await db.service.count()

    return ok({
      message: 'All 10 Marketplace Sections successfully populated with unique custom WebP branded title thumbnails!',
      inserted,
      updated,
      totalServices: serviceCount,
      errors
    })
  } catch (e: any) {
    return handleError(e)
  }
}