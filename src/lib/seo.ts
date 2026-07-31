export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SkillMarket',
    url: 'https://skillcart.shop',
    logo: 'https://skillcart.shop/logo.svg',
    description: 'Peer-to-Peer Digital Service & Product Marketplace powered by SkillCredits.',
    sameAs: [],
  }
}

export function generateProductSchema(service: {
  id: string
  title: string
  description?: string
  price: number
  coverUrl?: string | null
  seller?: { username: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: service.title,
    description: service.description || service.title,
    image: service.coverUrl ? `https://skillcart.shop${service.coverUrl}` : 'https://skillcart.shop/logo.svg',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: service.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: service.seller?.username || 'Verified Creator',
      },
    },
  }
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}
