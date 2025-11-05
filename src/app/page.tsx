export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">Welcome to Koinonia</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Streamline church operations, volunteer management, and event coordination
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/signin"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
