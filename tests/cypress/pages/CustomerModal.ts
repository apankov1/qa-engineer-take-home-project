import { BasePage } from './BasePage';
import { Customer, PartialCustomer } from '../types/customer';
import { CustomerModalSelectors, CustomerFormSelectors } from '../selectors/customerModal.selectors';

export class CustomerModal extends BasePage {
  selectors = CustomerModalSelectors;

  private fieldMap: Record<keyof Customer, string> = {
    firstName: CustomerFormSelectors.FirstName,
    lastName: CustomerFormSelectors.LastName,
    email: CustomerFormSelectors.Email,
    addressLine1: CustomerFormSelectors.AddressLine1,
    addressLine2: CustomerFormSelectors.AddressLine2,
    city: CustomerFormSelectors.City,
    state: CustomerFormSelectors.State,
    zip: CustomerFormSelectors.Zip,
    notes: CustomerFormSelectors.Notes,
  };

  fillCustomerForm(data: PartialCustomer) {
    const keys = Object.keys(data) as Array<keyof Customer>;
    keys.forEach((key) => {
      if (data[key]) this.typeInField(this.fieldMap[key], data[key]);
    });
  }

  clickSaveButton() {
    cy.get(this.selectors.SaveButton).scrollIntoView().click();
  }

  clickCloseButton() {
    this.clickButton(this.selectors.CloseButton);
  }

  clickConfirmDeleteButton() {
    this.clickButton(this.selectors.ConfirmYes);
  }
}
