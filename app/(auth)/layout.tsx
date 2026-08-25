export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 bg-base">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-ember-gradient shadow-floating" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Vitta</h1>
          <p className="mt-1 text-sm text-ink-soft">Sua vida, organizada com clareza.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
