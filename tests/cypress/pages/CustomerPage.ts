import { BasePage } from './BasePage';
import { CustomerModal } from './CustomerModal';
import { Customer, PartialCustomer } from '../types/customer';
import { CustomerPageSelectors, customerCellSelector } from '../selectors/customerPage.selectors';

const modal = new CustomerModal();

export class CustomerPage extends BasePage {
  selectors = CustomerPageSelectors;

  navigateToCustomers() {
    this.navigate('/');
  }

  searchCustomers(term: string) {
    this.typeInField(this.selectors.SearchInput, term);
  }

  addCustomer(data: Customer) {
    this.clickButton(this.selectors.AddCustomerButton);
    modal.fillCustomerForm(data);
    modal.clickSaveButton();
  }

  deleteCustomer(identifier: string) {
    this.getCustomerRow(identifier).find(this.selectors.DeleteButtonPrefix).click();
    modal.clickConfirmDeleteButton();
  }

  editCustomer(identifier: string, data: PartialCustomer) {
    this.getCustomerRow(identifier).find(this.selectors.EditButtonPrefix).click();
    modal.fillCustomerForm(data);
    modal.clickSaveButton();
  }

  private cellMap: Record<keyof Customer, string> = {
    firstName: 'first-name',
    lastName: 'last-name',
    email: 'email',
    addressLine1: 'address-line-1',
    addressLine2: 'address-line-2',
    city: 'city',
    state: 'state',
    zip: 'zip',
    notes: 'notes',
  };

  verifyCustomer(identifier: string, expected: PartialCustomer) {
    this.getCustomerRow(identifier).within(() => {
      const keys = Object.keys(expected) as Array<keyof Customer>;
      keys.forEach((key) => {
        if (expected[key] !== undefined) {
          cy.get(customerCellSelector(this.cellMap[key])).should('have.text', expected[key]);
        }
      });
    });
  }

  waitForTable() {
    cy.get(this.selectors.Table).should('be.visible');
  }

  verifyCustomerCount(count: number) {
    cy.get(this.selectors.Table).find('tbody tr').should('have.length', count);
  }

  private getCustomerRow(identifier: string) {
    return cy.get(this.selectors.Table).contains('td', identifier).parent('tr');
  }
}
