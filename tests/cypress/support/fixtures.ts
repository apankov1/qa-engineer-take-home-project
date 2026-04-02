export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

export type CustomerInput = Omit<Customer, 'id'>;

export const validCustomer: CustomerInput = {
  firstName: 'John',
  lastName: 'Appleseed',
  email: 'johnappleseed@vistarmedia.com',
  addressLine1: '400 Market St',
  addressLine2: 'Suite 825',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19106',
  notes: 'This is a sample note.',
};

export const testCustomer: CustomerInput = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@test.com',
  addressLine1: '123 Test St',
  addressLine2: 'Apt 4B',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19106',
  notes: 'Test customer',
};
