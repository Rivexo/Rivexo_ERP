// @types/react-big-calendar no cubre el subpath del localizer de date-fns.
declare module "react-big-calendar/lib/localizers/date-fns" {
  import type { DateLocalizer } from "react-big-calendar";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
