import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = parseInt(sizeParam) || 512;
  const ballSize = Math.round(size * 0.72);
  const fontSize = Math.round(size * 0.29);
  const subFontSize = Math.round(size * 0.08);

  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: ballSize,
          height: ballSize,
          borderRadius: "50%",
          background: "#ea580c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(size * 0.01),
        }}
      >
        <span style={{ color: "#000", fontSize, fontWeight: 900, letterSpacing: "-4px", lineHeight: 1 }}>
          SB
        </span>
        <span style={{ color: "rgba(0,0,0,0.45)", fontSize: subFontSize, fontWeight: 700, letterSpacing: "3px" }}>
          BALLEN
        </span>
      </div>
    </div>,
    { width: size, height: size }
  );
}
