import "dotenv/config";
import { NextRequest } from "next/server";
import { proxy as middleware } from "../src/proxy";
import { GET as getProductsApi } from "../src/app/api/admin/products/route";
import { GET as getCategoriesApi } from "../src/app/api/admin/categories/route";
import { GET as getOrderApi } from "../src/app/api/admin/orders/[id]/route";
import { POST as loginApi } from "../src/app/api/admin/auth/login/route";
import { POST as logoutApi } from "../src/app/api/admin/auth/logout/route";
import { ADMIN_COOKIE_NAME, signAdminToken } from "../src/lib/auth-token";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("       EZONE4U — ADMIN AUTHENTICATION & ACCESS CONTROL VERIFICATION TEST");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // TEST 1: Unauthenticated visitor accessing /admin/products
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 1] Visiting /admin/products without cookie...");
  const req1 = new NextRequest("http://localhost:3000/admin/products");
  const res1 = await middleware(req1);
  assert(res1.status === 307 || res1.status === 302 || res1.status === 308, `Expected redirect status, got ${res1.status}`);
  const location1 = res1.headers.get("location") || "";
  assert(location1.includes("/admin/login"), `Expected redirect to /admin/login, got: ${location1}`);
  console.log(`✅ TEST 1 PASSED: Access to /admin/products without credentials redirects to /admin/login (${location1}).`);

  // ---------------------------------------------------------------------------
  // TEST 2: Unauthenticated visitor accessing /admin/orders
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 2] Visiting /admin/orders without cookie...");
  const req2 = new NextRequest("http://localhost:3000/admin/orders");
  const res2 = await middleware(req2);
  assert(res2.status === 307 || res2.status === 302 || res2.status === 308, `Expected redirect status, got ${res2.status}`);
  const location2 = res2.headers.get("location") || "";
  assert(location2.includes("/admin/login"), `Expected redirect to /admin/login, got: ${location2}`);
  console.log(`✅ TEST 2 PASSED: Access to /admin/orders without credentials redirects to /admin/login (${location2}).`);

  // ---------------------------------------------------------------------------
  // TEST 3: Calling Admin APIs without session
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 3] Calling /api/admin/products without cookie...");
  const apiReqProducts = new Request("http://localhost:3000/api/admin/products");
  const apiResProducts = await getProductsApi(apiReqProducts);
  assert(apiResProducts.status === 401, `Expected 401 Unauthorized, got ${apiResProducts.status}`);
  const apiJsonProducts = await apiResProducts.json();
  assert(apiJsonProducts.success === false, "Expected success: false for unauthenticated API call");

  console.log("  - /api/admin/products rejected unauthenticated request with 401.");

  const apiReqCategories = new Request("http://localhost:3000/api/admin/categories");
  const apiResCategories = await getCategoriesApi(apiReqCategories);
  assert(apiResCategories.status === 401, `Expected 401 Unauthorized for categories, got ${apiResCategories.status}`);
  console.log("  - /api/admin/categories rejected unauthenticated request with 401.");

  const apiReqOrders = new Request("http://localhost:3000/api/admin/orders/some-id");
  const apiResOrders = await getOrderApi(apiReqOrders, { params: Promise.resolve({ id: "some-id" }) });
  assert(apiResOrders.status === 401, `Expected 401 Unauthorized for orders, got ${apiResOrders.status}`);
  console.log("  - /api/admin/orders/[id] rejected unauthenticated request with 401.");

  // Also test middleware on API routes
  const midApiReq = new NextRequest("http://localhost:3000/api/admin/products");
  const midApiRes = await middleware(midApiReq);
  assert(midApiRes.status === 401, `Middleware should return 401 for /api/admin/products without cookie, got ${midApiRes.status}`);
  console.log(`✅ TEST 3 PASSED: All protected Admin APIs independently enforce 401 Unauthorized.`);

  // ---------------------------------------------------------------------------
  // TEST 4: Calling Admin APIs with forged / tampered token
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing tampered session cookie...");
  const tamperedReq = new Request("http://localhost:3000/api/admin/products", {
    headers: {
      cookie: `${ADMIN_COOKIE_NAME}=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJleHAiOjk5OTk5OTk5OTl9.FORGED_SIGNATURE`,
    },
  });
  const tamperedRes = await getProductsApi(tamperedReq);
  assert(tamperedRes.status === 401, `Forged token should be rejected with 401, got ${tamperedRes.status}`);
  console.log(`✅ TEST 4 PASSED: Forged HMAC signature rejected with 401 Unauthorized.`);

  // ---------------------------------------------------------------------------
  // TEST 5: Calling Admin APIs with expired token
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing expired session token...");
  const expiredToken = signAdminToken({
    id: "admin-id",
    email: "admin@ezone4u.com",
    name: "Admin",
    role: "ADMIN",
  });
  // Manually construct token with exp in the past
  const expiredParts = expiredToken.split(".");
  const expiredPayload = JSON.parse(Buffer.from(expiredParts[1], "base64").toString("utf-8"));
  expiredPayload.exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  const encHeader = expiredParts[0];
  const encPayload = Buffer.from(JSON.stringify(expiredPayload)).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const dataToSign = `${encHeader}.${encPayload}`;
  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", process.env.ADMIN_JWT_SECRET || "ezone4u-default-development-secret-key-32chars");
  hmac.update(dataToSign);
  const sig = hmac.digest("base64url");
  const validSignedExpiredToken = `${dataToSign}.${sig}`;

  const expiredReq = new Request("http://localhost:3000/api/admin/products", {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=${validSignedExpiredToken}` },
  });
  const expiredRes = await getProductsApi(expiredReq);
  assert(expiredRes.status === 401, `Expired token should be rejected with 401, got ${expiredRes.status}`);
  console.log(`✅ TEST 5 PASSED: Expired session token rejected with 401 Unauthorized.`);

  // ---------------------------------------------------------------------------
  // TEST 6: Login with valid admin credentials
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 6] Authenticating with valid admin credentials...");
  const loginReq = new Request("http://localhost:3000/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@ezone4u.com",
      password: "Ezone4uAdmin@2026",
    }),
  });

  const loginRes = await loginApi(loginReq);
  assert(loginRes.status === 200, `Login failed with status ${loginRes.status}`);
  const loginJson = await loginRes.json();
  assert(loginJson.success === true, "Login JSON did not indicate success");

  const setCookie = loginRes.headers.get("set-cookie") || "";
  const match = setCookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
  assert(!!match, "Session cookie not found in login response");
  const validSessionCookie = match![1];
  console.log(`✅ TEST 6 PASSED: Admin authenticated successfully. Signed session cookie issued.`);

  // ---------------------------------------------------------------------------
  // TEST 7: Accessing protected routes with valid session cookie
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 7] Accessing admin routes with valid session cookie...");
  const authNextReq = new NextRequest("http://localhost:3000/admin/products", {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=${validSessionCookie}` },
  });
  const authNextRes = await middleware(authNextReq);
  assert(authNextRes.status === 200, `Expected 200 / passthrough from middleware, got ${authNextRes.status}`);
  console.log(`  - /admin/products allows authenticated admin through.`);

  const authApiReq = new Request("http://localhost:3000/api/admin/products", {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=${validSessionCookie}` },
  });
  const authApiRes = await getProductsApi(authApiReq);
  assert(authApiRes.status === 200, `Expected 200 OK for authenticated API call, got ${authApiRes.status}`);
  console.log(`  - /api/admin/products returns 200 OK with product list.`);

  // Visiting /admin/login while logged in should redirect to /admin/orders
  const loginVisitReq = new NextRequest("http://localhost:3000/admin/login", {
    headers: { cookie: `${ADMIN_COOKIE_NAME}=${validSessionCookie}` },
  });
  const loginVisitRes = await middleware(loginVisitReq);
  assert(loginVisitRes.status === 307 || loginVisitRes.status === 302 || loginVisitRes.status === 308, "Expected redirect when visiting /admin/login while logged in");
  const loginRedirect = loginVisitRes.headers.get("location") || "";
  assert(loginRedirect.includes("/admin/orders"), `Expected redirect to /admin/orders, got: ${loginRedirect}`);
  console.log(`  - Visiting /admin/login while logged in automatically redirects to /admin/orders.`);
  console.log(`✅ TEST 7 PASSED: Authenticated routes work seamlessly.`);

  // ---------------------------------------------------------------------------
  // TEST 8: Logging out and verifying session revocation
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 8] Logging out...");
  const logoutRes = await logoutApi();
  assert(logoutRes.status === 200, `Logout failed with status ${logoutRes.status}`);
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  assert(logoutCookie.includes("Max-Age=0") || logoutCookie.includes("Expires="), "Cookie expiration not set on logout");
  console.log(`  - Logout API successfully cleared session cookie.`);

  // Try revisiting /admin/orders with cleared cookie
  const postLogoutReq = new NextRequest("http://localhost:3000/admin/orders");
  const postLogoutRes = await middleware(postLogoutReq);
  assert(postLogoutRes.status === 307 || postLogoutRes.status === 302 || postLogoutRes.status === 308, "Revisiting after logout should redirect");
  const postLogoutLocation = postLogoutRes.headers.get("location") || "";
  assert(postLogoutLocation.includes("/admin/login"), `Expected redirect to /admin/login, got: ${postLogoutLocation}`);
  console.log(`✅ TEST 8 PASSED: Re-visiting admin portal after logout immediately redirects back to /admin/login.`);

  // ---------------------------------------------------------------------------
  // TEST 9: Storefront guest shopping completely unobstructed
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 9] Verifying public customer storefront access...");
  const publicRoutes = ["/", "/shop", "/shop/some-garment", "/cart", "/checkout", "/contact", "/about"];
  for (const route of publicRoutes) {
    const pubReq = new NextRequest(`http://localhost:3000${route}`);
    const pubRes = await middleware(pubReq);
    assert(pubRes.status === 200, `Public route ${route} should not be blocked, got ${pubRes.status}`);
  }
  console.log(`✅ TEST 9 PASSED: All customer storefront pages are 100% accessible to guest shoppers without login.`);

  console.log("\n================================================================================");
  console.log("🎉 ALL 9 AUTHENTICATION & SECURITY TESTS PASSED COMPLETELY!");
  console.log("================================================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL ERROR IN AUTH TEST:", err);
  process.exit(1);
});
