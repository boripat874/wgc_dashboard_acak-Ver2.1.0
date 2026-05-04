"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";

import { HeroUIProvider } from "@heroui/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // ปิดการ fetch ใหม่เมื่อสลับหน้าจอ (ถ้าไม่ต้องการ)
        retry: 1, // ถ้าพัง ให้ลองใหม่ 1 ครั้ง
      },
    },
  }));


  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <HeroUIProvider>
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </QueryClientProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
