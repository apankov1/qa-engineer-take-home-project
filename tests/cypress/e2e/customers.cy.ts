describe('Customers Page', () => {
  const API_URL = '/api/customers';

  const testCustomer = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 4B',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19106',
    notes: 'Test customer',
  };

  const createdIds: number[] = [];

  function createCustomerViaApi(overrides: Partial<typeof testCustomer> = {}) {
    return cy.request('POST', API_URL, { ...testCustomer, ...overrides }).then((res) => {
      createdIds.push(res.body.id);
      return res;
    });
  }

  function fillCustomerForm(customer: Partial<typeof testCustomer>) {
    if (customer.firstName) cy.get('[data-testid="first-name"]').type(customer.firstName);
    if (customer.lastName) cy.get('[data-testid="last-name"]').type(customer.lastName);
    if (customer.email) cy.get('[data-testid="email"]').type(customer.email);
    if (customer.addressLine1) cy.get('[data-testid="address-line-1"]').type(customer.addressLine1);
    if (customer.addressLine2) cy.get('[data-testid="address-line-2"]').type(customer.addressLine2);
    if (customer.city) cy.get('[data-testid="city"]').type(customer.city);
    if (customer.state) cy.get('[data-testid="state"]').type(customer.state);
    if (customer.zip) cy.get('[data-testid="zip"]').type(customer.zip);
    if (customer.notes) cy.get('[data-testid="notes"]').type(customer.notes);
  }

  function clickSave() {
    cy.get('[data-testid="save-button"]').scrollIntoView().click();
  }

  function reloadTable() {
    cy.reload();
    cy.get('[data-cy="table_customers"]').should('exist');
  }

  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-cy="table_customers"]').should('exist');
  });

  afterEach(() => {
    createdIds.forEach((id) => {
      cy.request({
        method: 'DELETE',
        url: `${API_URL}/${id}`,
        failOnStatusCode: false,
      });
    });
    createdIds.length = 0;
  });

  describe('Page Load', () => {
    it('should display the page header', () => {
      cy.get('[data-cy="page_header"]').should('contain', 'Customer Management');
    });

    it('should display the customer table with headers', () => {
      cy.get('[data-cy="table_customers"]').should('be.visible');
      cy.get('.header-cell').should('have.length', 10);
    });

    it('should display the Add Customer button', () => {
      cy.get('[data-testid="add-customer-button"]').should('be.visible');
    });

    it('should display seed customers in the table', () => {
      cy.get('.table-row').should('have.length.at.least', 2);
    });
  });

  describe('Search', () => {
    it('should display the search input', () => {
      cy.get('[data-testid="search-input"]').should('be.visible');
    });

    it('should filter customers by first name', () => {
      createCustomerViaApi({ firstName: 'SearchNameTest' }).then(() => {
        reloadTable();
        cy.get('[data-testid="search-input"]').type('SearchNameTest');
        cy.get('.table-row').should('have.length', 1);
        cy.get('.table-row').first().should('contain', 'SearchNameTest');
      });
    });

    it('should filter customers by email', () => {
      createCustomerViaApi({ email: 'unique-search-test@test.com' }).then(() => {
        reloadTable();
        cy.get('[data-testid="search-input"]').type('unique-search-test@test.com');
        cy.get('.table-row').should('have.length', 1);
        cy.get('.table-row').first().should('contain', 'unique-search-test@test.com');
      });
    });

    it('should show no rows when search matches nothing', () => {
      cy.get('[data-testid="search-input"]').type('xyznonexistent123');
      cy.get('.table-row').should('have.length', 0);
    });

    it('should show all rows when search is cleared', () => {
      cy.get('.table-row').should('have.length.at.least', 1).then(($rows) => {
        const initialCount = $rows.length;
        cy.get('[data-testid="search-input"]').type('xyznonexistent123');
        cy.get('.table-row').should('have.length', 0);
        cy.get('[data-testid="search-input"]').clear();
        cy.get('.table-row').should('have.length', initialCount);
      });
    });
  });

  describe('Add Customer', () => {
    it('should open the Add Customer modal', () => {
      cy.get('[data-testid="add-customer-button"]').click();
      cy.get('.modal-header').should('contain', 'Add Customer');
    });

    it('should display all form fields', () => {
      cy.get('[data-testid="add-customer-button"]').click();
      cy.get('[data-testid="first-name"]').should('exist');
      cy.get('[data-testid="last-name"]').should('exist');
      cy.get('[data-testid="email"]').should('exist');
      cy.get('[data-testid="address-line-1"]').should('exist');
      cy.get('[data-testid="address-line-2"]').should('exist');
      cy.get('[data-testid="city"]').should('exist');
      cy.get('[data-testid="state"]').should('exist');
      cy.get('[data-testid="zip"]').should('exist');
      cy.get('[data-testid="notes"]').should('exist');
    });

    it('should close the modal when clicking X', () => {
      cy.get('[data-testid="add-customer-button"]').click();
      cy.get('.modal-header').should('exist');
      cy.get('.close-button').scrollIntoView().click();
      cy.get('.modal-header').should('not.exist');
    });

    it('should close the modal when clicking outside', () => {
      cy.get('[data-testid="add-customer-button"]').click();
      cy.get('.modal-header').should('exist');
      cy.get('.modal-container').click(5, 5);
      cy.get('.modal-header').should('not.exist');
    });

    it('should add a new customer and display it in the table', () => {
      cy.get('[data-testid="add-customer-button"]').click();
      fillCustomerForm({ ...testCustomer, firstName: 'AddTest' });
      clickSave();
      cy.get('[data-cy="table_customers"]').should('contain', 'AddTest');
      cy.get('[data-cy="table_customers"]').should('contain', testCustomer.lastName);
      cy.get('[data-cy="table_customers"]').should('contain', testCustomer.email);
      // Track UI-created customer for cleanup
      cy.request('GET', API_URL).then((res) => {
        const created = res.body.find((c: { id: number; firstName: string }) => c.firstName === 'AddTest');
        if (created) createdIds.push(created.id);
      });
    });

    it('should add a customer with only required fields', () => {
      cy.get('[data-testid="add-customer-button"]').click();
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
      cy.get('[data-cy="table_customers"]').should('contain', 'RequiredOnly');
      cy.request('GET', API_URL).then((res) => {
        const created = res.body.find((c: { id: number; firstName: string }) => c.firstName === 'RequiredOnly');
        if (created) createdIds.push(created.id);
      });
    });
  });

  describe('Edit Customer', () => {
    it('should open the Edit Customer modal when clicking Edit', () => {
      createCustomerViaApi({ firstName: 'EditModalTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'EditModalTest')
          .find('[data-testid^="edit-customer-button-"]')
          .click();
        cy.get('.modal-header').should('contain', 'Edit Customer');
      });
    });

    it('should populate form fields with existing customer data', () => {
      createCustomerViaApi({ firstName: 'PopulateTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'PopulateTest')
          .find('[data-testid^="edit-customer-button-"]')
          .click();
        cy.get('.modal-header').should('contain', 'Edit Customer');
        cy.get('[data-testid="first-name"]').should('have.value', 'PopulateTest');
        cy.get('[data-testid="last-name"]').should('have.value', testCustomer.lastName);
        cy.get('[data-testid="email"]').should('have.value', testCustomer.email);
      });
    });

    it('should save without changes and preserve customer data', () => {
      createCustomerViaApi({ firstName: 'PreserveTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'PreserveTest')
          .find('[data-testid^="edit-customer-button-"]')
          .click();
        cy.get('.modal-header').should('contain', 'Edit Customer');
        cy.get('[data-testid="first-name"]').should('have.value', 'PreserveTest');
        clickSave();
        cy.contains('.table-row', 'PreserveTest').should('exist');
      });
    });

    it('should update a customer and reflect changes in the table', () => {
      createCustomerViaApi({ firstName: 'BeforeEdit' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'BeforeEdit')
          .find('[data-testid^="edit-customer-button-"]')
          .click();
        cy.get('.modal-header').should('contain', 'Edit Customer');
        cy.get('[data-testid="first-name"]').clear().type('AfterEdit');
        cy.get('[data-testid="last-name"]').clear().type('UpdatedLast');
        clickSave();
        cy.get('[data-cy="table_customers"]').should('contain', 'AfterEdit');
        cy.get('[data-cy="table_customers"]').should('contain', 'UpdatedLast');
        cy.get('[data-cy="table_customers"]').should('not.contain', 'BeforeEdit');
      });
    });
  });

  describe('Delete Customer', () => {
    it('should show confirmation modal when clicking Delete', () => {
      createCustomerViaApi({ firstName: 'DeleteModalTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'DeleteModalTest')
          .find('[data-testid^="delete-customer-button-"]')
          .click();
        cy.get('.modal-header').should('contain', 'Confirm Delete');
        cy.contains('Are you sure you want to delete this customer?').should('exist');
      });
    });

    it('should dismiss confirmation modal when clicking No', () => {
      createCustomerViaApi({ firstName: 'DismissTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'DismissTest')
          .find('[data-testid^="delete-customer-button-"]')
          .click();
        cy.get('[data-testid="confirm-delete-no"]').click();
        cy.get('.modal-header').should('not.exist');
        cy.contains('.table-row', 'DismissTest').should('exist');
      });
    });

    it('should remove customer from table when confirming delete', () => {
      createCustomerViaApi({ firstName: 'ConfirmDeleteTest' }).then(() => {
        reloadTable();
        cy.contains('.table-row', 'ConfirmDeleteTest')
          .find('[data-testid^="delete-customer-button-"]')
          .click();
        cy.get('[data-testid="confirm-delete-yes"]').click();
        cy.get('[data-cy="table_customers"]').should('not.contain', 'ConfirmDeleteTest');
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
