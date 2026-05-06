'use client'

export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-[#FFE5C9] border-t-[#FF6B00] animate-spin motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  )
}
