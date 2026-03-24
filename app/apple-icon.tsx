import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "linear-gradient(145deg, rgb(255, 255, 255), rgb(248, 250, 252))",
          color: "rgb(17, 22, 29)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 40,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))",
            boxShadow:
              "0 12px 26px rgba(17,22,29,0.12), inset 0 1px 0 rgba(255,255,255,0.72)",
            border: "1px solid rgba(255, 45, 111, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 92,
              height: 92,
              borderRadius: 28,
              background:
                "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
              color: "white",
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: "-0.08em",
            }}
          >
            C
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 56,
            bottom: 54,
            width: 18,
            height: 18,
            borderRadius: 999,
            background:
              "linear-gradient(145deg, rgb(255,255,255), rgb(255,241,245))",
            boxShadow: "0 0 0 6px rgba(255, 45, 111, 0.14)",
          }}
        />
      </div>
    ),
    size,
  );
}
