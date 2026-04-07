export class BasePage {
  navigate(url: string) {
    cy.visit(url);
  }

  reload() {
    cy.reload();
  }

  clickButton(selector: string) {
    cy.get(selector).click();
  }

  typeInField(selector: string, value: string) {
    cy.get(selector).clear().type(value, { parseSpecialCharSequences: false });
  }
}
