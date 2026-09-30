import Nav from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="top">
        <h1>LUKO</h1>
      </header>
      <Nav />
      <main>{children}</main>
      <footer>
        LUKO · Twin HQ — the interactive edition. Data lives in Supabase, edited right here.
      </footer>
    </div>
  );
}
