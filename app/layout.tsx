import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preparador EUDR · FAF Coffees",
  description: "Prepare GeoJSON, Shapefile e o cadastro EUDR a partir de um KML.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
