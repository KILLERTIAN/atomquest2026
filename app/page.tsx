import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function RootPage() {
  const session = await auth();

  if (session) {
    switch (session.user.role) {
      case "ADMIN":    redirect("/admin");
      case "MANAGER":  redirect("/manager");
      default:         redirect("/employee");
    }
  }

  return <LandingPage />;
}
