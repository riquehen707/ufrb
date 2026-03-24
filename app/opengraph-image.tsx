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
              width: 88,
              height: 88,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 28,
              background:
                "linear-gradient(145deg, rgb(255, 45, 111), rgb(199, 15, 77))",
              color: "white",
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            C
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
