const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');


// ==========================================
// DATABASE PATHS
// ==========================================

const databaseDir = path.join(
    __dirname,
    '..',
    'database'
);

const databasePath = path.join(
    databaseDir,
    'finance.db'
);

const schemaPath = path.join(
    databaseDir,
    'schema.sql'
);


// ==========================================
// MAKE SURE DATABASE DIRECTORY EXISTS
// ==========================================

if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, {
        recursive: true
    });
}


// ==========================================
// CREATE / OPEN DATABASE
// ==========================================

const db = new Database(
    databasePath
);


// ==========================================
// DATABASE SETTINGS
// ==========================================

// Enable foreign key enforcement.
db.pragma('foreign_keys = ON');

// WAL improves SQLite read/write behaviour.
db.pragma('journal_mode = WAL');


// ==========================================
// INITIALIZE DATABASE SCHEMA
// ==========================================

// Read the schema file.
const schema = fs.readFileSync(
    schemaPath,
    'utf8'
);

// Create tables and indexes if they
// do not already exist.
db.exec(schema);


// ==========================================
// CREATE INITIAL MONTH IF DATABASE IS EMPTY
// ==========================================
//
// A fresh Render deployment will have an
// empty SQLite database.
//
// We create the first month automatically.
//
// These values can be configured through
// environment variables:
//
// INITIAL_MONTH=2027-01
// INITIAL_OPENING_BALANCE_PAISE=2100000
//
// 2100000 paise = ₹21,000
//
// Existing databases are NOT changed because
// this only runs when there are zero months.
// ==========================================

const monthCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM months
`).get();

if (Number(monthCount.count) === 0) {

    const initialMonth =
        process.env.INITIAL_MONTH ||
        getCurrentMonth();

    const initialOpeningBalance =
        process.env.INITIAL_OPENING_BALANCE_PAISE !== undefined
            ? Number(
                process.env.INITIAL_OPENING_BALANCE_PAISE
            )
            : 0;


    // ------------------------------------------
    // Validate initial month
    // ------------------------------------------

    if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(
            initialMonth
        )
    ) {
        throw new Error(
            'INITIAL_MONTH must be in YYYY-MM format.'
        );
    }


    // ------------------------------------------
    // Validate opening balance
    // ------------------------------------------

    if (
        !Number.isSafeInteger(
            initialOpeningBalance
        ) ||
        initialOpeningBalance < 0
    ) {
        throw new Error(
            'INITIAL_OPENING_BALANCE_PAISE must be a non-negative integer.'
        );
    }


    // ------------------------------------------
    // Create first month
    // ------------------------------------------

    db.prepare(`
        INSERT INTO months (
            month,
            opening_balance,
            status
        )
        VALUES (?, ?, 'active')
    `).run(
        initialMonth,
        initialOpeningBalance
    );


    console.log(
        `Initial month created: ${initialMonth}`
    );

    console.log(
        `Initial opening balance: ${initialOpeningBalance} paise`
    );
}


// ==========================================
// HELPER
// ==========================================

function getCurrentMonth() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, '0');

    return `${year}-${month}`;
}


// ==========================================
// EXPORT DATABASE
// ==========================================

module.exports = db;