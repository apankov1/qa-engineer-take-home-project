import { testCustomer } from '../support/fixtures';
import { API_URL } from '../support/commands';
import { selectors } from '../support/selectors';

describe('Customers Page', () => {
  beforeEach(() => {
    cy.resetData();
    cy.visitCustomers();
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
      cy.createCustomer({ ...testCustomer, firstName: uniqueName }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(uniqueName);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { firstName: uniqueName });
      });
    });

    it('should filter customers by email', () => {
      const uniqueEmail = `search-${Date.now()}@test.com`;
      cy.createCustomer({ ...testCustomer, email: uniqueEmail }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(uniqueEmail);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { email: uniqueEmail });
      });
    });

    it('should show no rows when search matches nothing', () => {
      cy.searchCustomers('xyznonexistent123');
      cy.get(selectors.anyCustomerRow).should('have.length', 0);
    });

    it('should show all rows when search is cleared', () => {
      cy.get(selectors.anyCustomerRow).should('have.length.at.least', 1).then(($rows) => {
        const initialCount = $rows.length;
        cy.searchCustomers('xyznonexistent123');
        cy.get(selectors.anyCustomerRow).should('have.length', 0);
        cy.clearSearch();
        cy.get(selectors.anyCustomerRow).should('have.length', initialCount);
      });
    });
  });

  describe('Add Customer', () => {
    it('should open the Add Customer modal with empty form fields', () => {
      cy.openAddModal();
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
      cy.openAddModal();
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
      cy.openAddModal();
      cy.get(selectors.modalHeader).should('exist');
      cy.closeModal();
      cy.get(selectors.modalHeader).should('not.exist');
    });

    it('should close the modal when clicking outside', () => {
      cy.openAddModal();
      cy.get(selectors.modalHeader).should('exist');
      cy.get(selectors.modalContainer).click(5, 5);
      cy.get(selectors.modalHeader).should('not.exist');
    });

    it('should add a new customer and display all fields in the correct cells', () => {
      const addData = { ...testCustomer, firstName: 'AddTest' };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.openAddModal();
      cy.fillForm(addData);
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        cy.verifyRow(response!.body.id, addData);
      });
    });

    it('should add a customer with only required fields and leave optional fields empty', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.openAddModal();
      cy.fillForm({
        firstName: 'RequiredOnly',
        lastName: 'Test',
        email: 'required@test.com',
        addressLine1: '1 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02118',
      });
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        expect(response!.body.addressLine2).to.eq('');
        expect(response!.body.notes).to.eq('');
        cy.verifyRow(response!.body.id, { firstName: 'RequiredOnly', addressLine2: '', notes: '' });
      });
    });
  });

  describe('Edit Customer', () => {
    it('should open the Edit Customer modal when clicking Edit', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'EditModalTest' }).then((res) => {
        cy.reloadCustomers();
        cy.openEditModal(res.body.id);
      });
    });

    it('should populate all form fields with existing customer data', () => {
      const editData = { ...testCustomer, firstName: 'PopulateTest' };
      cy.createCustomer(editData).then((res) => {
        cy.reloadCustomers();
        cy.openEditModal(res.body.id);
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
      cy.createCustomer(preserveData).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openEditModal(id);
        cy.get(selectors.firstNameInput).should('have.value', 'PreserveTest');
        cy.saveForm();
        cy.verifyRow(id, preserveData);
        cy.verifyCustomerApi(id, preserveData);
      });
    });

    it('should clear an optional field and persist the blank value', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'ClearOptional', addressLine2: 'Suite 100', notes: 'Has notes' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openEditModal(id);
        cy.fillForm({ addressLine2: '', notes: '' });
        cy.saveForm();
        cy.verifyRow(id, { addressLine2: '', notes: '' });
        cy.verifyCustomerApi(id, { addressLine2: '', notes: '' });
      });
    });

    it('should update changed fields and preserve unchanged fields', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'BeforeEdit' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openEditModal(id);
        cy.fillForm({ firstName: 'AfterEdit', lastName: 'UpdatedLast' });
        cy.saveForm();
        cy.verifyRow(id, {
          firstName: 'AfterEdit',
          lastName: 'UpdatedLast',
          email: testCustomer.email,
          addressLine1: testCustomer.addressLine1,
          addressLine2: testCustomer.addressLine2,
          city: testCustomer.city,
          state: testCustomer.state,
          zip: testCustomer.zip,
          notes: testCustomer.notes,
        });
      });
    });
  });

  describe('Delete Customer', () => {
    it('should show confirmation modal when clicking Delete', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'DeleteModalTest' }).then((res) => {
        cy.reloadCustomers();
        cy.openDeleteModal(res.body.id);
        cy.get(selectors.modalHeader).should('have.text', 'Confirm Delete');
        cy.contains('Are you sure you want to delete this customer?').should('exist');
        cy.get(selectors.confirmDeleteYesButton).should('exist');
        cy.get(selectors.confirmDeleteNoButton).should('exist');
      });
    });

    it('should dismiss confirmation modal when clicking No and keep row', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'DismissTest' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openDeleteModal(id);
        cy.cancelDelete();
        cy.get(selectors.modalHeader).should('not.exist');
        cy.get(selectors.customerRow(id)).should('exist');
        cy.verifyRow(id, { firstName: 'DismissTest' });
      });
    });

    it('should remove customer row from table when confirming delete', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'ConfirmDeleteTest' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.get(selectors.customerRow(id)).should('exist');
        cy.openDeleteModal(id);
        cy.confirmDelete();
        cy.get(selectors.customerRow(id)).should('not.exist');
      });
    });
  });

  describe('Search (advanced)', () => {
    it('should match case-insensitively', () => {
      const uniqueName = `CaseTest${Date.now()}`;
      cy.createCustomer({ ...testCustomer, firstName: uniqueName }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(uniqueName.toLowerCase());
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { firstName: uniqueName });
      });
    });

    it('should match partial strings', () => {
      const uniqueSuffix = `${Date.now()}`;
      const fullName = `Partial${uniqueSuffix}Customer`;
      cy.createCustomer({ ...testCustomer, firstName: fullName }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(`Partial${uniqueSuffix}`);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { firstName: fullName });
      });
    });

    it('should filter by zip code', () => {
      const uniqueZip = `${10000 + Math.floor(Math.random() * 89999)}`;
      cy.createCustomer({ ...testCustomer, zip: uniqueZip, firstName: `ZipTest${Date.now()}` }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(uniqueZip);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { zip: uniqueZip });
      });
    });

    it('should filter by state', () => {
      const uniqueState = `TestState${Date.now()}`;
      cy.createCustomer({ ...testCustomer, state: uniqueState, firstName: `StateTest${Date.now()}` }).then((res) => {
        cy.reloadCustomers();
        cy.searchCustomers(uniqueState);
        cy.get(selectors.anyCustomerRow).should('have.length', 1);
        cy.verifyRow(res.body.id, { state: uniqueState });
      });
    });

    it('should show multiple rows when search matches more than one customer', () => {
      const sharedCity = `MultiMatch${Date.now()}`;
      cy.createCustomer({ ...testCustomer, city: sharedCity, firstName: 'MultiA' }).then((resA) => {
        cy.createCustomer({ ...testCustomer, city: sharedCity, firstName: 'MultiB' }).then((resB) => {
          cy.reloadCustomers();
          cy.searchCustomers(sharedCity);
          cy.get(selectors.anyCustomerRow).should('have.length', 2);
          cy.verifyRow(resA.body.id, { firstName: 'MultiA', city: sharedCity });
          cy.verifyRow(resB.body.id, { firstName: 'MultiB', city: sharedCity });
        });
      });
    });
  });

  describe('Cancel / No-op Behavior', () => {
    it('should not create a customer when add modal is closed via X', () => {
      cy.intercept('POST', API_URL).as('createAttempt');
      cy.openAddModal();
      cy.fillForm({ ...testCustomer, firstName: 'ShouldNotExist' });
      cy.closeModal();
      cy.get(selectors.modalHeader).should('not.exist');
      cy.get('@createAttempt.all').should('have.length', 0);
    });

    it('should not modify any customer fields when edit modal is closed without saving', () => {
      const expectedData = { ...testCustomer, firstName: 'NoEditSave' };
      cy.createCustomer(expectedData).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.intercept('PUT', `${API_URL}/*`).as('updateAttempt');
        cy.openEditModal(id);
        cy.fillForm({ firstName: 'ChangedButNotSaved', email: 'changed@notsaved.com' });
        cy.closeModal();
        cy.get(selectors.modalHeader).should('not.exist');
        cy.get('@updateAttempt.all').should('have.length', 0);
        cy.verifyCustomerApi(id, expectedData);
      });
    });

    it('should not delete customer when clicking No in confirmation', () => {
      const expectedData = { ...testCustomer, firstName: 'NoDeleteTest' };
      cy.createCustomer(expectedData).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openDeleteModal(id);
        cy.cancelDelete();
        cy.verifyCustomerApi(id, expectedData);
      });
    });
  });

  describe('Persistence Verification', () => {
    it('should persist all fields of added customer in backend', () => {
      const addData = { ...testCustomer, firstName: 'PersistAddTest' };
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.openAddModal();
      cy.fillForm(addData);
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        cy.verifyCustomerApi(response!.body.id, addData);
      });
    });

    it('should persist edited fields and unchanged fields in backend', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'PersistEditBefore' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openEditModal(id);
        cy.fillForm({ firstName: 'PersistEditAfter' });
        cy.saveForm();
        cy.verifyCustomerApi(id, { ...testCustomer, firstName: 'PersistEditAfter' });
      });
    });

    it('should persist deleted customer removal in backend', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'PersistDeleteTest' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openDeleteModal(id);
        cy.confirmDelete();
        cy.get(selectors.customerRow(id)).should('not.exist');
        cy.request({
          method: 'GET',
          url: `${API_URL}/${id}/details`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404);
          expect(response.body.error).to.eq('Customer not found');
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
      cy.openAddModal();
      cy.fillForm(specialData);
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        cy.verifyRow(response!.body.id, {
          firstName: "O'Malley",
          lastName: 'Smith & Jones',
          addressLine1: '123 <Main> St',
          notes: 'Quote "test" & ampersand',
        });
      });
    });

    it('should not render HTML tags in customer data as markup', () => {
      cy.createCustomer({
        ...testCustomer,
        firstName: '<b>Bold</b>',
        notes: '<script>alert(1)</script>',
      }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.get(selectors.customerRow(id)).within(() => {
          cy.get(selectors.customerFirstNameCell).should('have.text', '<b>Bold</b>');
          cy.get(selectors.customerFirstNameCell).find('b').should('not.exist');
          cy.get(selectors.customerNotesCell).should('have.text', '<script>alert(1)</script>');
          cy.get(selectors.customerNotesCell).find('script').should('not.exist');
        });
      });
    });

    it('should preserve special characters through edit cycle', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'EditSpecial' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.openEditModal(id);
        cy.fillForm({ firstName: "D'Angelo", lastName: 'O&M' });
        cy.saveForm();
        cy.verifyRow(id, { firstName: "D'Angelo", lastName: 'O&M' });
        cy.verifyCustomerApi(id, { firstName: "D'Angelo", lastName: 'O&M' });
      });
    });

    it('should not submit form when required field is empty', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.openAddModal();
      cy.fillForm({
        firstName: 'MissingLastName',
        email: 'test@test.com',
        addressLine1: '1 St',
        city: 'NYC',
        state: 'NY',
        zip: '10001',
      });
      cy.saveForm();
      // HTML5 validation should prevent submission — no POST should fire
      cy.get(selectors.modalHeader).should('exist');
      cy.get('@createCustomer.all').should('have.length', 0);
    });

    it('should open fresh empty form after closing and reopening add modal', () => {
      cy.openAddModal();
      cy.fillForm({ firstName: 'Leftover', lastName: 'Data' });
      cy.closeModal();
      cy.get(selectors.modalHeader).should('not.exist');
      cy.openAddModal();
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
      cy.openAddModal();
      cy.fillForm(original);
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        const id = response!.body.id;

        cy.verifyRow(id, { firstName: 'LifecycleCreate' });

        cy.openEditModal(id);
        cy.get(selectors.firstNameInput).should('have.value', 'LifecycleCreate');
        cy.fillForm({ firstName: 'LifecycleEdited' });
        cy.saveForm();

        cy.verifyRow(id, { firstName: 'LifecycleEdited' });
        cy.verifyCustomerApi(id, { ...original, firstName: 'LifecycleEdited' });

        cy.openDeleteModal(id);
        cy.confirmDelete();
        cy.get(selectors.customerRow(id)).should('not.exist');
        cy.request({
          method: 'GET',
          url: `${API_URL}/${id}/details`,
          failOnStatusCode: false,
        }).then((deleteRes) => {
          expect(deleteRes.status).to.eq(404);
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
      cy.openAddModal();
      cy.fillForm(shortData);
      cy.saveForm();
      cy.wait('@createCustomer').then(({ response }) => {
        expect(response!.statusCode).to.eq(201);
        cy.verifyRow(response!.body.id, { firstName: 'Li', lastName: 'Wu', email: 'li@wu.co', zip: '90001' });
      });
    });

    // BUG: double-click on save fires two POSTs, creating duplicate customers.
    // The save button should be disabled after first click or the form should debounce submissions.
    it.skip('should not double-create when save button is clicked rapidly', () => {
      cy.intercept('POST', API_URL).as('createCustomer');
      cy.openAddModal();
      cy.fillForm({ ...testCustomer, firstName: 'DoubleClickTest' });
      cy.get(selectors.saveButton).scrollIntoView().dblclick();
      cy.wait('@createCustomer');
      cy.get(selectors.customerTable).should('exist');
      cy.get('@createCustomer.all').should('have.length', 1);
    });
  });

  describe('Backend Failure Handling', () => {
    it('should keep modal open when add fails with server error', () => {
      cy.intercept('POST', API_URL, { statusCode: 500, body: { error: 'Internal server error' } }).as('failedCreate');
      cy.openAddModal();
      cy.fillForm(testCustomer);
      cy.saveForm();
      cy.wait('@failedCreate');
      cy.get(selectors.modalHeader).should('exist');
    });

    it('should keep modal open when edit fails with server error', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'EditFailTest' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.intercept('PUT', `${API_URL}/*`, { statusCode: 500, body: { error: 'Internal server error' } }).as('failedUpdate');
        cy.openEditModal(id);
        cy.fillForm({ firstName: 'ShouldNotPersist' });
        cy.saveForm();
        cy.wait('@failedUpdate');
        cy.get(selectors.modalHeader).should('exist');
        cy.verifyCustomerApi(id, { firstName: 'EditFailTest' });
      });
    });

    it('should keep row visible when delete fails with server error', () => {
      cy.createCustomer({ ...testCustomer, firstName: 'DeleteFailTest' }).then((res) => {
        const id = res.body.id;
        cy.reloadCustomers();
        cy.intercept('DELETE', `${API_URL}/*`, { statusCode: 500, body: { error: 'Internal server error' } }).as('failedDelete');
        cy.openDeleteModal(id);
        cy.confirmDelete();
        cy.wait('@failedDelete');
        cy.get(selectors.customerRow(id)).should('exist');
        cy.verifyCustomerApi(id, { firstName: 'DeleteFailTest' });
      });
    });

    it('should not add row to table when add returns 400 validation error', () => {
      cy.intercept('POST', API_URL, { statusCode: 400, body: { error: 'Missing required fields: lastName' } }).as('failedValidation');
      cy.get(selectors.anyCustomerRow).then(($rows) => {
        const countBefore = $rows.length;
        cy.openAddModal();
        cy.fillForm(testCustomer);
        cy.saveForm();
        cy.wait('@failedValidation');
        cy.get(selectors.anyCustomerRow).should('have.length', countBefore);
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
