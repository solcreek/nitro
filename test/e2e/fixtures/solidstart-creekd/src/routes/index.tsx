export default function Home() {
  const renderedAt = new Date().toISOString();
  return (
    <main>
      <h1 data-testid="hero">Hello from @solcreek/nitro/creekd</h1>
      <p data-testid="rendered-at">{renderedAt}</p>
    </main>
  );
}
