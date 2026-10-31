export default function NetworkCanvas() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: `radial-gradient(rgba(38,161,123,0.6) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
      aria-hidden="true"
    />
  );
}
