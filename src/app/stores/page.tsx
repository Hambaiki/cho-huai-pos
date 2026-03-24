import { redirect } from "next/navigation";

export const metadata = { title: "Your Stores" };

export default async function StoresPage() {
  redirect("/dashboard");
}
