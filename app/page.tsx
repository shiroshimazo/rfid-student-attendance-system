import { redirect } from "next/navigation";

export default function Home() {
  // No public landing page yet — the app entry point is the login screen.
  redirect("/Auth/Login");
}
