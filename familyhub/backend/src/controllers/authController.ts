import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  const token = jwt.sign(
    { sub: user.id, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, color: user.color },
  })
}

export function logout(_req: Request, res: Response) {
  res.json({ ok: true })
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, color: true },
  })
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }
  res.json(user)
}
