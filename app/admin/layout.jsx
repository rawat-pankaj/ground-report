import AdminNav from "./AdminNav";

export const metadata = {
  title: "PeopleLens - Admin",
};

export default function AdminLayout({ children }) {
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
