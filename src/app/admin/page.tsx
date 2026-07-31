import { requireAdmin } from '@/lib/auth'
import { AdminView } from '@/components/views/admin-view'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin Console · SkillCart' }

export default async function AdminDashboardPage() {
  await requireAdmin()

  return <AdminView />
}
