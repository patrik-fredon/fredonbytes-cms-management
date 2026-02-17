import { getContainer } from "../lib/container";

export default function HomePage() {
  const container = getContainer();

  return (
    <main>
      <h1>FredonBytes Starter</h1>
      <p>Mode: {container.mode}</p>
    </main>
  );
}
