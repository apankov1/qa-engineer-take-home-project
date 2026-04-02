import { CustomerInput } from './fixtures';
import { selectors } from './selectors';

export function fillCustomerForm(customer: Partial<CustomerInput>) {
  if (customer.firstName) cy.get(selectors.firstNameInput).type(customer.firstName);
  if (customer.lastName) cy.get(selectors.lastNameInput).type(customer.lastName);
  if (customer.email) cy.get(selectors.emailInput).type(customer.email);
  if (customer.addressLine1) cy.get(selectors.addressLine1Input).type(customer.addressLine1);
  if (customer.addressLine2) cy.get(selectors.addressLine2Input).type(customer.addressLine2);
  if (customer.city) cy.get(selectors.cityInput).type(customer.city);
  if (customer.state) cy.get(selectors.stateInput).type(customer.state);
  if (customer.zip) cy.get(selectors.zipInput).type(customer.zip);
  if (customer.notes) cy.get(selectors.notesInput).type(customer.notes);
}

export function clickSave() {
  cy.get(selectors.saveButton).scrollIntoView().click();
}

export function reloadTable() {
  cy.reload();
  cy.get(selectors.customerTable).should('exist');
}
