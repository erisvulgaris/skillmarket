import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/public/images/services"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Theme color palettes per category: (Background Start Hex, Background End Hex, Accent Hex, Badge Text)
PALETTES = {
    'telegram-services': ('#051c2c', '#0a3a5c', '#0088cc', 'TELEGRAM SERVICES'),
    'software-scripts': ('#032b1d', '#0a5c40', '#10b981', 'SOFTWARE & SCRIPTS'),
    'ai-prompts-models': ('#1e0a38', '#421678', '#a855f7', 'AI PROMPTS & MODELS'),
    'ui-ux-design-kits': ('#3b1022', '#781c42', '#ec4899', 'UI/UX DESIGN KITS'),
    'e-books-guides': ('#381805', '#78380a', '#f97316', 'E-BOOKS & GUIDES'),
    'video-tutorials-courses': ('#051c38', '#0a3d78', '#3b82f6', 'VIDEO COURSES'),
    'templates-themes': ('#2c0538', '#5c0a78', '#8b5cf6', 'TEMPLATES & THEMES'),
    'audio-music-assets': ('#052c2c', '#0a5c5c', '#14b8a6', 'AUDIO & MUSIC'),
    'memberships-subscriptions': ('#382b05', '#785c0a', '#eab308', 'MEMBERSHIPS'),
    'data-analytics-datasets': ('#1a202c', '#2d3748', '#6366f1', 'DATASETS & ANALYTICS'),
}

SERVICES = [
    # Telegram Services (Fixed ₹299)
    {
        'filename': 'telegram_01.webp',
        'category': 'telegram-services',
        'title': 'GS Foundation Strategist Batch',
        'subtitle': 'UPSC 2026 — Vajiram & ALS Lectures',
        'price': '₹299',
    },
    {
        'filename': 'telegram_02.webp',
        'category': 'telegram-services',
        'title': 'Integrated GS Prelims + Mains',
        'subtitle': 'Full Notes & Daily Evaluated Papers',
        'price': '₹299',
    },
    {
        'filename': 'telegram_03.webp',
        'category': 'telegram-services',
        'title': 'Anthropology Optional Course',
        'subtitle': 'Paper 1 & 2 Notes + Test Series',
        'price': '₹299',
    },
    {
        'filename': 'telegram_04.webp',
        'category': 'telegram-services',
        'title': 'PSIR Optional Complete Lectures',
        'subtitle': 'Shubhra Ranjan Handouts & IR',
        'price': '₹299',
    },
    {
        'filename': 'telegram_05.webp',
        'category': 'telegram-services',
        'title': 'Public Administration Masterclass',
        'subtitle': 'Synergy IAS Notes & Diagrams',
        'price': '₹299',
    },
    {
        'filename': 'telegram_06.webp',
        'category': 'telegram-services',
        'title': 'Geography Optional Complete Notes',
        'subtitle': 'Shabbir Sir Neostencil Series',
        'price': '₹299',
    },

    # Software & Scripts
    {
        'filename': 'software_01.webp',
        'category': 'software-scripts',
        'title': 'SaaSify Next.js 15 Starter Kit',
        'subtitle': 'Appwrite + Stripe Subscription Boilerplate',
        'price': '₹1,499',
    },
    {
        'filename': 'software_02.webp',
        'category': 'software-scripts',
        'title': 'Automated Python Scraper',
        'subtitle': 'Playwright + Proxy Lead Enrichment',
        'price': '₹899',
    },
    {
        'filename': 'software_03.webp',
        'category': 'software-scripts',
        'title': 'Telegram Bot Automation',
        'subtitle': 'Telegraf Node.js Paid Channel Engine',
        'price': '₹599',
    },
    {
        'filename': 'software_04.webp',
        'category': 'software-scripts',
        'title': 'React 19 Multi-Tenant SaaS UI',
        'subtitle': 'TypeScript + Tailwind v4 Admin Kit',
        'price': '₹1,299',
    },

    # AI Prompts & Models
    {
        'filename': 'ai_01.webp',
        'category': 'ai-prompts-models',
        'title': 'Midjourney v6 Architecture Pack',
        'subtitle': '150+ Photorealistic 3D & UI Prompts',
        'price': '₹499',
    },
    {
        'filename': 'ai_02.webp',
        'category': 'ai-prompts-models',
        'title': 'ChatGPT 4o SEO Prompt Chain',
        'subtitle': '2500+ Word Autonomous Article Writer',
        'price': '₹399',
    },
    {
        'filename': 'ai_03.webp',
        'category': 'ai-prompts-models',
        'title': 'Claude 3.5 Staff Engineer System',
        'subtitle': 'Battle-Tested Code Refactoring Prompts',
        'price': '₹499',
    },
    {
        'filename': 'ai_04.webp',
        'category': 'ai-prompts-models',
        'title': 'Stable Diffusion XL Cyberpunk LoRA',
        'subtitle': 'Fine-Tuned Character Weights & Checkpoints',
        'price': '₹699',
    },

    # UI/UX Design Kits
    {
        'filename': 'ui_01.webp',
        'category': 'ui-ux-design-kits',
        'title': 'Fintech Banking Mobile UI Kit',
        'subtitle': 'Figma Design System with 120+ Screens',
        'price': '₹1,299',
    },
    {
        'filename': 'ui_02.webp',
        'category': 'ui-ux-design-kits',
        'title': 'Dark Mode Obsidian Admin Kit',
        'subtitle': 'SaaS Dashboard Components for Figma',
        'price': '₹999',
    },
    {
        'filename': 'ui_03.webp',
        'category': 'ui-ux-design-kits',
        'title': 'E-Commerce iOS Mobile UI',
        'subtitle': '80+ Clean Shopping Screens & Cart',
        'price': '₹899',
    },
    {
        'filename': 'ui_04.webp',
        'category': 'ui-ux-design-kits',
        'title': 'Design Token Component Studio',
        'subtitle': 'Variables & Auto-Layout Figma Library',
        'price': '₹1,099',
    },

    # E-Books & Guides
    {
        'filename': 'ebook_01.webp',
        'category': 'e-books-guides',
        'title': 'System Design & Architecture',
        'subtitle': '250-Page Distributed Systems Handbook',
        'price': '₹699',
    },
    {
        'filename': 'ebook_02.webp',
        'category': 'e-books-guides',
        'title': 'Micro-SaaS Zero to $10k/mo',
        'subtitle': 'Indie Hacker Step-by-Step Blueprint',
        'price': '₹499',
    },
    {
        'filename': 'ebook_03.webp',
        'category': 'e-books-guides',
        'title': 'Fullstack TypeScript Testing',
        'subtitle': 'Vitest + Playwright Production Guide',
        'price': '₹599',
    },
    {
        'filename': 'ebook_04.webp',
        'category': 'e-books-guides',
        'title': 'Quant Crypto Trading Strategies',
        'subtitle': 'Python Backtesting & Signal Analysis',
        'price': '₹799',
    },

    # Video Courses
    {
        'filename': 'video_01.webp',
        'category': 'video-tutorials-courses',
        'title': 'Advanced Next.js 15 Masterclass',
        'subtitle': '12-Hour HD Video Course + Source Code',
        'price': '₹1,999',
    },
    {
        'filename': 'video_02.webp',
        'category': 'video-tutorials-courses',
        'title': 'Fullstack Rust & Wasm Bootcamp',
        'subtitle': '18-Hour Axum & Tokio Async Course',
        'price': '₹2,499',
    },
    {
        'filename': 'video_03.webp',
        'category': 'video-tutorials-courses',
        'title': 'Docker & Kubernetes Mastery',
        'subtitle': 'Production CI/CD Pipelines & DevOps',
        'price': '₹1,799',
    },
    {
        'filename': 'video_04.webp',
        'category': 'video-tutorials-courses',
        'title': 'Flutter & Riverpod Mobile Dev',
        'subtitle': 'Cross-Platform iOS & Android Course',
        'price': '₹1,899',
    },

    # Templates & Themes
    {
        'filename': 'template_01.webp',
        'category': 'templates-themes',
        'title': 'Developer Portfolio Theme',
        'subtitle': 'Vite + React + Tailwind Animated Template',
        'price': '₹499',
    },
    {
        'filename': 'template_02.webp',
        'category': 'templates-themes',
        'title': 'Next.js E-Commerce Storefront',
        'subtitle': 'Instant Checkout & Cart Drawer Template',
        'price': '₹1,199',
    },
    {
        'filename': 'template_03.webp',
        'category': 'templates-themes',
        'title': 'Shadcn UI Sleek SaaS Landing',
        'subtitle': 'High-Converting Marketing Page Kit',
        'price': '₹399',
    },
    {
        'filename': 'template_04.webp',
        'category': 'templates-themes',
        'title': 'Framer Motion Agency Studio',
        'subtitle': 'Interactive Creative Portfolio Theme',
        'price': '₹599',
    },

    # Audio Assets
    {
        'filename': 'audio_01.webp',
        'category': 'audio-music-assets',
        'title': 'Lofi Beats for Deep Work',
        'subtitle': '50 Royalty-Free WAV/MP3 Coding Tracks',
        'price': '₹599',
    },
    {
        'filename': 'audio_02.webp',
        'category': 'audio-music-assets',
        'title': 'Game SFX Library (1,000 Sounds)',
        'subtitle': 'Unreal 5 & Unity Mastered Audio Pack',
        'price': '₹899',
    },
    {
        'filename': 'audio_03.webp',
        'category': 'audio-music-assets',
        'title': 'Cinematic Trailer Soundscapes',
        'subtitle': 'Ambient Pads & Orchestral Risers',
        'price': '₹699',
    },
    {
        'filename': 'audio_04.webp',
        'category': 'audio-music-assets',
        'title': 'UI Click & Micro-Interaction SFX',
        'subtitle': '200+ Crisp App Sound Effects',
        'price': '₹399',
    },

    # Memberships & Subscriptions
    {
        'filename': 'membership_01.webp',
        'category': 'memberships-subscriptions',
        'title': 'Senior Architect Telegram Alpha',
        'subtitle': '30-Day Private Engineering Circle Pass',
        'price': '₹1,499',
    },
    {
        'filename': 'membership_02.webp',
        'category': 'memberships-subscriptions',
        'title': 'Remote Freelance Job Leads VIP',
        'subtitle': '$5k+ Verified YC Remote Contracts Feed',
        'price': '₹999',
    },
    {
        'filename': 'membership_03.webp',
        'category': 'memberships-subscriptions',
        'title': 'Indie Hacker Founders Club',
        'subtitle': 'Weekly Code Reviews & Growth Mastermind',
        'price': '₹1,299',
    },
    {
        'filename': 'membership_04.webp',
        'category': 'memberships-subscriptions',
        'title': 'Quant Crypto Signals & Insights',
        'subtitle': 'Algorithmic Market Data Subscription',
        'price': '₹1,899',
    },

    # Data & Datasets
    {
        'filename': 'data_01.webp',
        'category': 'data-analytics-datasets',
        'title': 'Global B2B SaaS Lead Database',
        'subtitle': '25,000+ Verified Executive Profiles & Emails',
        'price': '₹2,999',
    },
    {
        'filename': 'data_02.webp',
        'category': 'data-analytics-datasets',
        'title': 'Crypto OHLCV Historical Price Data',
        'subtitle': 'Top 500 Coins 2018-2026 Parquet & CSV',
        'price': '₹1,899',
    },
    {
        'filename': 'data_03.webp',
        'category': 'data-analytics-datasets',
        'title': 'US Tech Startup Funding Dataset',
        'subtitle': '10,000 VC Funding Rounds & Tech Stacks',
        'price': '₹2,199',
    },
    {
        'filename': 'data_04.webp',
        'category': 'data-analytics-datasets',
        'title': 'Global E-Commerce Pricing Benchmark',
        'subtitle': 'Multi-Retailer Price Analytics CSV',
        'price': '₹1,699',
    },
]

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def create_gradient_image(width, height, start_hex, end_hex):
    base = Image.new('RGB', (width, height), start_hex)
    top = Image.new('RGB', (width, height), end_hex)
    mask = Image.new('L', (width, height))
    mask_draw = ImageDraw.Draw(mask)
    for y in range(height):
        alpha = int(255 * (y / height))
        mask_draw.line([(0, y), (width, y)], fill=alpha)
    base.paste(top, (0, 0), mask)
    return base

def draw_thumbnail(service):
    w, h = 800, 500
    cat_info = PALETTES.get(service['category'], ('#0f172a', '#1e293b', '#10b981', 'DIGITAL PRODUCT'))
    start_hex, end_hex, accent_hex, badge_label = cat_info

    img = create_gradient_image(w, h, start_hex, end_hex)
    draw = ImageDraw.Draw(img)

    # Accent decorative geometric lines
    accent_rgb = hex_to_rgb(accent_hex)
    for offset in range(0, w + h, 40):
        draw.line([(offset, 0), (offset - h, h)], fill=(*accent_rgb, 20), width=3)

    # Corner glow / card frame border
    draw.rectangle([10, 10, w - 10, h - 10], outline=(*accent_rgb, 120), width=3)

    # Header Badge (Category)
    badge_bg = hex_to_rgb(accent_hex)
    draw.rectangle([30, 35, 320, 75], fill=badge_bg)
    draw.text((45, 45), badge_label, fill=(255, 255, 255), font_size=16)

    # Watermark logo top right
    draw.text((w - 180, 45), "SKILLCART", fill=(255, 255, 255), font_size=20)

    # Main Service Title (Centered Big Text)
    title_text = service['title']
    subtitle_text = service['subtitle']
    price_text = service['price']

    # Draw Title
    draw.text((45, 160), title_text, fill=(255, 255, 255), font_size=36)

    # Draw Subtitle
    draw.text((45, 225), subtitle_text, fill=(200, 220, 240), font_size=22)

    # Footer Card Bar
    draw.rectangle([30, h - 100, w - 30, h - 30], fill=(0, 0, 0), outline=(*accent_rgb, 200), width=2)
    draw.text((50, h - 80), "Verified Independent Digital Asset · Instant Delivery", fill=(200, 200, 200), font_size=16)

    # Price Tag Badge Bottom Right
    price_box_x1 = w - 210
    draw.rectangle([price_box_x1, h - 90, w - 40, h - 40], fill=badge_bg)
    draw.text((price_box_x1 + 25, h - 77), price_text, fill=(255, 255, 255), font_size=26)

    output_path = os.path.join(OUTPUT_DIR, service['filename'])
    img.save(output_path, "WEBP", quality=90)
    print(f"Generated: {service['filename']}")

if __name__ == '__main__':
    print(f"Generating {len(SERVICES)} custom service thumbnails...")
    for s in SERVICES:
        draw_thumbnail(s)
    print("All custom service thumbnails generated successfully!")
