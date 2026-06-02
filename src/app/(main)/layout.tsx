import { Sidebar } from "../components/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0b0b10" }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}
