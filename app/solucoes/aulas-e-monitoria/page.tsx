import { redirect } from "next/navigation";

export default function ClassesRedirectPage() {
  redirect("/trabalhos?aba=aulas");
}
