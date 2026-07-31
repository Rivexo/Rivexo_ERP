-- ===========================================================================
-- Fase 9: complemento de pago por cuota + cuenta de IVA Acreditable
-- ===========================================================================

-- Complemento de pago CFDI de cada cuota del plan de pagos. A diferencia de
-- customer_payments (que ya no se usa desde el portal de proyecto), el
-- complemento vive directo en la cuota: una exhibición = un pago = un
-- complemento, sin necesidad de una tabla puente de reconciliación.
alter table deal_payment_installments
  add column complement_pdf_path text,
  add column complement_xml_path text;

-- IVA Acreditable: el IVA que pagamos a freelancers/proveedores, deducible
-- contra el IVA Trasladado (2200) que cobramos a clientes. Sin esta cuenta,
-- el IVA que pagamos no se distinguía del gasto neto en el asiento contable.
insert into chart_of_accounts (code, name, type)
values ('1150', 'IVA Acreditable', 'asset')
on conflict (code) do nothing;
