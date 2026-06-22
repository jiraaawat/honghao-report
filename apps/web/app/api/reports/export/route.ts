import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateMonthlyReport } from '@/lib/calculations'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const where: { userId: string; date?: { gte: Date; lt: Date } } = { userId }
  if (year && month) {
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    const end = new Date(Date.UTC(Number(year), Number(month), 1))
    where.date = { gte: start, lt: end }
  }

  const [allTransactions, reportTransactions, cards] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { card: true },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.findMany({ where }),
    prisma.card.findMany({
      where: { userId },
      include: {
        inventory: true,
        transactions: {
          where: { type: 'BUY' },
          select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
        },
      },
    }),
  ])

  const avgCostMap: Record<string, number> = {}
  for (const card of cards) {
    const normalBuyTxs = card.transactions.filter((t) => !t.isGradingCost)
    const gradingBuyTxs = card.transactions.filter((t) => t.isGradingCost)
    const totalBuyQty = normalBuyTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = normalBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalGradingCost = gradingBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    avgCostMap[card.id] = totalBuyQty > 0 ? (totalBuyAmount + totalGradingCost) / totalBuyQty : 0
  }

  const report = calculateMonthlyReport(reportTransactions, avgCostMap)

  const transactionsSheet = allTransactions.map((tx) => ({
    Date: tx.date.toISOString().split('T')[0],
    Card: tx.card?.name || 'Unknown',
    Type: tx.type,
    Quantity: tx.quantity,
    'Price/Unit': Number(tx.pricePerUnit),
    'Total Amount': Number(tx.totalAmount),
    Note: tx.note || '',
  }))

  const reportSheet = report.map((r) => ({
    Year: r.year,
    Month: r.month,
    'Total Buy': r.totalBuy,
    'Buy Qty': r.buyQty,
    'Total Sell': r.totalSell,
    'Sell Qty': r.sellQty,
    'Cost Basis Sold': r.costBasisSold,
    Profit: r.totalProfit,
    ROI: `${r.roi.toFixed(2)}%`,
    Transactions: r.transactionCount,
  }))

  const totalBuy = report.reduce((sum, r) => sum + r.totalBuy, 0)
  const totalProfit = report.reduce((sum, r) => sum + r.totalProfit, 0)

  const summarySheet = [
    {
      'Total Transactions': allTransactions.length,
      'Total Buy': totalBuy,
      'Total Sell': report.reduce((sum, r) => sum + r.totalSell, 0),
      'Total Profit': totalProfit,
      'Overall ROI': totalBuy > 0 ? `${((totalProfit / totalBuy) * 100).toFixed(2)}%` : '0.00%',
    },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionsSheet), 'Transactions')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reportSheet), 'Monthly Report')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summarySheet), 'Summary')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  const filename = year && month
    ? `honghao-report-${year}-${month.padStart(2, '0')}.xlsx`
    : 'honghao-report-all.xlsx'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
