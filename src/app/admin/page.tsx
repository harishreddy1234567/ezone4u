import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminIndexPage() {
  await requireAdminSession();
  redirect("/admin/orders");
}
