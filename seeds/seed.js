/**
 * Seed file — populates the database with realistic demo data.
 *
 * Users seeded
 *   admin@finance.dev   / Admin@123      (role: admin)
 *   alice@finance.dev   / Analyst@123    (role: analyst)
 *   bob@finance.dev     / Viewer@123     (role: viewer)
 *   carol@finance.dev   / Analyst@123    (role: analyst)
 *   dave@finance.dev    / Viewer@123     (role: viewer, status: inactive)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/database');

// ── helpers ──────────────────────────────────────────────────
const rand  = (min, max) => Math.random() * (max - min) + min;
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ── seed users ───────────────────────────────────────────────
const RAW_USERS = [
  { name: 'Admin User',   email: 'admin@finance.dev',  password: 'Admin@123',    role: 'admin',   status: 'active'   },
  { name: 'Alice Sharma', email: 'alice@finance.dev',  password: 'Analyst@123',  role: 'analyst', status: 'active'   },
  { name: 'Bob Verma',    email: 'bob@finance.dev',    password: 'Viewer@123',   role: 'viewer',  status: 'active'   },
  { name: 'Carol Singh',  email: 'carol@finance.dev',  password: 'Analyst@123',  role: 'analyst', status: 'active'   },
  { name: 'Dave Kumar',   email: 'dave@finance.dev',   password: 'Viewer@123',   role: 'viewer',  status: 'inactive' },
];

// ── seed transactions ─────────────────────────────────────────
const INCOME_CATS  = ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Consulting', 'Bonus'];
const EXPENSE_CATS = ['Rent', 'Utilities', 'Groceries', 'Travel', 'Software', 'Marketing', 'Salaries', 'Office Supplies', 'Healthcare'];

function generateTransactions(adminId) {
  const txs = [];

  // last 90 days — 80 transactions
  for (let i = 0; i < 80; i++) {
    const isIncome = Math.random() < 0.4;
    txs.push({
      amount:     parseFloat(rand(isIncome ? 5000 : 200, isIncome ? 150000 : 45000).toFixed(2)),
      type:       isIncome ? 'income' : 'expense',
      category:   isIncome ? pick(INCOME_CATS) : pick(EXPENSE_CATS),
      date:       daysAgo(Math.floor(rand(0, 90))),
      notes:      pick(['Q2 settlement', 'Monthly recurring', 'One-time payment', 'Auto-debit', null, null]),
      created_by: adminId,
    });
  }

  // fixed anchors for predictable dashboard numbers
  const anchors = [
    { amount: 250000, type: 'income',  category: 'Salary',      date: daysAgo(5),  notes: 'Monthly salary credit', created_by: adminId },
    { amount: 85000,  type: 'expense', category: 'Rent',         date: daysAgo(4),  notes: 'Office rent — May',     created_by: adminId },
    { amount: 50000,  type: 'income',  category: 'Freelance',    date: daysAgo(10), notes: 'Client A milestone',    created_by: adminId },
    { amount: 12000,  type: 'expense', category: 'Software',     date: daysAgo(2),  notes: 'SaaS subscriptions',    created_by: adminId },
    { amount: 30000,  type: 'income',  category: 'Consulting',   date: daysAgo(15), notes: 'Advisory retainer',     created_by: adminId },
    { amount: 8500,   type: 'expense', category: 'Utilities',    date: daysAgo(7),  notes: 'Electricity + internet', created_by: adminId },
  ];

  return [...txs, ...anchors];
}

// ── main ──────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log('▶  Seeding database...\n');
    await client.query('BEGIN');

    // ── clear existing data (order matters for FK) ──
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM users');
    console.log('   Cleared existing data.');

    // ── insert users ──
    const insertedUsers = [];
    for (const u of RAW_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, status`,
        [u.name, u.email, hash, u.role, u.status]
      );
      insertedUsers.push({ ...rows[0], rawPassword: u.password });
      console.log(`   ✔ User: ${u.email} (${u.role})`);
    }

    // ── insert transactions using admin id ──
    const adminUser = insertedUsers.find(u => u.role === 'admin');
    const txs = generateTransactions(adminUser.id);
    for (const tx of txs) {
      await client.query(
        `INSERT INTO transactions (amount, type, category, date, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx.amount, tx.type, tx.category, tx.date, tx.notes, tx.created_by]
      );
    }
    console.log(`\n   ✔ ${txs.length} transactions inserted.`);

    await client.query('COMMIT');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SEED CREDENTIALS (for testing)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const u of insertedUsers) {
      console.log(`  [${u.role.padEnd(8)}] ${u.email.padEnd(28)} | ${u.rawPassword}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✔  Seeding complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✖  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();