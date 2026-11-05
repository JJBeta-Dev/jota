export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

export type Product = "all" | "bikes" | "scooters" | "parts";

/** Units sold per month for each product line. */
export const SALES: Record<Exclude<Product, "all">, number[]> = {
  bikes: [12, 18, 15, 24, 30, 28],
  scooters: [8, 11, 14, 13, 19, 25],
  parts: [30, 26, 35, 31, 40, 38],
};

export const PRODUCTS: Array<{ id: Product; label: string }> = [
  { id: "all", label: "All products" },
  { id: "bikes", label: "Bikes" },
  { id: "scooters", label: "Scooters" },
  { id: "parts", label: "Parts" },
];

export function seriesFor(product: Product): number[] {
  if (product !== "all") return SALES[product];
  return MONTHS.map((_, month) => Object.values(SALES).reduce((total, series) => total + (series[month] ?? 0), 0));
}
