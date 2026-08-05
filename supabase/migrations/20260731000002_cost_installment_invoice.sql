-- ===========================================================================
-- Factura del freelancer/proveedor por cuota de costo (PDF + XML), opcional
-- ===========================================================================

-- A diferencia del complemento de pago (que solo aplica al cobro al cliente),
-- aquí la factura la emite el proveedor y normalmente llega ANTES del pago,
-- no después. No es obligatoria: sirve de respaldo documental, no bloquea el
-- flujo de "marcar pagada" (ver updateCostInstallmentStatus).
alter table project_cost_installments
  add column invoice_pdf_path text,
  add column invoice_xml_path text;
