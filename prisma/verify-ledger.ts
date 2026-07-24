// Wallet integrity verification script
// Verifies double-entry ledger conservation: sum of all debits == sum of all credits
// Run with: bun run prisma/verify-ledger.ts

import { db } from '../src/lib/db'

async function verifyLedger() {
  console.log('🔍 Verifying wallet ledger integrity...\n')

  // 1. Check ledger conservation: total debits should equal total credits
  const ledgerEntries = await db.ledgerEntry.findMany()
  const totalDebits = ledgerEntries.filter((e) => e.entryType === 'debit').reduce((s, e) => s + e.amount, 0)
  const totalCredits = ledgerEntries.filter((e) => e.entryType === 'credit').reduce((s, e) => s + e.amount, 0)

  console.log(`📊 Ledger Entries: ${ledgerEntries.length}`)
  console.log(`   Total Debits:  ${totalDebits} SC`)
  console.log(`   Total Credits: ${totalCredits} SC`)
  console.log(`   Balanced: ${totalDebits === totalCredits ? '✅ YES' : '❌ NO (diff: ' + (totalDebits - totalCredits) + ')'}\n`)

  // 2. Check each wallet: available + reserved should match transaction history
  const wallets = await db.wallet.findMany()
  let walletErrors = 0

  for (const wallet of wallets) {
    const txs = await db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'asc' },
    })

    let computedBalance = 0
    for (const tx of txs) {
      if (tx.direction === 'credit') computedBalance += tx.amount
      else computedBalance -= tx.amount
    }

    // The computed balance from transactions should match available + reserved (approximately, since escrow moves are internal)
    const walletTotal = wallet.availableBalance + wallet.reservedBalance
    const diff = computedBalance - walletTotal

    if (Math.abs(diff) > 0) {
      console.log(`❌ Wallet ${wallet.id} (user: ${wallet.userId}):`)
      console.log(`   Computed: ${computedBalance}, Actual: ${walletTotal}, Diff: ${diff}`)
      walletErrors++
    }
  }

  console.log(`\n📊 Wallets checked: ${wallets.length}`)
  console.log(`   Errors: ${walletErrors === 0 ? '✅ None' : '❌ ' + walletErrors + ' wallets have balance mismatches'}\n`)

  // 3. Check that every wallet transaction has corresponding ledger entries
  const txsWithoutLedger = await db.walletTransaction.findMany({
    where: {
      id: { notIn: (await db.ledgerEntry.findMany({ where: { transactionId: { not: null } }, select: { transactionId: true } })).map((e) => e.transactionId!) },
    },
    select: { id: true, type: true, amount: true },
  })

  console.log(`📊 Transactions without ledger entries: ${txsWithoutLedger.length === 0 ? '✅ None' : '❌ ' + txsWithoutLedger.length}`)

  // 4. Check transfer pairs: each transfer should have 2 wallet transactions (debit + credit)
  const transfers = await db.transfer.findMany({ where: { status: 'completed' } })
  let transferErrors = 0
  for (const transfer of transfers) {
    const senderTx = await db.walletTransaction.findFirst({
      where: { referenceId: transfer.id, referenceType: 'transfer', direction: 'debit' },
    })
    const receiverTx = await db.walletTransaction.findFirst({
      where: { referenceId: transfer.id, referenceType: 'transfer', direction: 'credit' },
    })
    if (!senderTx || !receiverTx) {
      console.log(`❌ Transfer ${transfer.id} (${transfer.receiptNo}): missing ${!senderTx ? 'sender' : ''} ${!receiverTx ? 'receiver' : ''} transaction`)
      transferErrors++
    }
  }

  console.log(`\n📊 Transfers checked: ${transfers.length}`)
  console.log(`   Errors: ${transferErrors === 0 ? '✅ None' : '❌ ' + transferErrors + ' transfers have missing transactions'}`)

  // Summary
  const allPassed = totalDebits === totalCredits && walletErrors === 0 && txsWithoutLedger.length === 0 && transferErrors === 0
  console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED — Ledger integrity verified!' : '❌ SOME CHECKS FAILED — Review errors above'}`)

  return allPassed
}

verifyLedger()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
