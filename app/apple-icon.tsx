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
            "linear-gradient(145deg, rgb(13, 17, 23), rgb(31, 39, 50))",
          color: "white",
          fontSize: 82,
          fontWeight: 800,
          letterSpacing: "-0.08em",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 124,
            height: 124,
            borderRadius: 34,
            background:
              "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            right: 36,
            bottom: 38,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "rgb(255, 193, 214)",
          }}
        />
      </div>
    ),
    size,
  );
}
