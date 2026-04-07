export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
}

export interface CustomerResponse extends Customer {
  id: number;
}

export type PartialCustomer = Partial<Customer>;
