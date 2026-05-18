import { PrismaClient, EventType, MealSlot, GroceryCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10)

  const [moi, conjointe] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'moi@familyhub.app' },
      update: {},
      create: {
        name: 'Moi',
        email: 'moi@familyhub.app',
        password: await hash('familyhub123'),
        color: '#4F8EF7',
      },
    }),
    prisma.user.upsert({
      where: { email: 'conjointe@familyhub.app' },
      update: {},
      create: {
        name: 'Conjointe',
        email: 'conjointe@familyhub.app',
        password: await hash('familyhub123'),
        color: '#F7724F',
      },
    }),
  ])

  // Recipes
  const pates = await prisma.recipe.upsert({
    where: { id: 'recipe-pates' },
    update: {},
    create: {
      id: 'recipe-pates',
      name: 'Pâtes à la bolognaise',
      description: 'Classique rapide en semaine',
      ingredients: {
        create: [
          { name: 'Pâtes', quantity: '400g', category: GroceryCategory.PANTRY },
          { name: 'Viande hachée', quantity: '500g', category: GroceryCategory.MEAT },
          { name: 'Tomates en boîte', quantity: '2 boîtes', category: GroceryCategory.PANTRY },
          { name: 'Oignon', quantity: '1', category: GroceryCategory.PRODUCE },
          { name: 'Ail', quantity: '3 gousses', category: GroceryCategory.PRODUCE },
        ],
      },
    },
  })

  const poulet = await prisma.recipe.upsert({
    where: { id: 'recipe-poulet' },
    update: {},
    create: {
      id: 'recipe-poulet',
      name: 'Poulet rôti aux légumes',
      description: 'Plat dominical réconfortant',
      ingredients: {
        create: [
          { name: 'Poulet entier', quantity: '1 (1.5kg)', category: GroceryCategory.MEAT },
          { name: 'Pommes de terre', quantity: '800g', category: GroceryCategory.PRODUCE },
          { name: 'Carottes', quantity: '4', category: GroceryCategory.PRODUCE },
          { name: 'Huile d\'olive', quantity: '3 c. à soupe', category: GroceryCategory.PANTRY },
          { name: 'Herbes de Provence', quantity: '1 c. à café', category: GroceryCategory.PANTRY },
        ],
      },
    },
  })

  const saumon = await prisma.recipe.upsert({
    where: { id: 'recipe-saumon' },
    update: {},
    create: {
      id: 'recipe-saumon',
      name: 'Saumon grillé & quinoa',
      description: 'Repas léger et équilibré',
      ingredients: {
        create: [
          { name: 'Filets de saumon', quantity: '2 (150g chacun)', category: GroceryCategory.MEAT },
          { name: 'Quinoa', quantity: '200g', category: GroceryCategory.PANTRY },
          { name: 'Citron', quantity: '1', category: GroceryCategory.PRODUCE },
          { name: 'Épinards frais', quantity: '100g', category: GroceryCategory.PRODUCE },
        ],
      },
    },
  })

  // Events — current week
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)

  const day = (offset: number, h: number, m = 0) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + offset)
    d.setHours(h, m, 0, 0)
    return d
  }

  await prisma.event.deleteMany({})

  await prisma.event.createMany({
    data: [
      {
        title: 'Cours de yoga',
        type: EventType.COURSE,
        startTime: day(1, 18),
        endTime: day(1, 19, 30),
        isCritical: false,
        ownerId: conjointe.id,
      },
      {
        title: 'Rentrée tardive — réunion client',
        type: EventType.LATE_RETURN,
        startTime: day(2, 8),
        endTime: day(2, 20),
        isCritical: true,
        helperNote: 'Maman arrive à 16h30',
        ownerId: moi.id,
      },
      {
        title: 'Sortie école — spectacle de fin d\'année',
        type: EventType.OUTING,
        startTime: day(3, 14),
        endTime: day(3, 17),
        isCritical: true,
        helperId: conjointe.id,
        ownerId: moi.id,
      },
      {
        title: 'Garde des enfants',
        type: EventType.CHILDCARE,
        startTime: day(4, 16),
        endTime: day(4, 18, 30),
        isCritical: false,
        ownerId: conjointe.id,
      },
      {
        title: 'Cours de natation',
        type: EventType.COURSE,
        startTime: day(5, 9),
        endTime: day(5, 10),
        isCritical: false,
        ownerId: moi.id,
      },
    ],
  })

  // Week plan with meals
  const weekStart = new Date(monday)

  const weekPlan = await prisma.weekPlan.upsert({
    where: { weekStart },
    update: {},
    create: {
      weekStart,
      createdById: moi.id,
      meals: {
        create: [
          { dayOfWeek: 0, slot: MealSlot.LUNCH, customLabel: 'Sandwich maison' },
          { dayOfWeek: 0, slot: MealSlot.DINNER, recipeId: pates.id },
          { dayOfWeek: 1, slot: MealSlot.LUNCH, customLabel: 'Restes de pâtes' },
          { dayOfWeek: 1, slot: MealSlot.DINNER, recipeId: saumon.id },
          { dayOfWeek: 2, slot: MealSlot.LUNCH, customLabel: 'Salade niçoise' },
          { dayOfWeek: 2, slot: MealSlot.DINNER, recipeId: poulet.id },
          { dayOfWeek: 3, slot: MealSlot.LUNCH, customLabel: 'Soupe & pain' },
          { dayOfWeek: 3, slot: MealSlot.DINNER, customLabel: 'Pizza maison' },
          { dayOfWeek: 4, slot: MealSlot.LUNCH, customLabel: 'Wraps au thon' },
          { dayOfWeek: 4, slot: MealSlot.DINNER, recipeId: pates.id },
          { dayOfWeek: 5, slot: MealSlot.DINNER, recipeId: poulet.id },
          { dayOfWeek: 6, slot: MealSlot.DINNER, customLabel: 'Raclette' },
        ],
      },
    },
  })

  console.log('Seed terminé ✓')
  console.log(`  Users: moi@familyhub.app / conjointe@familyhub.app (mdp: familyhub123)`)
  console.log(`  WeekPlan ID: ${weekPlan.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
