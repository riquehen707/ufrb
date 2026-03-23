import { redirect } from "next/navigation";

export default function GeneralServicesRedirectPage() {
  redirect("/trabalhos?aba=servicos");
}
