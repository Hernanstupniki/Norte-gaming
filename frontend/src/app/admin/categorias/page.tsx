import { CategoriesAdminClient } from "@/components/admin/categories-admin-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Categorías",
  robots: "noindex, nofollow",
};

export default function AdminCategoriasPage() {
  return <CategoriesAdminClient />;
}
