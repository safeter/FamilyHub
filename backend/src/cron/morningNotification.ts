import cron from 'node-cron'
import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function setupCron() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('VAPID keys not configured — push notifications disabled')
    return
  }

  webpush.setVapidDetails(
    VAPID_EMAIL || 'mailto:admin@familyhub.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )

  // Every day at 7:00
  cron.schedule('0 7 * * *', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const todayEvents = await prisma.event.findMany({
      where: { startTime: { gte: today, lt: new Date(today.getTime() + 86400000) } },
      include: {
        owner: { select: { name: true } },
        helper: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    const isCritical = todayEvents.some(e => e.isCritical)

    const todayMeal = await prisma.meal.findFirst({
      where: {
        dayOfWeek: today.getDay() === 0 ? 6 : today.getDay() - 1,
        slot: 'DINNER',
        weekPlan: { weekStart: { lte: today } },
      },
      include: { recipe: true },
    })

    const dinnerLabel = todayMeal?.recipe?.name ?? todayMeal?.customLabel ?? 'Non planifié'

    const parts: string[] = []
    if (isCritical) parts.push('⚠️ Jour critique')
    todayEvents.filter(e => e.isCritical).forEach(e => {
      if (e.helperNote) parts.push(e.helperNote)
      if (e.helper) parts.push(`${e.helper.name} aide`)
    })
    parts.push(`Souper : ${dinnerLabel}`)

    const body = isCritical
      ? parts.join(' · ')
      : `✅ Journée normale · ${parts[parts.length - 1]}`

    const payload = JSON.stringify({
      title: 'FamilyHub — Votre journée',
      body,
    })

    const users = await prisma.user.findMany({
      where: { pushSubscription: { not: null } },
      select: { pushSubscription: true },
    })

    for (const user of users) {
      try {
        await webpush.sendNotification(JSON.parse(user.pushSubscription!), payload)
      } catch (err) {
        console.error('Push notification failed:', err)
      }
    }
  })
}
