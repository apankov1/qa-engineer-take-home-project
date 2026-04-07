import { CustomerPage } from '../../pages/CustomerPage';
import { CustomerApi } from '../../api/customerApi';
import { buildCustomer } from '../../support/factories';

const customerPage = new CustomerPage();
const customerApi = new CustomerApi();

describe('Customers UI', () => {
  beforeEach(() => {
    customerPage.navigateToCustomers();
  });

  describe('Create Customers', () => {
    it('adds a new customer through the modal form', () => {
      const customer = buildCustomer();

      customerPage.addCustomer(customer);

      customerPage.waitForTable();
      customerPage.searchCustomers(customer.email);
      customerPage.verifyCustomerCount(1);
      customerPage.verifyCustomer(customer.email, customer);
    });
  });

  describe('Read Customers', () => {
    it('displays first seed customer in the table', () => {
      cy.fixture('customers').then((data) => {
        const seed = data.seed[0];
        customerPage.verifyCustomer(seed.firstName, seed);
      });
    });

    it('displays a customer created via API', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then(() => {
        customerPage.reload();
        customerPage.verifyCustomer(customer.email, customer);
      });
    });
  });

  describe('Update Customers', () => {
    it('edits a customer created via API', () => {
      const customer = buildCustomer();
      const editedCustomer = buildCustomer();

      customerApi.createCustomer(customer).then(() => {
        customerPage.reload();

        customerPage.editCustomer(customer.email, {
          lastName: editedCustomer.lastName,
          email: editedCustomer.email,
        });

        customerPage.waitForTable();
        customerPage.verifyCustomer(editedCustomer.email, {
          firstName: customer.firstName,
          lastName: editedCustomer.lastName,
          email: editedCustomer.email,
        });
      });
    });

    it('edits a customer added via UI', () => {
      const customer = buildCustomer();
      const editedCustomer = buildCustomer();

      customerPage.addCustomer(customer);
      customerPage.waitForTable();

      customerPage.editCustomer(customer.email, {
        lastName: editedCustomer.lastName,
        email: editedCustomer.email,
        city: editedCustomer.city,
        state: editedCustomer.state,
      });

      customerPage.waitForTable();
      customerPage.verifyCustomer(editedCustomer.email, {
        firstName: customer.firstName,
        lastName: editedCustomer.lastName,
        email: editedCustomer.email,
        city: editedCustomer.city,
        state: editedCustomer.state,
      });
    });
  });

  describe('Delete Customers', () => {
    it('deletes an existing customer', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then(() => {
        customerPage.reload();
        customerPage.deleteCustomer(customer.email);

        customerPage.waitForTable();
        customerPage.searchCustomers(customer.email);
        customerPage.verifyCustomerCount(0);
      });
    });
  });

  describe('Customer Life Cycle', () => {
    const customer = buildCustomer();
    const editedCustomer = buildCustomer();

    it('adds a new customer', () => {
      customerPage.addCustomer(customer);

      customerPage.waitForTable();
      customerPage.verifyCustomer(customer.email, customer);
    });

    it('searches for the customer', () => {
      customerPage.searchCustomers(customer.email);
      customerPage.verifyCustomerCount(1);
      customerPage.verifyCustomer(customer.email, customer);
    });

    it('edits the customer', () => {
      const updates = {
        lastName: editedCustomer.lastName,
        email: editedCustomer.email,
        city: editedCustomer.city,
        state: editedCustomer.state,
      };

      customerPage.editCustomer(customer.email, updates);

      customerPage.waitForTable();
      customerPage.verifyCustomer(editedCustomer.email, {
        firstName: customer.firstName,
        ...updates,
      });
    });

    it('deletes the customer', () => {
      customerPage.deleteCustomer(editedCustomer.email);

      customerPage.waitForTable();
      customerPage.searchCustomers(editedCustomer.email);
      customerPage.verifyCustomerCount(0);
    });
  });
});
