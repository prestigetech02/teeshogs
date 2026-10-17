import { z } from "zod"

export const contactSubjects = [
  { value: "order", label: "Order support" },
  { value: "sizing", label: "Sizing & fit" },
  { value: "shipping", label: "Shipping & delivery" },
  { value: "returns", label: "Returns & exchanges" },
  { value: "styling", label: "Styling advice" },
  { value: "other", label: "Something else" },
] as const

const subjectValueSet = new Set<string>(contactSubjects.map((item) => item.value))

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  subject: z
    .string()
    .trim()
    .min(1, "Select a subject")
    .refine((value) => subjectValueSet.has(value), { message: "Select a subject" }),
  orderNumber: z.string().trim().max(80).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters)")
    .max(5000),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
