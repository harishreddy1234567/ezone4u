import mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL in .env");
    process.exit(1);
  }

  // Parse the connection string
  const parsed = new URL(url);
  const host = parsed.hostname || '127.0.0.1';
  const port = parseInt(parsed.port || '3306', 10);
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let conn;
  try {
    conn = await mariadb.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000,
    });
    console.log("Connected successfully to MySQL!");

    console.log("Creating database 'ezone4u_store' if it does not exist...");
    await conn.query("CREATE DATABASE IF NOT EXISTS `ezone4u_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

    const rows = await conn.query("SHOW DATABASES LIKE 'ezone4u_store';");
    console.log("Databases matching 'ezone4u_store':", rows);

    if (rows.length > 0) {
      console.log("✅ Database 'ezone4u_store' verified to exist in MySQL!");
    } else {
      console.error("❌ Database 'ezone4u_store' was not found in SHOW DATABASES.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error creating/connecting to MySQL database:", err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();

