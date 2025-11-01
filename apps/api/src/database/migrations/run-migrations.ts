import { createDataSource } from '../data-source';

async function runMigrations() {
  const dataSource = createDataSource();
  await dataSource.initialize();
  try {
    const result = await dataSource.runMigrations({
      transaction: 'each'
    });
    result.forEach((migration) => {
      // eslint-disable-next-line no-console
      console.log(`Migration ${migration.name} executed`);
    });
  } finally {
    await dataSource.destroy();
  }
}

runMigrations().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to run migrations', error);
  process.exitCode = 1;
});
