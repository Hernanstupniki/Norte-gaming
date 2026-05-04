import { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";

export const metadata: Metadata = {
  title: "Mi cuenta | Norte Gaming",
  description: "Panel personal para gestionar datos, carrito y pedidos.",
  robots: "noindex, nofollow",
};

export default function MiCuentaPage() {
  return <AccountPanel />;
}
