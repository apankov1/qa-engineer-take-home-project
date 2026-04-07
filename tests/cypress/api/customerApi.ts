import { Customer } from '../types/customer';

const BASE_URL = '/api/customers';

export class CustomerApi {
  createCustomer(data: Customer) {
    return cy.request('POST', BASE_URL, data);
  }

  getAllCustomers() {
    return cy.request('GET', BASE_URL);
  }

  getCustomerById(id: number) {
    return cy.request({
      method: 'GET',
      url: `${BASE_URL}/${id}/details`,
      failOnStatusCode: false,
    });
  }

  updateCustomer(id: number, data: Customer) {
    return cy.request({
      method: 'PUT',
      url: `${BASE_URL}/${id}`,
      body: data,
      failOnStatusCode: false,
    });
  }

  deleteCustomer(id: number) {
    return cy.request({
      method: 'DELETE',
      url: `${BASE_URL}/${id}`,
      failOnStatusCode: false,
    });
  }
}
