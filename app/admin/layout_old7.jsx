import AdminNav from "./AdminNav";

export const metadata = {
  title: "Admin — PeopleLens",
};

export default function AdminLayout({ children }) {
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
