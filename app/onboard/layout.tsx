/** Keeps /onboard out of brittle static generation (helps OneDrive + dev chunk stability). */
export const dynamic = 'force-dynamic'

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
