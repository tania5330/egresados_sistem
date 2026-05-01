import { redirect } from "next/navigation";

export default function Home() {
  const isAuthenticated = false;

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  redirect("/login");
}
