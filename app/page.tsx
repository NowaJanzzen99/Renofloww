export default function Home() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .shimmer {
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      <main style={{
        background: "#111",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>

          {/* House emoji */}
          <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>🏠</div>

          {/* Title */}
          <h1 style={{
            color: "#f97316",
            fontSize: "2.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            Renofloww
          </h1>

          {/* Subtitle */}
          <p style={{
            color: "#a8a8a8",
            fontSize: "1.1rem",
            fontWeight: 400,
            marginTop: "0.5rem",
            marginBottom: "2.5rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Coming Soon
          </p>

          {/* Animated loading bar */}
          <div style={{
            width: "200px",
            height: "4px",
            background: "#2a2a2a",
            borderRadius: "999px",
            overflow: "hidden",
            margin: "0 auto",
          }}>
            <div
              className="shimmer"
              style={{
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, #f97316, transparent)",
                borderRadius: "999px",
              }}
            />
          </div>

        </div>
      </main>
    </>
  );
}
