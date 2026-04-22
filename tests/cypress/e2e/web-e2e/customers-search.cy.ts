import { CustomerPage } from '../../pages/CustomerPage';
import { CustomerApi } from '../../api/customerApi';
import { buildCustomer } from '../../support/factories';

const customerPage = new CustomerPage();
const customerApi = new CustomerApi();

describe('Search Customers', () => {
  beforeEach(() => {
    customerPage.navigateToCustomers();
  });

  it('searches for a seeded customer', () => {
    cy.fixture('customers').then((data) => {
      const seed = data.seed[0];
      customerPage.searchCustomers(seed.email);
      customerPage.verifyCustomerCount(1);
      customerPage.verifyCustomer(seed.email, seed);
    });
  });

  it('searches for a customer added via UI', () => {
    const customer = buildCustomer();

    customerPage.addCustomer(customer);
    customerPage.waitForTable();

    customerPage.searchCustomers(customer.email);
    customerPage.verifyCustomerCount(1);
    customerPage.verifyCustomer(customer.email, customer);
  });

  it('searches for a customer added via API', () => {
    const customer = buildCustomer();

    customerApi.createCustomer(customer).then(() => {
      customerPage.reload();
      customerPage.searchCustomers(customer.email);
      customerPage.verifyCustomerCount(1);
      customerPage.verifyCustomer(customer.email, customer);
    });
  });

  describe('Search by Field', () => {
    const customer = buildCustomer();

    before(() => {
      customerApi.createCustomer(customer);
    });

    beforeEach(() => {
      customerPage.navigateToCustomers();
    });

    it('finds customer by first name', () => {
      customerPage.searchCustomers(customer.firstName);
      customerPage.verifyCustomer(customer.firstName, customer);
    });

    it('finds customer by last name', () => {
      customerPage.searchCustomers(customer.lastName);
      customerPage.verifyCustomer(customer.lastName, customer);
    });

    it('finds customer by email', () => {
      customerPage.searchCustomers(customer.email);
      customerPage.verifyCustomerCount(1);
      customerPage.verifyCustomer(customer.email, customer);
    });

    it('finds customer by address', () => {
      customerPage.searchCustomers(customer.addressLine1);
      customerPage.verifyCustomer(customer.addressLine1, customer);
    });

    it('finds customer by city', () => {
      customerPage.searchCustomers(customer.city);
      customerPage.verifyCustomer(customer.city, customer);
    });

    it('finds customer by state', () => {
      customerPage.searchCustomers(customer.state);
      customerPage.verifyCustomer(customer.state, customer);
    });

    it('finds customer by zip', () => {
      customerPage.searchCustomers(customer.zip);
      customerPage.verifyCustomer(customer.zip, customer);
    });
  });

  it('returns no results for a non-existent customer', () => {
    const customer = buildCustomer();
    customerPage.searchCustomers(customer.email);
    customerPage.verifyCustomerCount(0);
  });
});
