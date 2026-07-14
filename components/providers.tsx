"use client";

import { ClerkProvider } from "@/components/clerk-provider";
import { createQueryClient } from "@/orpc/create-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}
