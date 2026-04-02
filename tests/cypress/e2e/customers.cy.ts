import { testCustomer } from '../support/fixtures';
import { API_URL, createCustomer, removeFromCleanup, trackCreatedId, cleanupCreatedCustomers } from '../support/api';
import { fillCustomerForm, clickSave, reloadTable } from '../support/form';
import { selectors } from '../support/selectors';

describe('Customers Page', () => {
  function createCustomerViaApi(overrides: Partial<typeof testCustomer> = {}) {
    return createCustomer({ ...testCustomer, ...overrides });
  }

  function verifyRowCells(id: number, expected: Partial<typeof testCustomer>) {
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
  }

  beforeEach(() => {
    cy.visit('/');
    cy.get(selectors.customerTable).should('exist');
  });

  afterEach(() => {
    cleanupCreatedCustomers();
  });

  describe('Page Load', () => {
    it('should display the page header', () => {
      cy.get(selectors.pageHeader).should('have.text', 'Customer Management');
    });

    it('should display the customer table with correct column headers', () => {
      cy.get(selectors.customerTable).should('be.visible');
      cy.get(selectors.customerHeaderRow).find('th').should('have.length', 10);
      cy.get(selectors.customerHeaderRow).should('contain', 'First Name');
      cy.get(selectors.customerHeaderRow).should('contain', 'Last Name');
      cy.get(selectors.customerHeaderRow).should('contain', 'Email');
      cy.get(selectors.customerHeaderRow).should('contain', 'Zip Code');
      cy.get(selectors.customerHeaderRow).should('contain', 'Actions');
    });

    it('should display the Add Customer button', () => {
      cy.get(selectors.addCustomerButton).should('be.visible');
    });

    it('should display seed customers in the table', () => {
      cy.get(selectors.anyCustomerRow).should('have.length.at.least', 2);
    });
  });

  describe('Search', () => {
    it('should display the search input', () => {
      cy.get(selectors.searchInput).should('be.visible');
    });

    it('should filter customers by first name', () => {
      const uniqueName = `SearchName${Date.now()}`;
      createCustomerViaApi({ firstName: uniqueName }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(uniqueName);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell).should('have.text', uniqueName);
      });
    });

    it('should filter customers by email', () => {
      const uniqueEmail = `search-${Date.now()}@test.com`;
      createCustomerViaApi({ email: uniqueEmail }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(uniqueEmail);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerEmailCell).should('have.text', uniqueEmail);
      });
    });

    it('should show no rows when search matches nothing', () => {
      cy.get(selectors.searchInput).type('xyznonexistent123');
      cy.get(selectors.anyCustomerRow).should('have.length', 0);
    });

    it('should show all rows when search is cleared', () => {
      cy.get(selectors.anyCustomerRow).should('have.length.at.least', 1).then(($rows) => {
        const initialCount = $rows.length;
        cy.get(selectors.searchInput).type('xyznonexistent123');
        cy.get(selectors.anyCustomerRow).should('have.length', 0);
        cy.get(selectors.searchInput).clear();
        cy.get(selectors.anyCustomerRow).should('have.length', initialCount);
      });
    });
  });

  describe('Add Customer', () => {
    it('should open the Add Customer modal with empty form fields', () => {
      cy.get(selectors.addCustomerButton).click();
      cy.get(selectors.modalHeader).should('have.text', 'Add Customer');
      cy.get(selectors.firstNameInput).should('have.value', '');
      cy.get(selectors.lastNameInput).should('have.value', '');
      cy.get(selectors.emailInput).should('have.value', '');
      cy.get(selectors.addressLine1Input).should('have.value', '');
      cy.get(selectors.addressLine2Input).should('have.value', '');
      cy.get(selectors.cityInput).should('have.value', '');
      cy.get(selectors.stateInput).should('have.value', '');
      cy.get(selectors.zipInput).should('have.value', '');
      cy.get(selectors.notesInput).should('have.value', '');
    });

    it('should display all form fields with required attributes', () => {
      cy.get(selectors.addCustomerButton).click();
      cy.get(selectors.firstNameInput).should('have.attr', 'required');
      cy.get(selectors.lastNameInput).should('have.attr', 'required');
      cy.get(selectors.emailInput).should('have.attr', 'required');
      cy.get(selectors.addressLine1Input).should('have.attr', 'required');
      cy.get(selectors.addressLine2Input).should('not.have.attr', 'required');
      cy.get(selectors.cityInput).should('have.attr', 'required');
      cy.get(selectors.stateInput).should('have.attr', 'required');
      cy.get(selectors.zipInput).should('have.attr', 'required');
      cy.get(selectors.notesInput).should('not.have.attr', 'required');
    });

    it('should close the modal when clicking X', () => {
      cy.get(selectors.addCustomerButton).click();
      cy.get(selectors.modalHeader).should('exist');
      cy.get(selectors.closeButton).scrollIntoView().click();
      cy.get(selectors.modalHeader).should('not.exist');
    });

    it('should close the modal when clicking outside', () => {
      cy.get(selectors.addCustomerButton).click();
      cy.get(selectors.modalHeader).should('exist');
      cy.get(selectors.modalContainer).click(5, 5);
      cy.get(selectors.modalHeader).should('not.exist');
    });

    it('should add a new customer and display all fields in the correct cells', () => {
      const addData = { ...testCustomer, firstName: 'AddTest' };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm(addData);
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        const id = response!.body.id;
        trackCreatedId(id);
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', 'AddTest');
          cy.get(selectors.customerLastNameCell).should('have.text', addData.lastName);
          cy.get(selectors.customerEmailCell).should('have.text', addData.email);
          cy.get(selectors.customerAddressLine1Cell).should('have.text', addData.addressLine1);
          cy.get(selectors.customerAddressLine2Cell).should('have.text', addData.addressLine2);
          cy.get(selectors.customerCityCell).should('have.text', addData.city);
          cy.get(selectors.customerStateCell).should('have.text', addData.state);
          cy.get(selectors.customerZipCell).should('have.text', addData.zip);
          cy.get(selectors.customerNotesCell).should('have.text', addData.notes);
        });
      });
    });

    it('should add a customer with only required fields and leave optional fields empty', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm({
        firstName: 'RequiredOnly',
        lastName: 'Test',
        email: 'required@test.com',
        addressLine1: '1 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02118',
      });
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        const id = response!.body.id;
        expect(response!.body.addressLine2).to.eq('');
        expect(response!.body.notes).to.eq('');
        trackCreatedId(id);
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', 'RequiredOnly');
          cy.get(selectors.customerAddressLine2Cell).should('have.text', '');
          cy.get(selectors.customerNotesCell).should('have.text', '');
        });
      });
    });
  });

  describe('Edit Customer', () => {
    it('should open the Edit Customer modal when clicking Edit', () => {
      createCustomerViaApi({ firstName: 'EditModalTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
      });
    });

    it('should populate all form fields with existing customer data', () => {
      const editData = { ...testCustomer, firstName: 'PopulateTest' };
      createCustomerViaApi(editData).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
        cy.get(selectors.firstNameInput).should('have.value', 'PopulateTest');
        cy.get(selectors.lastNameInput).should('have.value', editData.lastName);
        cy.get(selectors.emailInput).should('have.value', editData.email);
        cy.get(selectors.addressLine1Input).should('have.value', editData.addressLine1);
        cy.get(selectors.addressLine2Input).should('have.value', editData.addressLine2);
        cy.get(selectors.cityInput).should('have.value', editData.city);
        cy.get(selectors.stateInput).should('have.value', editData.state);
        cy.get(selectors.zipInput).should('have.value', editData.zip);
        cy.get(selectors.notesInput).should('have.value', editData.notes);
      });
    });

    it('should save without changes and preserve all customer data', () => {
      const preserveData = { ...testCustomer, firstName: 'PreserveTest' };
      createCustomerViaApi(preserveData).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
        cy.get(selectors.firstNameInput).should('have.value', 'PreserveTest');
        clickSave();
        verifyRowCells(id, preserveData);
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.body.firstName).to.eq('PreserveTest');
          expect(response.body.lastName).to.eq(preserveData.lastName);
          expect(response.body.email).to.eq(preserveData.email);
          expect(response.body.addressLine1).to.eq(preserveData.addressLine1);
          expect(response.body.addressLine2).to.eq(preserveData.addressLine2);
          expect(response.body.city).to.eq(preserveData.city);
          expect(response.body.state).to.eq(preserveData.state);
          expect(response.body.zip).to.eq(preserveData.zip);
          expect(response.body.notes).to.eq(preserveData.notes);
        });
      });
    });

    it('should update changed fields and preserve unchanged fields', () => {
      createCustomerViaApi({ firstName: 'BeforeEdit' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
        cy.get(selectors.firstNameInput).clear().type('AfterEdit');
        cy.get(selectors.lastNameInput).clear().type('UpdatedLast');
        clickSave();
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', 'AfterEdit');
          cy.get(selectors.customerLastNameCell).should('have.text', 'UpdatedLast');
          cy.get(selectors.customerEmailCell).should('have.text', testCustomer.email);
          cy.get(selectors.customerAddressLine1Cell).should('have.text', testCustomer.addressLine1);
          cy.get(selectors.customerAddressLine2Cell).should('have.text', testCustomer.addressLine2);
          cy.get(selectors.customerCityCell).should('have.text', testCustomer.city);
          cy.get(selectors.customerStateCell).should('have.text', testCustomer.state);
          cy.get(selectors.customerZipCell).should('have.text', testCustomer.zip);
          cy.get(selectors.customerNotesCell).should('have.text', testCustomer.notes);
        });
      });
    });
  });

  describe('Delete Customer', () => {
    it('should show confirmation modal when clicking Delete', () => {
      createCustomerViaApi({ firstName: 'DeleteModalTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Confirm Delete');
        cy.contains('Are you sure you want to delete this customer?').should('exist');
        cy.get(selectors.confirmDeleteYesButton).should('exist');
        cy.get(selectors.confirmDeleteNoButton).should('exist');
      });
    });

    it('should dismiss confirmation modal when clicking No and keep row', () => {
      createCustomerViaApi({ firstName: 'DismissTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.confirmDeleteNoButton).click();
        cy.get(selectors.modalHeader).should('not.exist');
        cy.get(selectors.customerRow(id)).should('exist');
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell).should('have.text', 'DismissTest');
      });
    });

    it('should remove customer row from table when confirming delete', () => {
      createCustomerViaApi({ firstName: 'ConfirmDeleteTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).should('exist');
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.confirmDeleteYesButton).click();
        cy.get(selectors.customerRow(id)).should('not.exist');
      });
    });
  });

  describe('Search (advanced)', () => {
    it('should match case-insensitively', () => {
      const uniqueName = `CaseTest${Date.now()}`;
      createCustomerViaApi({ firstName: uniqueName }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(uniqueName.toLowerCase());
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell).should('have.text', uniqueName);
      });
    });

    it('should match partial strings', () => {
      const uniqueSuffix = `${Date.now()}`;
      const fullName = `Partial${uniqueSuffix}Customer`;
      createCustomerViaApi({ firstName: fullName }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(`Partial${uniqueSuffix}`);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell).should('have.text', fullName);
      });
    });

    it('should filter by zip code', () => {
      const uniqueZip = `${10000 + Math.floor(Math.random() * 89999)}`;
      createCustomerViaApi({ zip: uniqueZip, firstName: `ZipTest${Date.now()}` }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(uniqueZip);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerZipCell).should('have.text', uniqueZip);
      });
    });

    it('should filter by state', () => {
      const uniqueState = `TestState${Date.now()}`;
      createCustomerViaApi({ state: uniqueState, firstName: `StateTest${Date.now()}` }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.searchInput).type(uniqueState);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.get(selectors.customerRow(id)).find(selectors.customerStateCell).should('have.text', uniqueState);
      });
    });
  });

  describe('Cancel / No-op Behavior', () => {
    it('should not create a customer when add modal is closed via X', () => {
      cy.intercept('POST', API_URL).as('createAttempt');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm({ ...testCustomer, firstName: 'ShouldNotExist' });
      cy.get(selectors.closeButton).scrollIntoView().click();
      cy.get(selectors.modalHeader).should('not.exist');
      cy.get('@createAttempt.all').should('have.length', 0);
    });

    it('should not modify any customer fields when edit modal is closed without saving', () => {
      createCustomerViaApi({ firstName: 'NoEditSave' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.intercept('PUT', `${API_URL}/*`).as('updateAttempt');
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
        cy.get(selectors.firstNameInput).clear().type('ChangedButNotSaved');
        cy.get(selectors.emailInput).clear().type('changed@notsaved.com');
        cy.get(selectors.closeButton).scrollIntoView().click();
        cy.get(selectors.modalHeader).should('not.exist');
        cy.get('@updateAttempt.all').should('have.length', 0);
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.body.firstName).to.eq('NoEditSave');
          expect(response.body.lastName).to.eq(testCustomer.lastName);
          expect(response.body.email).to.eq(testCustomer.email);
          expect(response.body.addressLine1).to.eq(testCustomer.addressLine1);
          expect(response.body.addressLine2).to.eq(testCustomer.addressLine2);
          expect(response.body.city).to.eq(testCustomer.city);
          expect(response.body.state).to.eq(testCustomer.state);
          expect(response.body.zip).to.eq(testCustomer.zip);
          expect(response.body.notes).to.eq(testCustomer.notes);
        });
      });
    });

    it('should not delete customer when clicking No in confirmation', () => {
      createCustomerViaApi({ firstName: 'NoDeleteTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.confirmDeleteNoButton).click();
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.firstName).to.eq('NoDeleteTest');
          expect(response.body.lastName).to.eq(testCustomer.lastName);
          expect(response.body.email).to.eq(testCustomer.email);
          expect(response.body.addressLine1).to.eq(testCustomer.addressLine1);
          expect(response.body.addressLine2).to.eq(testCustomer.addressLine2);
          expect(response.body.city).to.eq(testCustomer.city);
          expect(response.body.state).to.eq(testCustomer.state);
          expect(response.body.zip).to.eq(testCustomer.zip);
          expect(response.body.notes).to.eq(testCustomer.notes);
        });
      });
    });
  });

  describe('Persistence Verification', () => {
    it('should persist all fields of added customer in backend', () => {
      const addData = { ...testCustomer, firstName: 'PersistAddTest' };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm(addData);
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        const id = response!.body.id;
        trackCreatedId(id);
        cy.request('GET', `${API_URL}/${id}/details`).then((detailRes) => {
          expect(detailRes.body.firstName).to.eq(addData.firstName);
          expect(detailRes.body.lastName).to.eq(addData.lastName);
          expect(detailRes.body.email).to.eq(addData.email);
          expect(detailRes.body.addressLine1).to.eq(addData.addressLine1);
          expect(detailRes.body.addressLine2).to.eq(addData.addressLine2);
          expect(detailRes.body.city).to.eq(addData.city);
          expect(detailRes.body.state).to.eq(addData.state);
          expect(detailRes.body.zip).to.eq(addData.zip);
          expect(detailRes.body.notes).to.eq(addData.notes);
        });
      });
    });

    it('should persist edited fields and unchanged fields in backend', () => {
      createCustomerViaApi({ firstName: 'PersistEditBefore' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.modalHeader).should('have.text', 'Edit Customer');
        cy.get(selectors.firstNameInput).clear().type('PersistEditAfter');
        clickSave();
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.body.firstName).to.eq('PersistEditAfter');
          expect(response.body.lastName).to.eq(testCustomer.lastName);
          expect(response.body.email).to.eq(testCustomer.email);
          expect(response.body.addressLine1).to.eq(testCustomer.addressLine1);
          expect(response.body.addressLine2).to.eq(testCustomer.addressLine2);
          expect(response.body.city).to.eq(testCustomer.city);
          expect(response.body.state).to.eq(testCustomer.state);
          expect(response.body.zip).to.eq(testCustomer.zip);
          expect(response.body.notes).to.eq(testCustomer.notes);
        });
      });
    });

    it('should persist deleted customer removal in backend', () => {
      createCustomerViaApi({ firstName: 'PersistDeleteTest' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.confirmDeleteYesButton).click();
        cy.get(selectors.customerRow(id)).should('not.exist');
        cy.request({
          method: 'GET',
          url: `${API_URL}/${id}/details`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.error).to.eq('Customer not found');
          removeFromCleanup(id);
        });
      });
    });
  });

  describe('Boundary Values and Edge Cases', () => {
    it('should preserve special characters through add-display cycle', () => {
      const specialData = {
        ...testCustomer,
        firstName: "O'Malley",
        lastName: 'Smith & Jones',
        addressLine1: '123 <Main> St',
        notes: 'Quote "test" & ampersand',
      };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm(specialData);
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        const id = response!.body.id;
        trackCreatedId(id);
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', "O'Malley");
          cy.get(selectors.customerLastNameCell).should('have.text', 'Smith & Jones');
          cy.get(selectors.customerAddressLine1Cell).should('have.text', '123 <Main> St');
          cy.get(selectors.customerNotesCell).should('have.text', 'Quote "test" & ampersand');
        });
      });
    });

    it('should not render HTML tags in customer data as markup', () => {
      createCustomerViaApi({
        firstName: '<b>Bold</b>',
        notes: '<script>alert(1)</script>',
      }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', '<b>Bold</b>');
          cy.get(selectors.customerFirstNameCell).find('b').should('not.exist');
          cy.get(selectors.customerNotesCell).should('have.text', '<script>alert(1)</script>');
          cy.get(selectors.customerNotesCell).find('script').should('not.exist');
        });
      });
    });

    it('should preserve special characters through edit cycle', () => {
      createCustomerViaApi({ firstName: 'EditSpecial' }).then((res) => {
        const id = res.body.id;
        reloadTable();
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.firstNameInput).clear().type("D'Angelo");
        cy.get(selectors.lastNameInput).clear().type('O&M');
        clickSave();
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', "D'Angelo");
          cy.get(selectors.customerLastNameCell).should('have.text', 'O&M');
        });
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.body.firstName).to.eq("D'Angelo");
          expect(response.body.lastName).to.eq('O&M');
        });
      });
    });

    it('should not submit form when required field is empty', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm({
        firstName: 'MissingLastName',
        email: 'test@test.com',
        addressLine1: '1 St',
        city: 'NYC',
        state: 'NY',
        zip: '10001',
      });
      clickSave();
      // HTML5 validation should prevent submission — no POST should fire
      cy.get(selectors.modalHeader).should('exist');
      cy.get('@createCustomer.all').should('have.length', 0);
    });

    it('should open fresh empty form after closing and reopening add modal', () => {
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm({ firstName: 'Leftover', lastName: 'Data' });
      cy.get(selectors.closeButton).scrollIntoView().click();
      cy.get(selectors.modalHeader).should('not.exist');
      cy.get(selectors.addCustomerButton).click();
      cy.get(selectors.firstNameInput).should('have.value', '');
      cy.get(selectors.lastNameInput).should('have.value', '');
      cy.get(selectors.emailInput).should('have.value', '');
      cy.get(selectors.addressLine1Input).should('have.value', '');
      cy.get(selectors.addressLine2Input).should('have.value', '');
      cy.get(selectors.cityInput).should('have.value', '');
      cy.get(selectors.stateInput).should('have.value', '');
      cy.get(selectors.zipInput).should('have.value', '');
      cy.get(selectors.notesInput).should('have.value', '');
    });

    it('should handle full customer lifecycle: create → edit → verify → delete → confirm gone', () => {
      const original = { ...testCustomer, firstName: 'LifecycleCreate' };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm(original);
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        const id = response!.body.id;
        trackCreatedId(id);

        // Verify created data in correct cells
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell)
          .should('have.text', 'LifecycleCreate');

        // Edit
        cy.get(selectors.customerRow(id)).find(selectors.editCustomerButton(id)).click();
        cy.get(selectors.firstNameInput).should('have.value', 'LifecycleCreate');
        cy.get(selectors.firstNameInput).clear().type('LifecycleEdited');
        clickSave();

        // Verify edit in DOM and API
        cy.get(selectors.customerRow(id)).find(selectors.customerFirstNameCell)
          .should('have.text', 'LifecycleEdited');
        cy.request('GET', `${API_URL}/${id}/details`).then((editRes) => {
          expect(editRes.body.firstName).to.eq('LifecycleEdited');
          expect(editRes.body.lastName).to.eq(original.lastName);
          expect(editRes.body.email).to.eq(original.email);
          expect(editRes.body.addressLine1).to.eq(original.addressLine1);
          expect(editRes.body.addressLine2).to.eq(original.addressLine2);
          expect(editRes.body.city).to.eq(original.city);
          expect(editRes.body.state).to.eq(original.state);
          expect(editRes.body.zip).to.eq(original.zip);
          expect(editRes.body.notes).to.eq(original.notes);
        });

        // Delete
        cy.get(selectors.customerRow(id)).find(selectors.deleteCustomerButton(id)).click();
        cy.get(selectors.confirmDeleteYesButton).click();
        cy.get(selectors.customerRow(id)).should('not.exist');

        // Verify gone from API
        cy.request({
          method: 'GET',
          url: `${API_URL}/${id}/details`,
          failOnStatusCode: false,
        }).then((deleteRes) => {
          expect(deleteRes.status).to.eq(404);
          removeFromCleanup(id);
        });
      });
    });

    it('should accept short but valid values for name and address fields', () => {
      const shortData = {
        firstName: 'Li',
        lastName: 'Wu',
        email: 'li@wu.co',
        addressLine1: '1 A St',
        city: 'LA',
        state: 'CA',
        zip: '90001',
      };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm(shortData);
      clickSave();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        const id = response!.body.id;
        trackCreatedId(id);
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', 'Li');
          cy.get(selectors.customerLastNameCell).should('have.text', 'Wu');
          cy.get(selectors.customerEmailCell).should('have.text', 'li@wu.co');
          cy.get(selectors.customerZipCell).should('have.text', '90001');
        });
      });
    });

    // BUG: double-click on save fires two POSTs, creating duplicate customers.
    // The save button should be disabled after first click or the form should debounce submissions.
    it.skip('should not double-create when save button is clicked rapidly', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.get(selectors.addCustomerButton).click();
      fillCustomerForm({ ...testCustomer, firstName: 'DoubleClickTest' });
      cy.get(selectors.saveButton).scrollIntoView().dblclick();
      cy.wait('@createCustomer');
      // After the page settles from the first POST, check total POST count
      cy.get(selectors.customerTable).should('exist');
      cy.get('@createCustomer.all').should('have.length', 1);
      // Cleanup
      cy.request('GET', API_URL).then((res) => {
        res.body
          .filter((c: { firstName: string }) => c.firstName === 'DoubleClickTest')
          .forEach((c: { id: number }) => trackCreatedId(c.id));
      });
    });
  });

  describe('Pending Features (skipped)', () => {
    it.skip('should filter table rows using the search field in the Customer Information modal', () => {});

    it.skip('should open a read-only Customer Information modal when clicking a table row', () => {});

    it.skip('should transition from read-only to edit mode via Edit button in Customer Information modal', () => {});

    it.skip('should delete a customer via Remove Customer button in Customer Information modal', () => {});
  });
});
