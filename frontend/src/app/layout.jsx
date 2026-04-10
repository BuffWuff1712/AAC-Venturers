import { AppShell } from "../layouts/AppShell";
import { Providers } from "./providers";
import "../styles/index.css";

export const metadata = {
  title: "AAC-Venturers",
  description: "AAC communication practice prototype for school canteen ordering.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
