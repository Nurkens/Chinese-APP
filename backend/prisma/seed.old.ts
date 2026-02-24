import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create guest user if not exists
  const guestUser = await prisma.user.upsert({
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

  // Clear existing words (optional - comment out if you want to keep existing data)
  // await prisma.word.deleteMany({});
  // console.log('✅ Cleared existing words');

  // HSK 1 Words - Basic vocabulary
  const hsk1Words = [
    // Numbers
    { chinese: '一', pinyin: 'yī', translation: 'one', hskLevel: 1, category: 'numbers', example: '我有一个朋友。' },
    { chinese: '二', pinyin: 'èr', translation: 'two', hskLevel: 1, category: 'numbers', example: '我有二十块钱。' },
    { chinese: '三', pinyin: 'sān', translation: 'three', hskLevel: 1, category: 'numbers', example: '三个人去吃饭。' },
    { chinese: '四', pinyin: 'sì', translation: 'four', hskLevel: 1, category: 'numbers', example: '今天是四月。' },
    { chinese: '五', pinyin: 'wǔ', translation: 'five', hskLevel: 1, category: 'numbers', example: '五点钟见。' },
    { chinese: '六', pinyin: 'liù', translation: 'six', hskLevel: 1, category: 'numbers', example: '六月很热。' },
    { chinese: '七', pinyin: 'qī', translation: 'seven', hskLevel: 1, category: 'numbers', example: '七点起床。' },
    { chinese: '八', pinyin: 'bā', translation: 'eight', hskLevel: 1, category: 'numbers', example: '八个苹果。' },
    { chinese: '九', pinyin: 'jiǔ', translation: 'nine', hskLevel: 1, category: 'numbers', example: '九月开学。' },
    { chinese: '十', pinyin: 'shí', translation: 'ten', hskLevel: 1, category: 'numbers', example: '十分钟后见。' },

    // Common verbs
    { chinese: '是', pinyin: 'shì', translation: 'to be', hskLevel: 1, category: 'verbs', example: '我是学生。' },
    { chinese: '有', pinyin: 'yǒu', translation: 'to have', hskLevel: 1, category: 'verbs', example: '我有一本书。' },
    { chinese: '在', pinyin: 'zài', translation: 'to be at/in', hskLevel: 1, category: 'verbs', example: '他在家。' },
    { chinese: '看', pinyin: 'kàn', translation: 'to see/look', hskLevel: 1, category: 'verbs', example: '我看电视。' },
    { chinese: '听', pinyin: 'tīng', translation: 'to listen', hskLevel: 1, category: 'verbs', example: '听音乐。' },
    { chinese: '说', pinyin: 'shuō', translation: 'to speak', hskLevel: 1, category: 'verbs', example: '说中文。' },
    { chinese: '读', pinyin: 'dú', translation: 'to read', hskLevel: 1, category: 'verbs', example: '读书。' },
    { chinese: '写', pinyin: 'xiě', translation: 'to write', hskLevel: 1, category: 'verbs', example: '写汉字。' },
    { chinese: '吃', pinyin: 'chī', translation: 'to eat', hskLevel: 1, category: 'verbs', example: '吃饭。' },
    { chinese: '喝', pinyin: 'hē', translation: 'to drink', hskLevel: 1, category: 'verbs', example: '喝水。' },
    { chinese: '买', pinyin: 'mǎi', translation: 'to buy', hskLevel: 1, category: 'verbs', example: '买东西。' },
    { chinese: '来', pinyin: 'lái', translation: 'to come', hskLevel: 1, category: 'verbs', example: '他来了。' },
    { chinese: '去', pinyin: 'qù', translation: 'to go', hskLevel: 1, category: 'verbs', example: '去学校。' },
    { chinese: '做', pinyin: 'zuò', translation: 'to do/make', hskLevel: 1, category: 'verbs', example: '做作业。' },
    { chinese: '坐', pinyin: 'zuò', translation: 'to sit', hskLevel: 1, category: 'verbs', example: '坐下。' },

    // Pronouns
    { chinese: '我', pinyin: 'wǒ', translation: 'I/me', hskLevel: 1, category: 'pronouns', example: '我是学生。' },
    { chinese: '你', pinyin: 'nǐ', translation: 'you', hskLevel: 1, category: 'pronouns', example: '你好。' },
    { chinese: '他', pinyin: 'tā', translation: 'he/him', hskLevel: 1, category: 'pronouns', example: '他很高。' },
    { chinese: '她', pinyin: 'tā', translation: 'she/her', hskLevel: 1, category: 'pronouns', example: '她很漂亮。' },
    { chinese: '我们', pinyin: 'wǒmen', translation: 'we/us', hskLevel: 1, category: 'pronouns', example: '我们是朋友。' },

    // Common nouns
    { chinese: '人', pinyin: 'rén', translation: 'person', hskLevel: 1, category: 'nouns', example: '他是好人。' },
    { chinese: '朋友', pinyin: 'péngyou', translation: 'friend', hskLevel: 1, category: 'nouns', example: '我的朋友。' },
    { chinese: '学生', pinyin: 'xuésheng', translation: 'student', hskLevel: 1, category: 'nouns', example: '他是学生。' },
    { chinese: '老师', pinyin: 'lǎoshī', translation: 'teacher', hskLevel: 1, category: 'nouns', example: '中文老师。' },
    { chinese: '水', pinyin: 'shuǐ', translation: 'water', hskLevel: 1, category: 'nouns', example: '喝水。' },
    { chinese: '茶', pinyin: 'chá', translation: 'tea', hskLevel: 1, category: 'nouns', example: '喝茶。' },
    { chinese: '书', pinyin: 'shū', translation: 'book', hskLevel: 1, category: 'nouns', example: '一本书。' },
    { chinese: '家', pinyin: 'jiā', translation: 'home/family', hskLevel: 1, category: 'nouns', example: '回家。' },
    { chinese: '学校', pinyin: 'xuéxiào', translation: 'school', hskLevel: 1, category: 'nouns', example: '去学校。' },
    { chinese: '中国', pinyin: 'Zhōngguó', translation: 'China', hskLevel: 1, category: 'nouns', example: '去中国。' },

    // Adjectives
    { chinese: '好', pinyin: 'hǎo', translation: 'good', hskLevel: 1, category: 'adjectives', example: '很好。' },
    { chinese: '大', pinyin: 'dà', translation: 'big', hskLevel: 1, category: 'adjectives', example: '很大。' },
    { chinese: '小', pinyin: 'xiǎo', translation: 'small', hskLevel: 1, category: 'adjectives', example: '很小。' },
    { chinese: '多', pinyin: 'duō', translation: 'many/much', hskLevel: 1, category: 'adjectives', example: '很多人。' },
    { chinese: '少', pinyin: 'shǎo', translation: 'few/little', hskLevel: 1, category: 'adjectives', example: '很少。' },
    { chinese: '高', pinyin: 'gāo', translation: 'tall/high', hskLevel: 1, category: 'adjectives', example: '很高。' },

    // Common phrases
    { chinese: '你好', pinyin: 'nǐ hǎo', translation: 'hello', hskLevel: 1, category: 'phrases', example: '你好！' },
    { chinese: '谢谢', pinyin: 'xièxie', translation: 'thank you', hskLevel: 1, category: 'phrases', example: '谢谢你！' },
    { chinese: '再见', pinyin: 'zàijiàn', translation: 'goodbye', hskLevel: 1, category: 'phrases', example: '再见！' },
    { chinese: '对不起', pinyin: 'duìbuqǐ', translation: 'sorry', hskLevel: 1, category: 'phrases', example: '对不起。' },
  ];

  console.log(`📝 Inserting ${hsk1Words.length} HSK 1 words...`);

  for (const word of hsk1Words) {
    await prisma.word.upsert({
      where: { chinese: word.chinese },
      update: word,
      create: word,
    });
  }

  console.log('✅ HSK 1 words inserted successfully!');

  const totalWords = await prisma.word.count();
  console.log(`\n📊 Total words in database: ${totalWords}`);
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
