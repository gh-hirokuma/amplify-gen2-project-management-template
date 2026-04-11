import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ja } from "date-fns/locale";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn(
        "rounded-[1.5rem] border border-stone-200/80 bg-white p-4 [--cell-size:2.5rem]",
        className,
      )}
      classNames={{
        root: "w-fit",
        months: "flex flex-col",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pb-2",
        caption_label:
          "rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-sm font-semibold text-stone-900",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "mb-2 flex",
        weekday:
          "flex-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400",
        week: "mt-1.5 flex w-full",
        day: "flex-1 text-center",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-10 w-10 rounded-2xl font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950",
        ),
        selected:
          "bg-stone-900 text-white hover:bg-stone-900 hover:text-white focus:bg-stone-900 focus:text-white",
        today: "border border-stone-300 bg-stone-100 text-stone-950",
        outside: "text-stone-300 opacity-70",
        disabled: "text-stone-300 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...chevronProps} />
          ),
      }}
      locale={ja}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

export { Calendar };
