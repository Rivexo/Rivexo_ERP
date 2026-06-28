import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(value ?? 0)
}

export function formatPercent(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`
}
