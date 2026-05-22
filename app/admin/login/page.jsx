import { redirect } from "next/navigation";

export default async function LegacyAdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const from = typeof params?.from === "string" ? params.from : "/admin";
  redirect(`/admin-login?from=${encodeURIComponent(from)}`);
}
