import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()

const includeUsers = {
  owner: { select: { id: true, name: true, color: true } },
  helper: { select: { id: true, name: true, color: true } },
}

export async function getEvents(req: AuthRequest, res: Response) {
  const { from, to } = req.query
  const where: Record<string, unknown> = {}
  if (from || to) {
    where.startTime = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    }
  }
  const events = await prisma.event.findMany({ where, include: includeUsers, orderBy: { startTime: 'asc' } })
  res.json(events)
}

export async function getWeekEvents(req: AuthRequest, res: Response) {
  const date = req.query.date ? new Date(req.query.date as string) : new Date()
  const monday = startOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const events = await prisma.event.findMany({
    where: { startTime: { gte: monday, lte: sunday } },
    include: includeUsers,
    orderBy: { startTime: 'asc' },
  })
  res.json(events)
}

export async function getCriticalEvents(req: AuthRequest, res: Response) {
  const now = new Date()
  const in7days = new Date(now)
  in7days.setDate(now.getDate() + 7)

  const events = await prisma.event.findMany({
    where: {
      isCritical: true,
      startTime: { gte: now, lte: in7days },
    },
    include: includeUsers,
    orderBy: { startTime: 'asc' },
  })

  // Group by day and return unique critical days
  const days = new Set(events.map(e => e.startTime.toISOString().slice(0, 10)))
  res.json({ criticalDays: Array.from(days), events })
}

export async function createEvent(req: AuthRequest, res: Response) {
  const { title, type, startTime, endTime, isCritical, helperNote, helperId } = req.body
  const event = await prisma.event.create({
    data: {
      title,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isCritical: isCritical ?? false,
      helperNote,
      helperId,
      ownerId: req.userId!,
    },
    include: includeUsers,
  })
  res.status(201).json(event)
}

export async function updateEvent(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { title, type, startTime, endTime, isCritical, helperNote, helperId } = req.body
  const event = await prisma.event.update({
    where: { id },
    data: {
      title,
      type,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      isCritical,
      helperNote,
      helperId,
    },
    include: includeUsers,
  })
  res.json(event)
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  const { id } = req.params
  await prisma.event.delete({ where: { id } })
  res.json({ ok: true })
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 0
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
