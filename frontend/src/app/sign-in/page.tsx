import AuthForm from "@/components/AuthForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const notice =
    aviso === "enlace"
      ? "No pudimos validar el enlace en este navegador. Si ya confirmaste tu email, iniciá sesión."
      : undefined;
  return <AuthForm mode="sign-in" notice={notice} />;
}
