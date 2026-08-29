import { BrandsAdminClient } from "@/components/admin/brands-admin-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Marcas",
  robots: "noindex, nofollow",
};

export default function AdminMarcasPage() {
  return <BrandsAdminClient />;
}
