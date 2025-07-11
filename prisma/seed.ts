import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      subscriptionTier: 'FREE',
      usage: {
        create: {
          documentsProcessed: 0,
          flashcardsGenerated: 0,
          quizzesGenerated: 0,
          quizzesCompleted: 0,
          aiTokensUsed: 0,
          documentsLimit: 5,
          flashcardsLimit: 100,
          quizzesLimit: 10,
          aiTokensLimit: 50000,
        }
      }
    },
    include: {
      usage: true
    }
  })

  console.log('Created test user:', user)

  // Create a sample document
  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title: 'Introduction to Biology',
      content: `Biology is the scientific study of life. It is a natural science with a broad scope but has several unifying themes that tie it together as a single, coherent field.

Key concepts in biology include:

1. Cell Theory: All living things are made of cells, which are the basic unit of life.

2. Evolution: All species descended from a common ancestor and have evolved over time through natural selection.

3. Genetics: The study of heredity and how traits are passed from parents to offspring through DNA.

4. Homeostasis: Living organisms maintain a stable internal environment despite external changes.

5. Energy: All living organisms require energy to carry out life processes.

Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This process is crucial for life on Earth as it produces oxygen and forms the base of most food chains.

Mitochondria are often called the "powerhouses of the cell" because they generate most of the cell's supply of ATP (energy) through cellular respiration.

The three main states of matter are solid, liquid, and gas. These are the most common states at normal temperatures and pressures.`,
      originalName: 'biology_intro.txt',
      fileType: 'text/plain',
      fileSize: 1200,
      status: 'COMPLETED',
      wordCount: 180,
      pageCount: 1,
      language: 'en',
      metadata: JSON.stringify({
        processed: true,
        extractionMethod: 'text'
      })
    }
  })

  console.log('Created sample document:', document)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })