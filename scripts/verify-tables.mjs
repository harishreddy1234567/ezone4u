import mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  const parsed = new URL(url);
  const host = parsed.hostname || '127.0.0.1';
  const port = parseInt(parsed.port || '3306', 10);
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.replace(/^\//, '');

  console.log(`Connecting to database ${database} at ${host}:${port}...`);
  const conn = await mariadb.createConnection({ host, port, user, password, database });

  try {
    const tables = await conn.query("SHOW TABLES;");
    console.log("Tables in " + database + ":", tables.map(r => Object.values(r)[0]));

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const cols = await conn.query(`DESCRIBE \`${tableName}\`;`);
      console.log(`\nColumns for table ${tableName}:`);
      console.log(cols.map(c => `${c.Field} (${c.Type}, Null: ${c.Null}, Key: ${c.Key})`).join('\n'));
    }
  } finally {
    await conn.end();
  }
}

main();

