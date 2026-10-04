import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const companySchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  tradeName: optionalText(160),
  taxId: optionalText(24),
  address: optionalText(240),
  number: optionalText(20),
  complement: optionalText(100),
  neighborhood: optionalText(100),
  city: optionalText(100),
  state: optionalText(2),
  postalCode: optionalText(12),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  email: z.string().trim().max(160).optional().or(z.literal("")).refine((val) => {
    // Allow empty string or valid email
    if (val === "") return true;
    try {
      z.string().email().parse(val);
      return true;
    } catch {
      return false;
    }
  }),
  website: optionalText(200),
  logoObjectKey: optionalText(5000),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  taxId: optionalText(24),
  address: optionalText(240),
  number: optionalText(20),
  complement: optionalText(100),
  neighborhood: optionalText(100),
  city: optionalText(100),
  state: optionalText(2),
  postalCode: optionalText(12),
  contactName: optionalText(160),
  phone: optionalText(40),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: optionalText(2000),
});

export const elevatorSchema = z.object({
  customerId: z.string().uuid(),
  identification: z.string().trim().min(1).max(120),
  number: optionalText(40),
  manufacturer: optionalText(100),
  model: optionalText(100),
  capacity: optionalText(40),
  stops: optionalText(40),
  location: optionalText(160),
  type: optionalText(60),
  notes: optionalText(2000),
});

export const recordSchema = z.object({
  part: z.string().trim().min(1).max(80),
  customPart: optionalText(120),
  notes: z.string().trim().min(1).max(10000),
  photos: z.array(z.string()).optional(),
});

export const serviceOrderSchema = z.object({
  customerId: z.string().uuid(),
  elevatorId: z.string().uuid().optional().or(z.literal("")),
  elevatorIdentification: optionalText(120),
  situation: z.enum(["NORMAL", "WITH_NOTES", "QUOTE_REQUIRED", "IRREGULARITY"]).optional(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  responsibleName: optionalText(160),
  responsibleRole: optionalText(80),
  generalNotes: optionalText(10000),
  servicesNotes: optionalText(10000),
  findingsNotes: optionalText(10000),
  records: z.array(recordSchema).min(1).max(100),
  // Campos opcionais de assinatura (para POST e PUT)
  signature: z.string().optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ElevatorInput = z.infer<typeof elevatorSchema>;
export type ServiceOrderInput = z.infer<typeof serviceOrderSchema>;
