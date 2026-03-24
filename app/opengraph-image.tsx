import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, rgb(255, 255, 255), rgb(248, 250, 252))",
          color: "rgb(17, 22, 29)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              borderRadius: 30,
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))",
              boxShadow:
                "0 10px 22px rgba(17,22,29,0.1), inset 0 1px 0 rgba(255,255,255,0.72)",
              border: "1px solid rgba(255, 45, 111, 0.12)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                background:
                  "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
                color: "white",
                fontSize: 42,
                fontWeight: 800,
              }}
            >
              C
            </div>
            <div
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                width: 12,
                height: 12,
                borderRadius: 999,
                background:
                  "linear-gradient(145deg, rgb(255,255,255), rgb(255,241,245))",
                boxShadow: "0 0 0 5px rgba(255, 45, 111, 0.14)",
              }}
            />
          </div>
          CAMPUS
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 84,
              lineHeight: 0.96,
              fontWeight: 800,
              letterSpacing: "-0.08em",
              maxWidth: "880px",
            }}
          >
            A rede universitaria para renda, troca e autonomia real.
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 28,
              color: "rgb(107, 119, 136)",
            }}
          >
            <span>Aulas</span>
            <span>Servicos</span>
            <span>Moradia</span>
            <span>Oportunidades reais</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
