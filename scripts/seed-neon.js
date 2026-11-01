const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Single catalog source: prisma/courses.seed.json.
// The app reads courses ONLY from the DB — this script is how content gets there.
function loadCatalog() {
  const file = path.join(__dirname, '..', 'prisma', 'courses.seed.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function seed() {
  const courses = loadCatalog();
  console.log(`🌱 Seeding ${courses.length} courses into the database...\n`);

  for (const c of courses) {
    const data = {
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      longDesc: c.longDesc,
      priceUsdt: c.priceUsdt,
      image: c.image,
      category: c.category,
      tags: c.tags,
      instructor: c.instructor,
      instructorTitle: c.instructorTitle,
      duration: c.duration,
      lessons: c.lessons,
      level: c.level,
      featured: c.featured,
      rating: c.rating,
      reviewCount: c.reviewCount,
      curriculum: c.curriculum,
      includes: c.includes,
    };
    const upserted = await prisma.course.upsert({
      where: { slug: c.slug },
      update: data,
      create: { id: c.id, slug: c.slug, ...data },
    });
    console.log(` ✅ ${upserted.slug} [₮${upserted.priceUsdt}]`);
  }

  const count = await prisma.course.count();
  console.log(`\n🎉 Successfully seeded — ${count} courses now in the database!`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
