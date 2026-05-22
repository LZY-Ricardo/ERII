import AdminLoginForm from "@/src/components/admin/AdminLoginForm";

export const metadata = {
  title: "登录 - Erii Admin",
  robots: { index: false, follow: false },
};

function getParamValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getSafeRedirect(value) {
  if (!value || !value.startsWith("/")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const from = getSafeRedirect(getParamValue(params?.from));
  const error = getParamValue(params?.error) === "invalid" ? "密码错误" : "";

  return <AdminLoginForm from={from} error={error} />;
}
