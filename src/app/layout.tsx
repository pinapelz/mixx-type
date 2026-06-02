import type { Metadata } from "next";
import StyledComponentsRegistry from "./registry";
import { AuthProvider } from "./context/auth";

export const metadata: Metadata = {
  title: "TypingMIXX",
  description:
    "A typing game powered by LRC lyrics. Type along to your favourite songs!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
