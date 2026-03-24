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
            "linear-gradient(145deg, rgb(255, 255, 255), rgb(248, 250, 252))",
          color: "rgb(17, 22, 29)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: 108,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))",
            boxShadow:
              "0 18px 42px rgba(17,22,29,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
            border: "1px solid rgba(255, 45, 111, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 256,
              height: 256,
              borderRadius: 76,
              background:
                "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
              color: "white",
              fontSize: 156,
              fontWeight: 800,
              letterSpacing: "-0.08em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            C
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 180,
            bottom: 174,
            width: 60,
            height: 60,
            borderRadius: 999,
            background:
              "linear-gradient(145deg, rgb(255,255,255), rgb(255,241,245))",
            boxShadow: "0 0 0 12px rgba(255, 45, 111, 0.14)",
          }}
        />
      </div>
    ),
    size,
  );
}
