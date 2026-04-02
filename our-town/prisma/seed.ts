import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Handyman', icon: '🔨' },
  { name: 'Fence & Gate Repair', icon: '🪚' },
  { name: 'Deck Building', icon: '🏗️' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Plumbing', icon: '🔧' },
  { name: 'HVAC', icon: '❄️' },
  { name: 'Auto Repair', icon: '🚗' },
  { name: 'Mobile Mechanic', icon: '🔩' },
  { name: 'Welding', icon: '🔥' },
  { name: 'Window Tint', icon: '🪟' },
  { name: 'Massage', icon: '💆' },
  { name: 'Landscaping', icon: '🌿' },
  { name: 'Hauling', icon: '🚛' },
  { name: 'Tractor Work', icon: '🚜' },
  { name: 'Farm Goods', icon: '🌽' },
  { name: 'Eggs & Produce', icon: '🥚' },
  { name: 'Web Design', icon: '💻' },
  { name: 'AI Consulting', icon: '🤖' },
  { name: 'Business Automation', icon: '⚙️' },
  { name: 'Childcare', icon: '👶' },
  { name: 'Pet Care', icon: '🐾' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Carpentry', icon: '🪵' },
  { name: 'Painting', icon: '🎨' },
  { name: 'Delivery & Errands', icon: '📦' },
  { name: 'Tutoring', icon: '📚' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Upsert categories
  const categoryMap: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: cat,
    })
    categoryMap[cat.name] = created.id
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`)

  // Seed demo user: Jesse
  const hash = await bcrypt.hash('demo1234', 10)
  const jesse = await prisma.user.upsert({
    where: { email: 'jesse@demo.com' },
    update: {},
    create: {
      name: 'Jesse',
      email: 'jesse@demo.com',
      passwordHash: hash,
      city: 'Milton',
      state: 'FL',
      zip: '32570',
      bio: "Hi, I'm Jesse. I'm looking to connect locally with people interested in skill trades, service exchanges, and building real community relationships.",
      radius: 25,
      contactMethod: 'email',
      contactValue: 'jesse@demo.com',
      isApproved: true,
    },
  })

  // Jesse's offers
  const jesseOffers = [
    { title: 'Fence building', categoryId: categoryMap['Fence & Gate Repair'] },
    { title: 'Fence and gate repair', categoryId: categoryMap['Fence & Gate Repair'] },
    { title: 'Deck building and repair', categoryId: categoryMap['Deck Building'] },
    { title: 'General home repairs', categoryId: categoryMap['Handyman'] },
    { title: 'Tractor work', categoryId: categoryMap['Tractor Work'] },
    { title: 'Hauling / dump runs', categoryId: categoryMap['Hauling'] },
    { title: 'Pine straw spreading', categoryId: categoryMap['Landscaping'] },
    { title: 'Raking / cleanup', categoryId: categoryMap['Landscaping'] },
    { title: 'Farm fresh eggs', categoryId: categoryMap['Eggs & Produce'] },
    { title: 'Website building', categoryId: categoryMap['Web Design'] },
    { title: 'AI consulting', categoryId: categoryMap['AI Consulting'] },
    { title: 'Automation systems', categoryId: categoryMap['Business Automation'] },
  ]

  // Jesse's needs
  const jesseNeeds = [
    { title: 'Electrician', categoryId: categoryMap['Electrical'] },
    { title: 'Mobile auto mechanic', categoryId: categoryMap['Mobile Mechanic'] },
    { title: 'Window tint professional', categoryId: categoryMap['Window Tint'] },
    { title: 'Massage therapist', categoryId: categoryMap['Massage'] },
    { title: 'Homegrown food / produce', categoryId: categoryMap['Eggs & Produce'] },
    { title: 'Plumbing help', categoryId: categoryMap['Plumbing'] },
    { title: 'HVAC help', categoryId: categoryMap['HVAC'] },
    { title: 'Welding / fabrication', categoryId: categoryMap['Welding'] },
  ]

  // Clear and re-seed Jesse's offers/needs
  await prisma.offer.deleteMany({ where: { userId: jesse.id } })
  await prisma.need.deleteMany({ where: { userId: jesse.id } })
  await prisma.offer.createMany({ data: jesseOffers.map(o => ({ ...o, userId: jesse.id })) })
  await prisma.need.createMany({ data: jesseNeeds.map(n => ({ ...n, userId: jesse.id })) })
  console.log('✅ Jesse seeded')

  // Demo user: Maria (mechanic/massage)
  const maria = await prisma.user.upsert({
    where: { email: 'maria@demo.com' },
    update: {},
    create: {
      name: 'Maria',
      email: 'maria@demo.com',
      passwordHash: hash,
      city: 'Pensacola',
      state: 'FL',
      zip: '32501',
      bio: 'Licensed massage therapist with 10 years of experience. Happy to trade for home services or farm goods!',
      radius: 20,
      contactMethod: 'phone',
      contactValue: '850-555-0101',
      isApproved: true,
    },
  })
  await prisma.offer.deleteMany({ where: { userId: maria.id } })
  await prisma.need.deleteMany({ where: { userId: maria.id } })
  await prisma.offer.createMany({
    data: [
      { userId: maria.id, title: 'Deep tissue massage', categoryId: categoryMap['Massage'] },
      { userId: maria.id, title: 'Sports massage', categoryId: categoryMap['Massage'] },
    ],
  })
  await prisma.need.createMany({
    data: [
      { userId: maria.id, title: 'Fence repair', categoryId: categoryMap['Fence & Gate Repair'] },
      { userId: maria.id, title: 'Landscaping help', categoryId: categoryMap['Landscaping'] },
      { userId: maria.id, title: 'Farm fresh eggs', categoryId: categoryMap['Eggs & Produce'] },
    ],
  })
  console.log('✅ Maria seeded')

  // Demo user: Bob (mechanic)
  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@demo.com',
      passwordHash: hash,
      city: 'Pace',
      state: 'FL',
      zip: '32571',
      bio: 'Mobile mechanic serving the Pace/Milton area. I can fix almost anything with wheels. Looking to trade for home improvement and fresh produce.',
      radius: 30,
      contactMethod: 'phone',
      contactValue: '850-555-0202',
      isApproved: true,
    },
  })
  await prisma.offer.deleteMany({ where: { userId: bob.id } })
  await prisma.need.deleteMany({ where: { userId: bob.id } })
  await prisma.offer.createMany({
    data: [
      { userId: bob.id, title: 'Mobile auto repair', categoryId: categoryMap['Mobile Mechanic'] },
      { userId: bob.id, title: 'Oil changes on-site', categoryId: categoryMap['Auto Repair'] },
      { userId: bob.id, title: 'Welding', categoryId: categoryMap['Welding'] },
    ],
  })
  await prisma.need.createMany({
    data: [
      { userId: bob.id, title: 'Deck repair', categoryId: categoryMap['Deck Building'] },
      { userId: bob.id, title: 'Website help', categoryId: categoryMap['Web Design'] },
      { userId: bob.id, title: 'Eggs / produce', categoryId: categoryMap['Eggs & Produce'] },
    ],
  })
  console.log('✅ Bob seeded')

  // Demo user: Lisa (electrician)
  const lisa = await prisma.user.upsert({
    where: { email: 'lisa@demo.com' },
    update: {},
    create: {
      name: 'Lisa',
      email: 'lisa@demo.com',
      passwordHash: hash,
      city: 'Gulf Breeze',
      state: 'FL',
      zip: '32561',
      bio: 'Licensed electrician, 15 years experience. I can handle residential and small commercial work. Looking to trade for childcare, tractor work, or fresh food.',
      radius: 40,
      contactMethod: 'email',
      contactValue: 'lisa@demo.com',
      isApproved: true,
    },
  })
  await prisma.offer.deleteMany({ where: { userId: lisa.id } })
  await prisma.need.deleteMany({ where: { userId: lisa.id } })
  await prisma.offer.createMany({
    data: [
      { userId: lisa.id, title: 'Residential electrical work', categoryId: categoryMap['Electrical'] },
      { userId: lisa.id, title: 'Panel upgrades', categoryId: categoryMap['Electrical'] },
      { userId: lisa.id, title: 'Outlet and switch installs', categoryId: categoryMap['Electrical'] },
    ],
  })
  await prisma.need.createMany({
    data: [
      { userId: lisa.id, title: 'Childcare / babysitting', categoryId: categoryMap['Childcare'] },
      { userId: lisa.id, title: 'Tractor work / land clearing', categoryId: categoryMap['Tractor Work'] },
      { userId: lisa.id, title: 'AI consulting', categoryId: categoryMap['AI Consulting'] },
      { userId: lisa.id, title: 'Fresh eggs or produce', categoryId: categoryMap['Eggs & Produce'] },
    ],
  })
  console.log('✅ Lisa seeded')

  console.log('\n🌳 This Is Our Town — database seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
