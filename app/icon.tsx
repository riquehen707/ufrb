import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 204,
          fontWeight: 800,
          letterSpacing: "-0.08em",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 348,
            height: 348,
            borderRadius: 96,
            background:
              "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
            boxShadow: "0 0 0 16px rgba(255,255,255,0.06)",
          }}
        >
          C
        </div>
        <div
          style={{
            position: "absolute",
            right: 116,
            bottom: 120,
            width: 46,
            height: 46,
            borderRadius: 999,
            background: "rgb(255, 193, 214)",
          }}
        />
      </div>
    ),
    size,
  );
}
