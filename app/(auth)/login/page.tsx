import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary p-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo/rivexo_vertical.svg" alt="Rivexo" className="mb-3 h-20 w-auto" />
          <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
