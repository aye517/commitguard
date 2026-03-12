"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const BASE = "/__commit-guard-lab";

const NAV_ITEMS = [
  { label: "Overview", href: BASE },
  { label: "Functions", href: `${BASE}/functions` },
  { label: "Tests", href: `${BASE}/tests` },
  { label: "Changes", href: `${BASE}/changes` },
  { label: "AI Lab", href: `${BASE}/ai` },
  { label: "Debug", href: `${BASE}/debug` },
];

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === BASE) return pathname === BASE;
    return pathname.startsWith(href);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <Link href={BASE} style={styles.logoLink}>
          <span style={styles.logo}>CommitGuard Lab</span>
        </Link>
        <span style={styles.tagline}>Experimental tools for safer commits</span>
      </header>

      <div style={styles.body}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                ...(isActive(item.href) ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Main Panel */}
        <main style={styles.main}>{children}</main>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>commitguard v0.1.0</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    fontFamily:
      "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
    background: "#0a0a0a",
    color: "#e0e0e0",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 1.5rem",
    borderBottom: "1px solid #1e1e1e",
    background: "#0f0f0f",
  },
  logoLink: {
    textDecoration: "none",
    color: "inherit",
  },
  logo: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#22c55e",
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontSize: "0.75rem",
    color: "#555",
  },

  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },

  sidebar: {
    width: 180,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "0.5rem",
    borderRight: "1px solid #1e1e1e",
    background: "#0c0c0c",
  },
  navItem: {
    display: "block",
    padding: "0.5rem 0.75rem",
    borderRadius: 6,
    fontSize: "0.8rem",
    color: "#888",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
  },
  navItemActive: {
    background: "#1a1a1a",
    color: "#22c55e",
  },

  main: {
    flex: 1,
    overflow: "auto",
    padding: "1.5rem 2rem",
  },

  footer: {
    padding: "0.5rem 1.5rem",
    borderTop: "1px solid #1e1e1e",
    fontSize: "0.7rem",
    color: "#444",
    background: "#0c0c0c",
  },
};
