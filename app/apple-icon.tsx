import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Groene cirkel */}
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "#22c55e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ color: "#000", fontSize: 52, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1 }}>
          SB
        </span>
        <span style={{ color: "rgba(0,0,0,0.5)", fontSize: 14, fontWeight: 700, letterSpacing: "2px" }}>
          BALLEN
        </span>
      </div>
    </div>,
    { ...size }
  );
}
