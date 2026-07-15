"use client";

import { ClerkProvider } from "@/components/clerk-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createQueryClient } from "@/orpc/create-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{props.children}</TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
