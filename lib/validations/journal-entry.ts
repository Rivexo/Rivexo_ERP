import { z } from "zod";

export const journalLineSchema = z.object({
  accountCode: z.string().min(1, "Selecciona una cuenta"),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
});

export const journalEntrySchema = z
  .object({
    entry_date: z.string().min(1, "La fecha es requerida"),
    description: z.string().min(1, "La descripción es requerida"),
    lines: z.array(journalLineSchema).min(2, "Se necesitan al menos 2 líneas"),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
      return totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: "Los cargos deben ser iguales a los abonos y mayores a 0", path: ["lines"] },
  );

export type JournalEntryInput = z.output<typeof journalEntrySchema>;
