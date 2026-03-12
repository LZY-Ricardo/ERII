/**
 * Login page uses a blank layout (no sidebar/header).
 */
export const metadata = {
  title: "登录 - Erii Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }) {
  return <>{children}</>;
}
