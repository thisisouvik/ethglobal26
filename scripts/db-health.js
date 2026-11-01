// DB connectivity + content health check.
// Usage: npm run db:health  (reads DATABASE_URL from .env)
// Exit code 0 = healthy, 1 = unreachable/empty. Used locally and in CI.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  const started = Date.now();
  const [courseCount, publishedCount, orderCount] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.order.count(),
  ]);
  const ms = Date.now() - started;

  console.log('✅ Database reachable');
  console.log(`   Latency: ${ms}ms`);
  console.log(`   Courses: ${courseCount} total, ${publishedCount} published`);
  console.log(`   Orders:  ${orderCount}`);

  if (publishedCount === 0) {
    console.error('❌ No published courses found — run `npm run db:seed`.');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Database unreachable:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
