import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Hackermind — Recently Added", description: "Discover real projects and find your next starting point." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
