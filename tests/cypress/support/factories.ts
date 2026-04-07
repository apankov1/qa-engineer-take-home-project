import { faker } from '@faker-js/faker';
import { Customer, PartialCustomer } from '../types/customer';

export function buildCustomer(overrides?: PartialCustomer): Customer {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    addressLine1: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode('#####'),
    ...overrides,
  };
}
