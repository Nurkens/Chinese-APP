// Quick test script to check PostgreSQL connection
const { execSync } = require('child_process');

console.log('Testing PostgreSQL connection...');
console.log('Port: 5433');
console.log('Database: chinese_app');
console.log('User: postgres');
console.log('Password: user');
console.log('');

try {
  // Try to connect and check if database exists
  const result = execSync(
    'psql -U postgres -p 5433 -h localhost -c "SELECT 1;" chinese_app',
    {
      encoding: 'utf-8',
      env: { ...process.env, PGPASSWORD: 'user' }
    }
  );
  console.log('✓ SUCCESS: Connected to database "chinese_app"');
  console.log(result);
} catch (error) {
  console.log('✗ Database "chinese_app" does not exist or cannot connect');
  console.log('Creating database...');

  try {
    // Try to create database
    execSync(
      'psql -U postgres -p 5433 -h localhost -c "CREATE DATABASE chinese_app;"',
      {
        encoding: 'utf-8',
        env: { ...process.env, PGPASSWORD: 'user' }
      }
    );
    console.log('✓ Database "chinese_app" created successfully!');
  } catch (createError) {
    console.error('✗ Failed to create database:');
    console.error(createError.message);
    console.log('\nPlease create the database manually:');
    console.log('psql -U postgres -p 5433');
    console.log('CREATE DATABASE chinese_app;');
  }
}
