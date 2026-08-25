import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
