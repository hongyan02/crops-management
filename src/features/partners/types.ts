export type PartnerKind = "supplier" | "buyer";

export type PartnerFormValues = {
  name: string;
  contact: string;
  phone: string;
  address: string;
};

export type Partner = {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  productCount: number;
  qualityRecordCount?: number;
  requirementCount?: number;
  createdAt?: string | null;
};
