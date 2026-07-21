import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const wallet = user.wallet
    if (!wallet) return err('WALLET_NOT_FOUND', 404)

    const txs = await db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })

    const csv = [
      'id,date,type,direction,amount,balanceAfter,note',
      ...txs.map((t) =>
        [
          t.id,
          t.createdAt.toISOString(),
          t.type,
          t.direction,
          t.amount,
          t.balanceAfter,
          `"${(t.note || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="wallet-statement-${Date.now()}.csv"`,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
