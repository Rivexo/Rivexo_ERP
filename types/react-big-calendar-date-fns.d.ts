// @types/react-big-calendar no cubre el subpath del localizer de date-fns.
/* eslint-disable @typescript-eslint/no-explicit-any -- forma real (no tipada) del contrato externo de la libreria */
declare module "react-big-calendar/lib/localizers/date-fns" {
  import type { DateLocalizer } from "react-big-calendar";

  interface DateFnsLocalizerSpec {
    format: (...args: any[]) => string;
    parse: (...args: any[]) => Date;
    startOfWeek: (...args: any[]) => Date;
    getDay: (...args: any[]) => number;
    locales: Record<string, unknown>;
  }

  function dateFnsLocalizer(spec: DateFnsLocalizerSpec): DateLocalizer;
  export default dateFnsLocalizer;
}
