import { CustomerInput } from './fixtures';

export const API_URL = '/api/customers';

const createdIds: number[] = [];

export function createCustomer(data: CustomerInput) {
  return cy.request('POST', API_URL, data).then((res) => {
    createdIds.push(res.body.id);
    return res;
  });
}

export function trackCreatedId(id: number) {
  createdIds.push(id);
}

export function removeFromCleanup(id: number) {
  const idx = createdIds.indexOf(id);
  if (idx > -1) createdIds.splice(idx, 1);
}

export function cleanupCreatedCustomers() {
  createdIds.forEach((id) => {
    cy.request({
      method: 'DELETE',
      url: `${API_URL}/${id}`,
      failOnStatusCode: false,
    });
  });
  createdIds.length = 0;
}
