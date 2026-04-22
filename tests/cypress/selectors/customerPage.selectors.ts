export enum CustomerPageSelectors {
  Header = '[data-testid="page-header"]',
  AddCustomerButton = '[data-testid="add-customer-button"]',
  SearchInput = '[data-testid="search-input"]',
  Table = '[data-testid="customer-table"]',
  HeaderRow = '[data-testid="customer-header-row"]',
  EditButtonPrefix = '[data-testid^="edit-customer-button"]',
  DeleteButtonPrefix = '[data-testid^="delete-customer-button"]',
}

export const customerCellSelector = (field: string): string =>
  `[data-testid="customer-${field}-cell"]`;
