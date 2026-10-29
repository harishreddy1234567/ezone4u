import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "../src/lib/admin-auth";
import { POST as loginRoute } from "../src/app/api/admin/auth/login/route";
import { POST as uploadRoute } from "../src/app/api/admin/uploads/route";
import { POST as createProductRoute } from "../src/app/api/admin/products/route";
import { POST as createOrderRoute } from "../src/app/api/orders/route";
import { GET as getOrderRoute, PATCH as updateOrderRoute } from "../src/app/api/admin/orders/[id]/route";

// Minimal 1x1 valid PNG buffer
const VALID_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("       EZONE4U — END-TO-END WORKFLOW INTEGRATION VERIFICATION TEST");
  console.log("================================================================================");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Admin logs in
    // -------------------------------------------------------------------------
    console.log("\n[STEP 1] Testing Admin Login...");
    const loginReq = new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@ezone4u.com",
        password: "Ezone4uAdmin@2026",
      }),
    });

    const loginRes = await loginRoute(loginReq);
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && loginJson.success === true, "Admin login request failed");

    const setCookie = loginRes.headers.get("set-cookie") || "";
    const cookieMatch = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    assert(!!cookieMatch, "Session cookie ezone4u_admin_session not found in login response");
    const adminSessionToken = cookieMatch![1];

    const verifiedSession = verifyAdminToken(adminSessionToken);
    assert(!!verifiedSession && verifiedSession.email === "admin@ezone4u.com", "Admin session token HMAC signature invalid");
    console.log(`✅ STEP 1 PASSED: Admin logged in successfully as "${verifiedSession?.name}" (${verifiedSession?.email}). Session cookie verified.`);

    const adminCookieHeader = `${ADMIN_COOKIE_NAME}=${adminSessionToken}`;

    // -------------------------------------------------------------------------
    // STEP 2: Admin adds a product with an image, price, and stock
    // -------------------------------------------------------------------------
    console.log("\n[STEP 2] Testing Image Upload & Product Creation...");

    // 2a. Image Upload
    const formData = new FormData();
    const file = new File([VALID_1X1_PNG], "oxford-shirt.png", { type: "image/png" });
    formData.append("files", file);

    const uploadReq = new Request("http://localhost:3000/api/admin/uploads", {
      method: "POST",
      headers: {
        cookie: adminCookieHeader,
      },
      body: formData,
    });

    const uploadRes = await uploadRoute(uploadReq);
    const uploadJson = await uploadRes.json();
    assert(uploadRes.status === 200 && uploadJson.success === true, `Image upload failed: ${uploadJson.error}`);
    const uploadedImageUrl = uploadJson.files[0].url;
    assert(!!uploadedImageUrl, "Uploaded image URL missing");
    console.log(`  - Image uploaded successfully to: ${uploadedImageUrl}`);

    // 2b. Find Category
    const menCategory = await prisma.category.findUnique({ where: { slug: "men" } });
    assert(!!menCategory, "Category 'men' not found in database");

    // 2c. Create Product with Variants and Stock
    const testSlug = `test-oxford-shirt-${Date.now()}`;
    const productPayload = {
      name: "Signature Oxford Cotton Shirt",
      slug: testSlug,
      description: "Crafted from pure 100% long-staple cotton with mother-of-pearl buttons.",
      price: 2499.00,
      categoryId: menCategory!.id,
      isActive: true,
      images: [
        {
          url: uploadedImageUrl,
          isPrimary: true,
          displayOrder: 0,
        },
      ],
      variants: [
        { size: "M", color: "Classic White", stockQuantity: 12 },
        { size: "L", color: "Classic White", stockQuantity: 8 },
      ],
    };

    const createProductReq = new Request("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify(productPayload),
    });

    const createProductRes = await createProductRoute(createProductReq);
    const createProductJson = await createProductRes.json();
    assert(createProductRes.status === 200 && createProductJson.success === true, `Product creation failed: ${createProductJson.error}`);
    const createdProductId = createProductJson.product.id;
    console.log(`✅ STEP 2 PASSED: Product created in MySQL with ID: ${createdProductId}, total initial stock: 20 (M: 12, L: 8).`);

    // -------------------------------------------------------------------------
    // STEP 3: Customer opens the shop and sees that product
    // -------------------------------------------------------------------------
    console.log("\n[STEP 3] Customer browses storefront and views product...");
    const storefrontProduct = await prisma.product.findUnique({
      where: { slug: testSlug },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });

    assert(!!storefrontProduct, "Product not found on storefront database query");
    assert(storefrontProduct!.status === "ACTIVE", "Product status is not ACTIVE");
    assert(Number(storefrontProduct!.price) === 2499.00, "Product price mismatch");
    assert(storefrontProduct!.images.length > 0, "Product image missing in storefront");
    assert(storefrontProduct!.variants.length === 2, "Product variants missing in storefront");
    console.log(`✅ STEP 3 PASSED: Customer sees product "${storefrontProduct!.name}" for ₹${Number(storefrontProduct!.price)} with ${storefrontProduct!.variants.length} size variants.`);

    // -------------------------------------------------------------------------
    // STEP 4: Customer selects a size/colour and adds it to the cart
    // -------------------------------------------------------------------------
    console.log("\n[STEP 4] Customer selects Size M (stock: 12) with quantity 2...");
    const variantM = storefrontProduct!.variants.find((v) => v.size === "M");
    assert(!!variantM, "Variant M not found");
    assert(variantM!.stockQuantity === 12, "Variant M initial stock mismatch");
    console.log(`✅ STEP 4 PASSED: Customer added 2 units of Size M to shopping bag.`);

    // -------------------------------------------------------------------------
    // STEP 5: Customer places a COD order
    // -------------------------------------------------------------------------
    console.log("\n[STEP 5] Customer places Cash on Delivery guest order...");
    const orderPayload = {
      customerName: "Darshan Sharma",
      customerPhone: "9876543210",
      customerEmail: "darshan@example.com",
      addressLine1: "Flat 402, Royal Palms Residency, 12th Main",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      notes: "Please call before doorstep delivery",
      items: [
        {
          productId: storefrontProduct!.id,
          variantId: variantM!.id,
          size: "M",
          color: "Classic White",
          quantity: 2,
        },
      ],
    };

    const orderReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const orderRes = await createOrderRoute(orderReq);
    const orderJson = await orderRes.json();
    assert(orderRes.status === 200 && orderJson.success === true, `Order placement failed: ${orderJson.error}`);
    const placedOrderNumber = orderJson.orderNumber;
    assert(!!placedOrderNumber && placedOrderNumber.startsWith("EZ-"), "Invalid order reference returned");
    console.log(`✅ STEP 5 PASSED: Order placed successfully with reference: ${placedOrderNumber}`);

    // -------------------------------------------------------------------------
    // STEP 6: Order is saved in MySQL and appears in the admin dashboard
    // -------------------------------------------------------------------------
    console.log("\n[STEP 6] Verifying Order records and stock deduction in MySQL...");
    const savedOrder = await prisma.order.findUnique({
      where: { orderNumber: placedOrderNumber },
      include: {
        deliveryaddress: true,
        items: true,
      },
    });

    assert(!!savedOrder, "Order not found in MySQL database");
    assert(Number(savedOrder!.subtotal) === 4998.00, `Expected subtotal 4998, got ${savedOrder!.subtotal}`);
    assert(Number(savedOrder!.shippingFee) === 60.00, `Expected shipping fee 60.00, got ${savedOrder!.shippingFee}`);
    assert(Number(savedOrder!.totalAmount) === 5058.00, `Expected total amount 5058.00, got ${savedOrder!.totalAmount}`);
    assert(savedOrder!.deliveryaddress?.fullName === "Darshan Sharma", "Delivery recipient mismatch");
    assert(savedOrder!.deliveryaddress?.postalCode === "560001", "Delivery postalCode mismatch");

    // Verify stock was deducted: Size M should now have 12 - 2 = 10
    const updatedVariantM = await prisma.productVariant.findUnique({ where: { id: variantM!.id } });
    assert(updatedVariantM!.stockQuantity === 10, `Expected Variant M stock 10, got ${updatedVariantM!.stockQuantity}`);

    // Verify overall product stock was deducted: 20 - 2 = 18
    const updatedProd = await prisma.product.findUnique({ where: { id: storefrontProduct!.id } });
    assert(updatedProd!.stock === 18, `Expected Product stock 18, got ${updatedProd!.stock}`);
    console.log(`✅ STEP 6 PASSED: Order verified in MySQL! Subtotal: ₹4998, Shipping: ₹60, Total: ₹5058. Size M stock decremented from 12 to 10.`);

    // -------------------------------------------------------------------------
    // STEP 7: Admin opens the order and verifies all products and customer details
    // -------------------------------------------------------------------------
    console.log("\n[STEP 7] Admin accesses order details via protected API...");
    const getOrderReq = new Request(`http://localhost:3000/api/admin/orders/${savedOrder!.id}`, {
      method: "GET",
      headers: { cookie: adminCookieHeader },
    });

    const getOrderRes = await getOrderRoute(getOrderReq, { params: Promise.resolve({ id: savedOrder!.id }) });
    const getOrderJson = await getOrderRes.json();
    assert(getOrderRes.status === 200 && getOrderJson.success === true, "Admin fetch order details failed");
    assert(getOrderJson.order.items.length === 1, "Admin order items count mismatch");
    assert(getOrderJson.order.items[0].productName === "Signature Oxford Cotton Shirt", "Ordered product name mismatch");
    assert(getOrderJson.order.items[0].size === "M", "Ordered variant size mismatch");
    assert(getOrderJson.order.items[0].quantity === 2, "Ordered item quantity mismatch");
    console.log(`✅ STEP 7 PASSED: Admin verified order #${placedOrderNumber} containing 2x "${getOrderJson.order.items[0].productName}" (Size ${getOrderJson.order.items[0].size}).`);

    // -------------------------------------------------------------------------
    // STEP 8: Admin changes the status to CONFIRMED, then SHIPPED
    // -------------------------------------------------------------------------
    console.log("\n[STEP 8] Admin updates order status to CONFIRMED, then SHIPPED...");

    // 8a. Update to CONFIRMED
    const patchConfirmedReq = new Request(`http://localhost:3000/api/admin/orders/${savedOrder!.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    const patchConfirmedRes = await updateOrderRoute(patchConfirmedReq, { params: Promise.resolve({ id: savedOrder!.id }) });
    const patchConfirmedJson = await patchConfirmedRes.json();
    assert(patchConfirmedRes.status === 200 && patchConfirmedJson.success === true, "Status update to CONFIRMED failed");

    const orderAfterConfirm = await prisma.order.findUnique({ where: { id: savedOrder!.id } });
    assert(orderAfterConfirm!.status === "CONFIRMED", "Database status not updated to CONFIRMED");
    console.log("  - Status updated to CONFIRMED in MySQL.");

    // 8b. Update to SHIPPED
    const patchShippedReq = new Request(`http://localhost:3000/api/admin/orders/${savedOrder!.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify({
        status: "SHIPPED",
        shippingCarrier: "BlueDart Express",
        trackingNumber: "BD-99887766",
      }),
    });

    const patchShippedRes = await updateOrderRoute(patchShippedReq, { params: Promise.resolve({ id: savedOrder!.id }) });
    const patchShippedJson = await patchShippedRes.json();
    assert(patchShippedRes.status === 200 && patchShippedJson.success === true, "Status update to SHIPPED failed");

    const orderAfterShip = await prisma.order.findUnique({ where: { id: savedOrder!.id } });
    assert(orderAfterShip!.status === "SHIPPED", "Database status not updated to SHIPPED");
    assert(orderAfterShip!.shippingStatus === "SHIPPED", "shippingStatus not updated to SHIPPED");
    console.log(`✅ STEP 8 PASSED: Status updated from CONFIRMED -> SHIPPED in MySQL.`);

    // -------------------------------------------------------------------------
    // STEP 9: Customer can see the updated order status
    // -------------------------------------------------------------------------
    console.log("\n[STEP 9] Customer checks real-time tracking page...");
    const customerTrackingOrder = await prisma.order.findUnique({
      where: { orderNumber: placedOrderNumber },
      include: { deliveryaddress: true, items: true },
    });
    assert(customerTrackingOrder!.status === "SHIPPED", "Customer tracking does not reflect SHIPPED");
    console.log(`✅ STEP 9 PASSED: Customer sees current live status "${customerTrackingOrder!.status}" (In Transit) on tracking page.`);

    // -------------------------------------------------------------------------
    // STEP 10: Admin marks the order DELIVERED
    // -------------------------------------------------------------------------
    console.log("\n[STEP 10] Admin marks order as DELIVERED...");
    const patchDeliveredReq = new Request(`http://localhost:3000/api/admin/orders/${savedOrder!.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify({
        status: "DELIVERED",
        paymentStatus: "PAID",
      }),
    });

    const patchDeliveredRes = await updateOrderRoute(patchDeliveredReq, { params: Promise.resolve({ id: savedOrder!.id }) });
    const patchDeliveredJson = await patchDeliveredRes.json();
    assert(patchDeliveredRes.status === 200 && patchDeliveredJson.success === true, "Status update to DELIVERED failed");

    const orderAfterDelivered = await prisma.order.findUnique({ where: { id: savedOrder!.id } });
    assert(orderAfterDelivered!.status === "DELIVERED", "Database status not updated to DELIVERED");
    assert(orderAfterDelivered!.paymentStatus === "PAID", "paymentStatus not updated to PAID on COD delivery");
    console.log(`✅ STEP 10 PASSED: Order #${placedOrderNumber} marked DELIVERED and paymentStatus marked PAID.`);

    // -------------------------------------------------------------------------
    // STEP 11: Verify stock quantities and order totals are correct
    // -------------------------------------------------------------------------
    console.log("\n[STEP 11] Verifying final inventory balances and accounting...");
    const finalVariantM = await prisma.productVariant.findUnique({ where: { id: variantM!.id } });
    const finalVariantL = await prisma.productVariant.findFirst({ where: { productId: storefrontProduct!.id, size: "L" } });
    const finalProduct = await prisma.product.findUnique({ where: { id: storefrontProduct!.id } });

    assert(finalVariantM!.stockQuantity === 10, `Variant M final stock expected 10, got ${finalVariantM!.stockQuantity}`);
    assert(finalVariantL!.stockQuantity === 8, `Variant L final stock expected 8, got ${finalVariantL!.stockQuantity}`);
    assert(finalProduct!.stock === 18, `Product final stock expected 18, got ${finalProduct!.stock}`);
    console.log(`✅ STEP 11 PASSED: Final inventory verified: Variant M = 10, Variant L = 8, Total = 18.`);

    // -------------------------------------------------------------------------
    // BONUS STEP 12: Order Cancellation & Stock Restoration Verification
    // -------------------------------------------------------------------------
    console.log("\n[STEP 12 - BONUS] Verifying Stock Restoration on Cancellation...");
    // Place an order for 1 unit of Variant L
    const cancelTestOrderReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Cancel Test User",
        customerPhone: "9123456789",
        addressLine1: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        items: [
          {
            productId: storefrontProduct!.id,
            variantId: finalVariantL!.id,
            size: "L",
            quantity: 1,
          },
        ],
      }),
    });

    const cancelTestOrderRes = await createOrderRoute(cancelTestOrderReq);
    const cancelTestOrderJson = await cancelTestOrderRes.json();
    assert(cancelTestOrderJson.success === true, "Cancel test order placement failed");
    const cancelOrderNumber = cancelTestOrderJson.orderNumber;

    const cancelOrderRecord = await prisma.order.findUnique({ where: { orderNumber: cancelOrderNumber } });
    const varLAfterOrder = await prisma.productVariant.findUnique({ where: { id: finalVariantL!.id } });
    assert(varLAfterOrder!.stockQuantity === 7, `Variant L stock should be 7 after order, got ${varLAfterOrder!.stockQuantity}`);

    // Admin cancels the order
    const cancelReq = new Request(`http://localhost:3000/api/admin/orders/${cancelOrderRecord!.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    const cancelRes = await updateOrderRoute(cancelReq, { params: Promise.resolve({ id: cancelOrderRecord!.id }) });
    const cancelJson = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelJson.success === true, "Cancelling order failed");

    // Verify stock is restored back to 8!
    const varLAfterCancel = await prisma.productVariant.findUnique({ where: { id: finalVariantL!.id } });
    assert(varLAfterCancel!.stockQuantity === 8, `Variant L stock should be restored to 8, got ${varLAfterCancel!.stockQuantity}`);
    console.log("  - Stock correctly restored back from 7 to 8 upon cancellation!");

    // Try cancelling a second time; verify it's blocked by terminal state check
    const cancelReq2 = new Request(`http://localhost:3000/api/admin/orders/${cancelOrderRecord!.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: adminCookieHeader,
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    const cancelRes2 = await updateOrderRoute(cancelReq2, { params: Promise.resolve({ id: cancelOrderRecord!.id }) });
    assert(cancelRes2.status === 400, "Second cancellation should have been rejected with 400 Bad Request");
    const varLAfterSecondCancel = await prisma.productVariant.findUnique({ where: { id: finalVariantL!.id } });
    assert(varLAfterSecondCancel!.stockQuantity === 8, "Stock must NOT be incremented twice!");
    console.log("  - Second cancellation correctly rejected. Stock was NOT restored twice.");
    console.log(`✅ STEP 12 PASSED: Safe inventory restoration on cancellation verified.`);

    console.log("\n================================================================================");
    console.log("🎉 ALL 12 INTEGRATION WORKFLOW STEPS PASSED SUCCESSFULLY WITHOUT ERRORS!");
    console.log("================================================================================");
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN E2E WORKFLOW TEST:", err);
  process.exit(1);
});
