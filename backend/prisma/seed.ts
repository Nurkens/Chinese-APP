import { PrismaClient } from '@prisma/client';
import { hskDataset } from './hsk-dataset';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with HSK 1-4 dataset...');

  // Create guest user if not exists
  await prisma.user.upsert({
    where: { username: 'guest' },
    update: {},
    create: {
      id: 'guest',
      username: 'guest',
      tag: 'guest#0000',
      isGuest: true,
      progress: {
        create: {
          currentStreak: 0,
          longestStreak: 0,
          hskLevel: 1,
          totalWords: 0,
          targetWords: 1200,
        },
      },
    },
  });
  console.log('✅ Guest user created/verified');

  // Insert HSK words from dataset
  console.log(`📝 Inserting ${hskDataset.length} HSK words...`);

  let inserted = 0;
  let updated = 0;

  for (const word of hskDataset) {
    const result = await prisma.word.upsert({
      where: { chinese: word.chinese },
      update: word,
      create: word,
    });

    if (result.createdAt === result.updatedAt) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`✅ Inserted ${inserted} new words`);
  console.log(`✅ Updated ${updated} existing words`);

  const totalWords = await prisma.word.count();
  console.log(`\n📊 Total words in database: ${totalWords}`);

  const hsk1Count = await prisma.word.count({ where: { hskLevel: 1 } });
  const hsk2Count = await prisma.word.count({ where: { hskLevel: 2 } });
  const hsk3Count = await prisma.word.count({ where: { hskLevel: 3 } });
  const hsk4Count = await prisma.word.count({ where: { hskLevel: 4 } });

  console.log(`   HSK 1: ${hsk1Count} words`);
  console.log(`   HSK 2: ${hsk2Count} words`);
  console.log(`   HSK 3: ${hsk3Count} words`);
  console.log(`   HSK 4: ${hsk4Count} words`);

  console.log('\n🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
