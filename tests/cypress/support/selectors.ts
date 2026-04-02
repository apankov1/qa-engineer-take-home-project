export const selectors = {
  // Page
  pageHeader: '[data-testid="page-header"]',
  customerTable: '[data-testid="customer-table"]',
  customerHeaderRow: '[data-testid="customer-header-row"]',
  searchInput: '[data-testid="search-input"]',

  // Global actions
  addCustomerButton: '[data-testid="add-customer-button"]',

  // Modal
  modalContainer: '[data-testid="modal-container"]',
  modalHeader: '[data-testid="modal-header"]',
  closeButton: '[data-testid="close-button"]',
  saveButton: '[data-testid="save-button"]',
  confirmDeleteYesButton: '[data-testid="confirm-delete-yes-button"]',
  confirmDeleteNoButton: '[data-testid="confirm-delete-no-button"]',

  // Form inputs
  firstNameInput: '[data-testid="first-name-input"]',
  lastNameInput: '[data-testid="last-name-input"]',
  emailInput: '[data-testid="email-input"]',
  addressLine1Input: '[data-testid="address-line-1-input"]',
  addressLine2Input: '[data-testid="address-line-2-input"]',
  cityInput: '[data-testid="city-input"]',
  stateInput: '[data-testid="state-input"]',
  zipInput: '[data-testid="zip-input"]',
  notesInput: '[data-testid="notes-input"]',

  // Dynamic row-level selectors (use anyCustomerRow for counting/existence)
  anyCustomerRow: '[data-testid^="customer-row-"]',
  customerRow: (id: number | string) => `[data-testid="customer-row-${id}"]`,
  editCustomerButton: (id: number | string) =>
    `[data-testid="edit-customer-button-${id}"]`,
  deleteCustomerButton: (id: number | string) =>
    `[data-testid="delete-customer-button-${id}"]`,

  // Row-scoped cells
  customerFirstNameCell: '[data-testid="customer-first-name-cell"]',
  customerLastNameCell: '[data-testid="customer-last-name-cell"]',
  customerEmailCell: '[data-testid="customer-email-cell"]',
  customerAddressLine1Cell: '[data-testid="customer-address-line-1-cell"]',
  customerAddressLine2Cell: '[data-testid="customer-address-line-2-cell"]',
  customerCityCell: '[data-testid="customer-city-cell"]',
  customerStateCell: '[data-testid="customer-state-cell"]',
  customerZipCell: '[data-testid="customer-zip-cell"]',
  customerNotesCell: '[data-testid="customer-notes-cell"]',
};
