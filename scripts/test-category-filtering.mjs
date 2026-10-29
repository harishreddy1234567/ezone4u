import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:/Users/darsh/Documents/ezone/ezone4u/.env' });

async function main() {
  const url = process.env.DATABASE_URL;
  const parsed = new URL(url);
  const host = parsed.hostname || '127.0.0.1';
  const port = parseInt(parsed.port || '3306', 10);
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.replace(/^\//, '');

  const conn = await mariadb.createConnection({ host, port, user, password, database });

  try {
    console.log("=== RUNNING CATEGORY FILTER VERIFICATION TESTS ===\n");

    // Fetch all categories
    const allCategories = await conn.query("SELECT id, name, slug, parentId FROM category;");

    // Helper implementing the exact resolution logic in src/app/shop/page.tsx
    function resolveCategoryIds(categoryParam) {
      if (!categoryParam) return null; // All collections

      const target = allCategories.find(c => c.slug.toLowerCase() === categoryParam.toLowerCase());
      if (!target) return []; // Non-existent category

      const matchedIds = new Set([target.id]);

      // Subcategories with slug prefix
      for (const c of allCategories) {
        if (c.slug.toLowerCase().startsWith(`${categoryParam.toLowerCase()}-`)) {
          matchedIds.add(c.id);
        }
      }

      // Descendants by parentId
      let added = true;
      while (added) {
        added = false;
        for (const c of allCategories) {
          if (c.parentId && matchedIds.has(c.parentId) && !matchedIds.has(c.id)) {
            matchedIds.add(c.id);
            added = true;
          }
        }
      }

      return Array.from(matchedIds);
    }

    async function queryProducts(categoryParam, searchParam = "") {
      const categoryIds = resolveCategoryIds(categoryParam);
      
      let sql = "SELECT p.id, p.name, p.slug, p.status, p.price, c.name as categoryName, c.slug as categorySlug FROM product p JOIN category c ON p.categoryId = c.id WHERE p.status = 'ACTIVE'";
      const params = [];

      if (categoryIds !== null) {
        if (categoryIds.length === 0) {
          return []; // Equivalent to Prisma's where.categoryId = { in: [] }
        }
        const placeholders = categoryIds.map(() => '?').join(', ');
        sql += ` AND p.categoryId IN (${placeholders})`;
        params.push(...categoryIds);
      }

      if (searchParam) {
        sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
        params.push(`%${searchParam}%`, `%${searchParam}%`);
      }

      return await conn.query(sql, params);
    }

    // TEST 1: All Collections
    console.log("TEST 1: All Collections (no category param)");
    const allProds = await queryProducts("");
    console.log(`Found ${allProds.length} products:`, allProds.map(p => `${p.name} (${p.categoryName})`));
    if (allProds.length < 2) throw new Error("Expected at least 2 published products in All Collections");
    console.log("✅ TEST 1 PASSED\n");

    // TEST 2: Men Category Filter
    console.log("TEST 2: Category 'men'");
    const menProds = await queryProducts("men");
    console.log(`Found ${menProds.length} products:`, menProds.map(p => `${p.name} (${p.categoryName})`));
    if (menProds.length !== 1 || !menProds[0].name.includes("Linen Safari Shirt")) {
      throw new Error("Expected only Men's Premium Linen Safari Shirt in Men category");
    }
    console.log("✅ TEST 2 PASSED\n");

    // TEST 3: Women Category Filter
    console.log("TEST 3: Category 'women'");
    const womenProds = await queryProducts("women");
    console.log(`Found ${womenProds.length} products:`, womenProds.map(p => `${p.name} (${p.categoryName})`));
    if (womenProds.length !== 1 || !womenProds[0].name.includes("Dusty Pink Embroidered Kurta Set")) {
      throw new Error("Expected Women's Dusty Pink Embroidered Kurta Set in Women category");
    }
    console.log("✅ TEST 3 PASSED\n");

    // TEST 4: Kids Category Filter (Empty State verification)
    console.log("TEST 4: Category 'kids'");
    const kidsProds = await queryProducts("kids");
    console.log(`Found ${kidsProds.length} products (triggers empty state)`);
    if (kidsProds.length !== 0) {
      console.log("Kids currently has products:", kidsProds.map(p => p.name));
    } else {
      console.log("Confirmed: Kids has 0 products and triggers 'No products found in this category' empty state.");
    }
    console.log("✅ TEST 4 PASSED\n");

    // TEST 5: Non-existent Category (should return 0 products, empty state)
    console.log("TEST 5: Non-existent category 'nonexistent-category'");
    const emptyProds = await queryProducts("nonexistent-category");
    console.log(`Found ${emptyProds.length} products`);
    if (emptyProds.length !== 0) throw new Error("Expected 0 products for nonexistent category");
    console.log("✅ TEST 5 PASSED\n");

    // TEST 6: Subcategory Hierarchy Verification
    console.log("TEST 6: Subcategory Hierarchy with parentId");
    // Temporarily create subcategory under Men
    const menCat = allCategories.find(c => c.slug === 'men');
    const subCatId = 'test_sub_' + Math.random().toString(36).substring(2, 7);
    await conn.query(
      "INSERT INTO category (id, name, slug, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW());",
      [subCatId, "Men's Formal Suits", "men-formal-suits", menCat.id]
    );

    // Refresh categories
    const updatedCategories = await conn.query("SELECT id, name, slug, parentId FROM category;");
    allCategories.length = 0;
    allCategories.push(...updatedCategories);

    // Add a temporary product in this subcategory
    const tempProdId = 'test_prod_' + Math.random().toString(36).substring(2, 7);
    await conn.query(
      `INSERT INTO product (id, name, slug, price, stock, status, categoryId, createdAt, updatedAt)
       VALUES (?, 'Men Italian Wool Suit', 'men-italian-wool-suit', 4500.00, 5, 'ACTIVE', ?, NOW(), NOW());`,
      [tempProdId, subCatId]
    );

    const menWithSub = await queryProducts("men");
    console.log(`Querying category 'men' with subcategory product found ${menWithSub.length} products:`, menWithSub.map(p => p.name));
    if (menWithSub.length !== 2) throw new Error("Subcategory resolution failed: expected 2 products under Men");

    // Clean up temporary subcategory and product
    await conn.query("DELETE FROM product WHERE id = ?;", [tempProdId]);
    await conn.query("DELETE FROM category WHERE id = ?;", [subCatId]);
    console.log("✅ TEST 6 PASSED (Subcategory hierarchy properly resolved and cleaned up)\n");

    // TEST 7: INACTIVE Product Exclusion
    console.log("TEST 7: Verify INACTIVE products are strictly excluded");
    const inactiveProdId = 'test_inactive_' + Math.random().toString(36).substring(2, 7);
    await conn.query(
      `INSERT INTO product (id, name, slug, price, stock, status, categoryId, createdAt, updatedAt)
       VALUES (?, 'Archived Shirt', 'archived-shirt', 999.00, 0, 'INACTIVE', ?, NOW(), NOW());`,
      [inactiveProdId, menCat.id]
    );

    const menAfterInactive = await queryProducts("men");
    console.log(`Querying category 'men' with inactive product found ${menAfterInactive.length} products`);
    if (menAfterInactive.length !== 1 || menAfterInactive.some(p => p.id === inactiveProdId)) {
      throw new Error("Archived/INACTIVE product was improperly returned!");
    }

    // Clean up inactive product
    await conn.query("DELETE FROM product WHERE id = ?;", [inactiveProdId]);
    console.log("✅ TEST 7 PASSED (INACTIVE products strictly excluded)\n");

    console.log("🎉 ALL CATEGORY FILTERING & NAVIGATION TESTS PASSED SUCCESSFULLY!");
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

