/**
 * Cypress Custom Commands for Customer CRUD testing.
 *
 * This is the primary code-reuse layer. Cypress recommends custom commands
 * over page objects — they extend `cy`, are chainable, and keep tests readable.
 *
 * Commands are organized by concern:
 * - API commands: wrap cy.request for backend operations
 * - Form commands: shared between Add and Edit (same form, same fields)
 * - Delete commands: confirmation modal interactions
 * - Verification commands: assert table rows and API responses
 * - Page commands: navigation and search
 *
 * For error/validation API tests, use raw cy.request({ failOnStatusCode: false })
 * directly — being explicit about the HTTP call is clearer than hiding it.
 */

import { Customer, CustomerInput } from './fixtures';
import { selectors } from './selectors';

/** Base URL for all customer API endpoints. Exported for use in cy.intercept() and raw cy.request(). */
export const API_URL = '/api/customers';

// ── Type Declarations ──────────────────────────────────────────────────────────
// Augment Cypress.Chainable so all custom commands are typed and discoverable.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Cypress requires namespace augmentation for custom command types
  namespace Cypress {
    interface Chainable {
      /** Reset backend to seed data. Call in beforeEach for test isolation. */
      resetData(): Chainable<Cypress.Response<{ message: string }>>;

      /** Create a customer via POST. Returns typed response with the new customer. */
      createCustomer(data: CustomerInput): Chainable<Cypress.Response<Customer>>;

      /** Fetch a single customer by ID via GET. */
      getCustomer(id: number): Chainable<Cypress.Response<Customer>>;

      /** Fetch all customers via GET. */
      listCustomers(): Chainable<Cypress.Response<Customer[]>>;

      /** Navigate to the customers page and wait for the table to render. */
      visitCustomers(): Chainable<void>;

      /** Reload the page and wait for the table to render. */
      reloadCustomers(): Chainable<void>;

      /** Type a search term into the search input. */
      searchCustomers(term: string): Chainable<void>;

      /** Clear the search input. */
      clearSearch(): Chainable<void>;

      /** Open the Add Customer modal. */
      openAddModal(): Chainable<void>;

      /**
       * Open the Edit Customer modal for a specific row.
       * Asserts the modal header reads "Edit Customer".
       */
      openEditModal(id: number): Chainable<void>;

      /**
       * Fill customer form fields. Works for both Add (empty form) and Edit (pre-filled).
       * Uses clear() + type() so it handles both cases — clear on empty is a no-op.
       * Only fills fields present in `data`; skips undefined/empty values.
       */
      fillForm(data: Partial<CustomerInput>): Chainable<void>;

      /** Click the Save button (scrolls into view first for modal positioning). */
      saveForm(): Chainable<void>;

      /** Close the modal via the X button. */
      closeModal(): Chainable<void>;

      /** Open the delete confirmation modal for a specific row. */
      openDeleteModal(id: number): Chainable<void>;

      /** Click Yes in the delete confirmation modal. */
      confirmDelete(): Chainable<void>;

      /** Click No in the delete confirmation modal. */
      cancelDelete(): Chainable<void>;

      /**
       * Assert that a table row displays the expected cell values.
       * Only checks fields present in `expected`; skips undefined.
       */
      verifyRow(id: number, expected: Partial<CustomerInput>): Chainable<void>;

      /**
       * Assert customer fields match expected values.
       * - Pass a number as first arg: fetches via GET, then asserts (for persistence checks).
       * - Pass a Customer object: asserts directly (for inline response checks).
       * Only checks fields present in `expected`; skips undefined.
       */
      verifyCustomerApi(idOrBody: number | Customer, expected: Partial<CustomerInput>): Chainable<void>;
    }
  }
}

// ── API Commands ───────────────────────────────────────────────────────────────

Cypress.Commands.add('resetData', () => {
  cy.request('POST', '/api/test/reset');
});

Cypress.Commands.add('createCustomer', (data: CustomerInput) => {
  cy.request<Customer>('POST', API_URL, data);
});

Cypress.Commands.add('getCustomer', (id: number) => {
  cy.request<Customer>('GET', `${API_URL}/${id}/details`);
});

Cypress.Commands.add('listCustomers', () => {
  cy.request<Customer[]>('GET', API_URL);
});

// ── Page Commands ──────────────────────────────────────────────────────────────

Cypress.Commands.add('visitCustomers', () => {
  cy.visit('/');
  cy.get(selectors.customerTable).should('exist');
});

Cypress.Commands.add('reloadCustomers', () => {
  cy.reload();
  cy.get(selectors.customerTable).should('exist');
});

Cypress.Commands.add('searchCustomers', (term: string) => {
  cy.get(selectors.searchInput).type(term);
});

Cypress.Commands.add('clearSearch', () => {
  cy.get(selectors.searchInput).clear();
});

// ── Form Commands (shared for Add and Edit — same form) ────────────────────────

Cypress.Commands.add('openAddModal', () => {
  cy.get(selectors.addCustomerButton).click();
});

Cypress.Commands.add('openEditModal', (id: number) => {
  cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
  cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
});

Cypress.Commands.add('fillForm', (data: Partial<CustomerInput>) => {
  // undefined = skip field, '' = clear field, 'value' = clear + type
  const fill = (selector: string, value: string | undefined) => {
    if (value === undefined) return;
    const input = cy.get(selector).clear();
    if (value !== '') input.type(value);
  };
  fill(selectors.firstNameInput, data.firstName);
  fill(selectors.lastNameInput, data.lastName);
  fill(selectors.emailInput, data.email);
  fill(selectors.addressLine1Input, data.addressLine1);
  fill(selectors.addressLine2Input, data.addressLine2);
  fill(selectors.cityInput, data.city);
  fill(selectors.stateInput, data.state);
  fill(selectors.zipInput, data.zip);
  fill(selectors.notesInput, data.notes);
});

Cypress.Commands.add('saveForm', () => {
  cy.get(selectors.saveButton).scrollIntoView().click();
});

Cypress.Commands.add('closeModal', () => {
  cy.get(selectors.closeButton).scrollIntoView().click();
});

// ── Delete Commands ────────────────────────────────────────────────────────────

Cypress.Commands.add('openDeleteModal', (id: number) => {
  cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
});

Cypress.Commands.add('confirmDelete', () => {
  cy.get(selectors.confirmDeleteYesButton).click();
});

Cypress.Commands.add('cancelDelete', () => {
  cy.get(selectors.confirmDeleteNoButton).click();
});

// ── Verification Commands ──────────────────────────────────────────────────────

Cypress.Commands.add('verifyRow', (id: number, expected: Partial<CustomerInput>) => {
  cy.get(selectors.customerRow(id)).within(() => {
    if (expected.firstName !== undefined) cy.get(selectors.customerFirstNameCell).should('have.text', expected.firstName);
    if (expected.lastName !== undefined) cy.get(selectors.customerLastNameCell).should('have.text', expected.lastName);
    if (expected.email !== undefined) cy.get(selectors.customerEmailCell).should('have.text', expected.email);
    if (expected.addressLine1 !== undefined) cy.get(selectors.customerAddressLine1Cell).should('have.text', expected.addressLine1);
    if (expected.addressLine2 !== undefined) cy.get(selectors.customerAddressLine2Cell).should('have.text', expected.addressLine2);
    if (expected.city !== undefined) cy.get(selectors.customerCityCell).should('have.text', expected.city);
    if (expected.state !== undefined) cy.get(selectors.customerStateCell).should('have.text', expected.state);
    if (expected.zip !== undefined) cy.get(selectors.customerZipCell).should('have.text', expected.zip);
    if (expected.notes !== undefined) cy.get(selectors.customerNotesCell).should('have.text', expected.notes);
  });
});

Cypress.Commands.add('verifyCustomerApi', (idOrBody: number | Customer, expected: Partial<CustomerInput>) => {
  /**
   * Asserts customer fields against expected values.
   * If idOrBody is a number, fetches the customer first (persistence check).
   * If idOrBody is an object, asserts directly (inline response check).
   */
  const assertFields = (body: Customer) => {
    if (expected.firstName !== undefined) expect(body.firstName).to.eq(expected.firstName);
    if (expected.lastName !== undefined) expect(body.lastName).to.eq(expected.lastName);
    if (expected.email !== undefined) expect(body.email).to.eq(expected.email);
    if (expected.addressLine1 !== undefined) expect(body.addressLine1).to.eq(expected.addressLine1);
    if (expected.addressLine2 !== undefined) expect(body.addressLine2).to.eq(expected.addressLine2);
    if (expected.city !== undefined) expect(body.city).to.eq(expected.city);
    if (expected.state !== undefined) expect(body.state).to.eq(expected.state);
    if (expected.zip !== undefined) expect(body.zip).to.eq(expected.zip);
    if (expected.notes !== undefined) expect(body.notes).to.eq(expected.notes);
  };

  if (typeof idOrBody === 'number') {
    cy.getCustomer(idOrBody).then((res) => assertFields(res.body));
  } else {
    assertFields(idOrBody);
  }
});
