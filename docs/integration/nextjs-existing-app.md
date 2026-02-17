# Integrate FredonBytes Into Existing Next.js App

## 1. Install packages

```bash
npm i @fredonbytes/config @fredonbytes/core @fredonbytes/ui @fredonbytes/adapter-supabase @fredonbytes/adapter-vendure
```

## 2. Add provider wiring in App Router

Create a container once per request boundary and pass it to `FredonBytesProvider`.

```tsx
// app/layout.tsx
import { FredonBytesProvider } from "@fredonbytes/ui";
import { getContainer } from "@/lib/fredonbytes/container";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const container = getContainer();
  return (
    <html lang="en">
      <body>
        <FredonBytesProvider value={container}>{children}</FredonBytesProvider>
      </body>
    </html>
  );
}
```

## 3. Create composition root

```ts
// src/lib/fredonbytes/container.ts
import { loadConfig } from "@fredonbytes/config";
import { createServiceContainer } from "@fredonbytes/core";
import { createSupabaseServices } from "@fredonbytes/adapter-supabase";
import { createVendureServices } from "@fredonbytes/adapter-vendure";

export function getContainer() {
  const config = loadConfig(process.env);
  return createServiceContainer(config, {
    supabase: () => createSupabaseServices({} as never),
    vendure: () => createVendureServices({} as never),
  });
}
```

## 4. Add App Router route-handler wiring

Route handlers should call domain services from the resolved container.

```ts
// app/api/cart/route.ts
import { getContainer } from "@/lib/fredonbytes/container";

export async function GET() {
  const container = getContainer();
  if (container.mode === "supabase") {
    const cart = await container.services.cart.getActiveCart("me");
    return Response.json(cart);
  }
  return Response.json({ message: "Vendure mode active" });
}
```

## 5. Environment examples

Supabase mode:

```env
FREDONBYTES_MODE=supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Vendure mode:

```env
FREDONBYTES_MODE=vendure
VENDURE_SHOP_API_URL=https://example.com/shop-api
VENDURE_CHANNEL_TOKEN=__default_channel__
```
