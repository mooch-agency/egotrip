import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// Same mark as icon.svg: a black sun on white.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <div style={{ width: 84, height: 84, borderRadius: 999, background: "#000000" }} />
      </div>
    ),
    size,
  )
}
