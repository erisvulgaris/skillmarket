import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const db = new PrismaClient()

function genReferralCode(username: string) {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'USER'
  return `${base}${randomBytes(3).toString('hex').toUpperCase()}`
}

async function main() {
  console.log('Seeding database...')

  const categories = await Promise.all([
    db.category.create({ data: { name: 'Design & Creative', slug: 'design', icon: '🎨', sortOrder: 1, featured: true } }),
    db.category.create({ data: { name: 'Development', slug: 'development', icon: '💻', sortOrder: 2, featured: true } }),
    db.category.create({ data: { name: 'Writing', slug: 'writing', icon: '✍️', sortOrder: 3, featured: true } }),
    db.category.create({ data: { name: 'Marketing', slug: 'marketing', icon: '📈', sortOrder: 4, featured: true } }),
    db.category.create({ data: { name: 'Video & Animation', slug: 'video', icon: '🎬', sortOrder: 5 } }),
    db.category.create({ data: { name: 'Music & Audio', slug: 'music', icon: '🎵', sortOrder: 6 } }),
    db.category.create({ data: { name: 'Business', slug: 'business', icon: '💼', sortOrder: 7 } }),
    db.category.create({ data: { name: 'AI Services', slug: 'ai', icon: '🤖', sortOrder: 8, featured: true } }),
  ])

  // Helper: create wallet with initial ledger entry
  async function createWalletWithLedger(userId: string, data: { availableBalance: number; lifetimePurchased?: number; lifetimeEarned?: number }) {
    const wallet = await db.wallet.create({ data: { userId, ...data } })
    if (data.availableBalance > 0) {
      const tx = await db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'admin_adjustment',
          direction: 'credit',
          amount: data.availableBalance,
          balanceAfter: data.availableBalance,
          note: 'Initial seed balance',
        },
      })
      await db.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: 'credit',
          account: 'user_wallet',
          amount: data.availableBalance,
          transactionId: tx.id,
          referenceType: 'initial_seed',
        },
      })
    }
    return wallet
  }

  const adminPass = await bcrypt.hash('admin12345', 12)
  const adminPin = await bcrypt.hash('1234', 10)
  const admin = await db.user.create({
    data: {
      email: 'admin@skillcart.app',
      username: 'admin',
      passwordHash: adminPass,
      transactionPinHash: adminPin,
      role: 'admin',
      referralCode: 'ADMIN0001',
      emailVerifiedAt: new Date(),
      profile: { create: { displayName: 'Platform Admin', bio: 'SkillCart administrator', languages: '["en"]', skills: '[]' } },
    },
  })
  await createWalletWithLedger(admin.id, { availableBalance: 100000, lifetimePurchased: 100000 })

  const demoUsers = [
    { username: 'maya_designs', email: 'maya@example.com', displayName: 'Maya Chen', bio: 'Brand & logo designer with 8+ years experience', skills: ['Logo Design', 'Branding', 'Illustration'], languages: ['en', 'zh'], verified: true, categoryId: categories[0].id },
    { username: 'dev_alex', email: 'alex@example.com', displayName: 'Alex Rivera', bio: 'Full-stack developer specializing in Next.js & React', skills: ['Next.js', 'TypeScript', 'React', 'Node.js'], languages: ['en', 'es'], verified: true, categoryId: categories[1].id },
    { username: 'writer_sam', email: 'sam@example.com', displayName: 'Sam Okafor', bio: 'Content writer & copyeditor', skills: ['SEO Writing', 'Copywriting', 'Editing'], languages: ['en'], verified: false, categoryId: categories[2].id },
    { username: 'studio_pixel', email: 'pixel@example.com', displayName: 'Pixel Studio', bio: 'Motion graphics & animation studio', skills: ['After Effects', '3D Animation', 'Motion Design'], languages: ['en'], verified: true, categoryId: categories[4].id },
    { username: 'ai_nova', email: 'nova@example.com', displayName: 'Nova AI', bio: 'AI prompt engineer & automation expert', skills: ['Prompt Engineering', 'LLM', 'Automation', 'RAG'], languages: ['en'], verified: true, categoryId: categories[7].id },
  ]

  const sellers: any[] = []
  for (const du of demoUsers) {
    const pass = await bcrypt.hash('password123', 12)
    const pin = await bcrypt.hash('1234', 10)
    const balance = 500 + Math.floor(Math.random() * 2000)
    const earned = Math.floor(Math.random() * 5000)
    const u = await db.user.create({
      data: {
        email: du.email,
        username: du.username,
        passwordHash: pass,
        transactionPinHash: pin,
        referralCode: genReferralCode(du.username),
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            displayName: du.displayName,
            bio: du.bio,
            languages: JSON.stringify(du.languages),
            skills: JSON.stringify(du.skills),
            isVerified: du.verified,
            verificationType: du.verified ? 'identity' : null,
            responseTimeMins: 60 + Math.floor(Math.random() * 120),
          },
        },
      },
    })
    await createWalletWithLedger(u.id, { availableBalance: balance, lifetimeEarned: earned })
    sellers.push({ ...u, _data: du })
  }

  const buyerPass = await bcrypt.hash('password123', 12)
  const buyerPin = await bcrypt.hash('1234', 10)
  const buyer = await db.user.create({
    data: {
      email: 'buyer@example.com',
      username: 'demo_buyer',
      passwordHash: buyerPass,
      transactionPinHash: buyerPin,
      referralCode: genReferralCode('demo_buyer'),
      emailVerifiedAt: new Date(),
      profile: { create: { displayName: 'Demo Buyer', languages: '["en"]', skills: '[]' } },
    },
  })
  await createWalletWithLedger(buyer.id, { availableBalance: 50000, lifetimePurchased: 50000 })

  const serviceTemplates = [
    { sellerIdx: 0, title: 'I will design a premium minimalist logo for your brand', desc: 'Get a unique, professional logo that captures your brand essence. Includes 3 concepts, unlimited revisions, and all source files.\n\nWhat you get:\n- 3 unique logo concepts\n- Unlimited revisions until you\'re happy\n- Final files in PNG, SVG, and PDF\n- Full commercial rights', price: 150, days: 3, tags: ['logo', 'branding', 'minimalist'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=logo-design&backgroundColor=e0f2fe'], faqs: [{ q: 'How many revisions?', a: 'Unlimited until you are satisfied.' }, { q: 'Source files included?', a: 'Yes, AI/EPS/SVG/PNG.' }] },
    { sellerIdx: 0, title: 'I will create a complete brand identity package', desc: 'Complete branding kit including logo, color palette, typography, and brand guidelines document.', price: 450, days: 7, tags: ['branding', 'identity', 'design'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=brand-identity&backgroundColor=fce7f3'], faqs: [{ q: 'Includes guidelines?', a: 'Yes, a full PDF brand guide.' }] },
    { sellerIdx: 1, title: 'I will build a modern Next.js web application', desc: 'Full-stack Next.js app with TypeScript, Tailwind CSS, Prisma, and authentication. Production-ready code.', price: 800, days: 14, tags: ['nextjs', 'react', 'typescript', 'web'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=nextjs-app&backgroundColor=d1fae5'], faqs: [] },
    { sellerIdx: 1, title: 'I will fix bugs and add features to your React app', desc: 'Quick turnaround bug fixes and feature development for existing React/Next.js applications.', price: 75, days: 2, tags: ['react', 'bugfix', 'development'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=react-bugfix&backgroundColor=ede9fe'], faqs: [] },
    { sellerIdx: 2, title: 'I will write SEO-optimized blog articles that rank', desc: 'Engaging, research-backed articles optimized for search engines. 1000-2000 words per article.', price: 90, days: 4, tags: ['seo', 'writing', 'content', 'blog'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=seo-writing&backgroundColor=fff7ed'], faqs: [{ q: 'Word count?', a: '1000-2000 words per article.' }] },
    { sellerIdx: 3, title: 'I will create an animated explainer video', desc: 'Professional 60-second animated explainer video with voiceover, custom illustrations, and sound design.', price: 600, days: 10, tags: ['animation', 'video', 'explainer', 'motion'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=explainer-video&backgroundColor=fef3c7'], faqs: [] },
    { sellerIdx: 4, title: 'I will build a custom AI chatbot for your business', desc: 'Intelligent chatbot powered by LLMs with custom knowledge base, integrated into your website or app.', price: 1200, days: 14, tags: ['ai', 'chatbot', 'llm', 'automation'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=ai-chatbot&backgroundColor=ecfdf5'], faqs: [{ q: 'Which LLM?', a: 'GPT-4, Claude, or open-source.' }] },
    { sellerIdx: 4, title: 'I will create AI-generated art and illustrations', desc: 'Custom AI artwork for your projects. Includes 10 high-resolution images with commercial rights.', price: 120, days: 2, tags: ['ai', 'art', 'illustration', 'design'], images: ['https://api.dicebear.com/7.x/shapes/svg?seed=ai-art&backgroundColor=fdf4ff'], faqs: [] },
  ]

  for (const t of serviceTemplates) {
    const seller = sellers[t.sellerIdx]
    const slug = t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-' + randomBytes(2).toString('hex')
    await db.service.create({
      data: {
        sellerId: seller.id,
        categoryId: t.sellerIdx === 0 ? categories[0].id : t.sellerIdx === 1 ? categories[1].id : t.sellerIdx === 2 ? categories[2].id : t.sellerIdx === 3 ? categories[4].id : categories[7].id,
        title: t.title,
        slug,
        description: t.desc,
        price: t.price,
        deliveryDays: t.days,
        tags: JSON.stringify(t.tags),
        skills: JSON.stringify(seller._data.skills),
        images: JSON.stringify(t.images),
        faqs: JSON.stringify(t.faqs),
        status: 'active',
        featured: Math.random() > 0.6,
        trendingScore: Math.random() * 100,
        views: Math.floor(Math.random() * 500),
        ratingAvg: 4 + Math.random(),
        ratingCount: Math.floor(Math.random() * 30),
        completedOrders: Math.floor(Math.random() * 50),
      },
    })
  }

  await Promise.all([
    db.featureFlag.create({ data: { key: 'marketplace', label: 'Marketplace', enabled: true, description: 'Enable the public marketplace' } }),
    db.featureFlag.create({ data: { key: 'transfers', label: 'Wallet Transfers', enabled: true, description: 'Enable P2P transfers' } }),
    db.featureFlag.create({ data: { key: 'messaging', label: 'Real-time Messaging', enabled: true, description: 'Enable socket.io chat' } }),
    db.featureFlag.create({ data: { key: 'referrals', label: 'Referral Program', enabled: true, description: 'Enable referral rewards' } }),
    db.featureFlag.create({ data: { key: 'maintenance', label: 'Maintenance Mode', enabled: false, description: 'Take platform offline' } }),
  ])

  await Promise.all([
    db.setting.create({ data: { key: 'credit_price_usd', value: '0.01', type: 'number' } }),
    db.setting.create({ data: { key: 'min_transfer', value: '1', type: 'number' } }),
    db.setting.create({ data: { key: 'max_transfer', value: '10000', type: 'number' } }),
    db.setting.create({ data: { key: 'referral_reward', value: '50', type: 'number' } }),
    db.setting.create({ data: { key: 'signup_bonus', value: '0', type: 'number' } }),
    db.setting.create({ data: { key: 'platform_name', value: 'SkillCart', type: 'string' } }),
  ])

  await Promise.all([
    db.cmsPage.create({ data: { slug: 'terms', title: 'Terms of Service', body: '# Terms of Service\n\n## 1. Acceptance of Terms\nBy accessing or using SkillCart, you agree to be bound by these Terms of Service.\n\n## 2. Description of Service\nSkillCart is a peer-to-peer marketplace for digital services. Users can buy and sell services using SkillCredits, a virtual currency.\n\n## 3. User Obligations\n- You must provide accurate registration information\n- You are responsible for maintaining the confidentiality of your account\n- You may not use the platform for any illegal purpose\n\n## 4. Payments and Fees\nAll transactions are processed in SkillCredits. SkillCredits are a virtual currency with no cash value and are non-refundable.\n\n## 5. Dispute Resolution\nDisputes between buyers and sellers should first be resolved through direct communication. If unresolved, either party may file a dispute through our platform.\n\n## 6. Limitation of Liability\nSkillCart is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform.', published: true } }),
    db.cmsPage.create({ data: { slug: 'privacy', title: 'Privacy Policy', body: '# Privacy Policy\n\n## Information We Collect\n- Account information (email, username, profile data)\n- Transaction records\n- Communication data (messages, support tickets)\n- Device and usage information\n\n## How We Use Your Information\n- To provide and improve our services\n- To process transactions\n- To communicate with you about your account\n- To detect and prevent fraud\n\n## Data Protection\nWe implement industry-standard security measures to protect your data. Your password is hashed and never stored in plain text.\n\n## Third-Party Services\nWe do not sell your personal data to third parties. We may share data with service providers who assist in platform operations.\n\n## Contact\nFor privacy concerns, please contact support within the platform.', published: true } }),
    db.cmsPage.create({ data: { slug: 'faq', title: 'Frequently Asked Questions', body: '# Frequently Asked Questions\n\n## What are SkillCredits?\nSkillCredits (SC) are the virtual currency used on SkillCart. They can be purchased and used to buy services from sellers.\n\n## How do I buy SkillCredits?\nGo to your Wallet and tap "Buy Credits". Choose a package and complete the purchase. Credits are added to your wallet immediately.\n\n## How do transfers work?\nYou can send SkillCredits to any other user. A transaction PIN is required for security. Transfers are instant and irreversible.\n\n## Is there an escrow system?\nYes. When you place an order, the payment is held in escrow. It is released to the seller only after you confirm receipt of the service.\n\n## How do I become a seller?\nTap the + button on the bottom nav and create your first service listing. Fill in details, set your price, and publish.\n\n## How do I reset my PIN?\nGo to Settings → Security → Change Transaction PIN. You will need your current PIN to set a new one.\n\n## Are refunds possible?\nIf a seller cannot deliver, you can cancel the order and the escrowed funds will be returned to your wallet. Disputes can be filed through the order page.\n\n## Can I withdraw SkillCredits as cash?\nNo. SkillCredits are a virtual currency that can only be used within SkillCart. They have no cash value.', published: true } }),
  ])

  console.log('✓ Seed complete')
  console.log('  Admin login:  admin@skillcart.app / admin12345 (PIN 1234)')
  console.log('  Buyer login:   buyer@example.com / password123 (PIN 1234)')
  console.log('  Seller login:  maya@example.com / password123 (PIN 1234)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
