import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-[100dvh]">
      {/* Language switcher in top-right corner */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
        <LanguageSwitcher variant="outline" size="sm" showLabel />
      </div>
      {children}
    </div>
  )
}
