import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPlanForm } from "../../PlanEditor";

export const dynamic = "force-dynamic";

export default async function NewPlanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-md">
      <NewPlanForm />
    </div>
  );
}
