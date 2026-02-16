"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
}>({});

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        type?: "single" | "multiple";
        collapsible?: boolean;
        value?: string;
        onValueChange?: (value: string) => void;
    }
>(({ className, value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [value, setValue] = React.useState<string>(controlledValue || "");

    const handleValueChange = (newValue: string) => {
        const nextValue = value === newValue ? "" : newValue;
        setValue(nextValue);
        onValueChange?.(nextValue);
    };

    // Update internal state if controlled value changes
    React.useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue);
        }
    }, [controlledValue]);

    return (
        <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div ref={ref} className={cn("", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
});
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    // We need to pass the value to children somehow, but context is better.
    // Actually, we can just render children. Triggers and Contents will use context.
    // But Triggers need to know *their* item value.
    // So we'll use a Context for the Item too.
    return (
        <AccordionItemContext.Provider value={{ value }}>
            <div ref={ref} className={cn("border-b", className)} {...props} />
        </AccordionItemContext.Provider>
    );
});
AccordionItem.displayName = "AccordionItem";

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" });

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);
    const isOpen = selectedValue === itemValue;

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => onValueChange?.(itemValue)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);
    const isOpen = selectedValue === itemValue;

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div ref={ref} className={cn("pb-4 pt-0", className)} {...props}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
