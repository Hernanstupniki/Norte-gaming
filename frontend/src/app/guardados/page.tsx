import { redirect } from "next/navigation";

export default function GuardadosPage() {
  redirect("/tienda?guardados=true");
}
