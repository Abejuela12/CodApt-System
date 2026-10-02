'use strict';

const db = require('../db');

const USERNAMES = [
  'demoAccount',
  'cyrusaerol3',
  'ayherasophia',
  'cleirs0708',
  'arvymagimot',
  'enzobustria',
  'ggsgagG',
  'reneBaterbonia',
  'cabzerick31',
  'jericdaledolina',
];

async function inspect() {
  const { rows: userColumns } = await db.query(
    `SELECT column_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
     ORDER BY ordinal_position`
  );
  console.log('Users table columns:');
  console.table(userColumns);

  const { rows: userConstraints } = await db.query(
    `SELECT conname, pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE conrelid = 'public.users'::regclass
     ORDER BY conname`
  );
  console.log('Users table constraints:');
  console.table(userConstraints);

  for (const table of ['user_profiles', 'daily_progress']) {
    const { rows: columns } = await db.query(
      `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );
    console.log(`${table} columns:`);
    console.table(columns);

    const { rows: constraints } = await db.query(
      `SELECT conname, pg_get_constraintdef(oid) AS definition
       FROM pg_constraint
       WHERE conrelid = $1::regclass
       ORDER BY conname`,
      [`public.${table}`]
    );
    console.log(`${table} constraints:`);
    console.table(constraints);
  }

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.username, u.role,
            (SELECT COUNT(*)::int FROM user_profiles up WHERE up.user_id = u.id) AS profile_count,
            (SELECT COUNT(*)::int FROM submissions s WHERE s.user_id = u.id) AS submission_count,
            (SELECT COUNT(*)::int FROM daily_progress dp WHERE dp.user_id = u.id) AS daily_count
     FROM users u
     WHERE u.username = ANY($1::text[])
     ORDER BY u.created_at, u.id`,
    [USERNAMES]
  );
  console.table(rows);

  const { rows: profiles } = await db.query(
    `SELECT u.username, up.language, up.concept, up.success_rate,
            up.avg_attempts, up.avg_time_spent, up.syntax_errors,
            up.structural_errors, up.performance_level
     FROM user_profiles up
     JOIN users u ON u.id = up.user_id
     WHERE u.username = ANY($1::text[])
     ORDER BY u.created_at, u.id, up.language, up.concept`,
    [USERNAMES]
  );
  console.table(profiles);
}

inspect()
  .catch(error => {
    console.error(`Account inspection failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());