import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-base">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Coluna do formulário */}
        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ember-gradient shadow-floating lg:mx-0" />
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                Vitta
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Sua vida, organizada com clareza.
              </p>
            </div>
            {children}
            <p className="mt-10 text-center text-[12px] text-ink-faint lg:text-left">
              Ao continuar, você concorda com a forma como tratamos seus dados:
              tudo fica vinculado à sua conta, protegido por Row Level Security
              no Supabase.
            </p>
          </div>
        </div>

        {/* Coluna ilustrativa (apenas em telas grandes) */}
        <div className="relative hidden overflow-hidden bg-moss-gradient lg:block">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_20%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70">
                Vitta
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight">
                Saúde, alimentação e ciclo menstrual em um só lugar — sem ruído.
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/85">
                Check-in diário, registro de água, refeições com calorias,
                evolução de peso, cardio e sintomas do ciclo. Tudo privado,
                tudo seu.
              </p>
            </div>
            <ul className="grid max-w-md grid-cols-1 gap-3 text-sm text-white/95 sm:grid-cols-3">
              <li className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="font-semibold">Diário</p>
                <p className="text-[12px] text-white/80">Energia, humor, água</p>
              </li>
              <li className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="font-semibold">Saúde</p>
                <p className="text-[12px] text-white/80">Peso, IMC, cardio</p>
              </li>
              <li className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="font-semibold">Ciclo</p>
                <p className="text-[12px] text-white/80">Sintomas e fases</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
