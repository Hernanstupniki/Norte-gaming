import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <AuthPanel mode="register" />
    </Suspense>
  );
}
