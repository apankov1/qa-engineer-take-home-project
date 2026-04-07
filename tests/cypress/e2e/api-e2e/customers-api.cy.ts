import { CustomerPage } from '../../pages/CustomerPage';
import { CustomerApi } from '../../api/customerApi';
import { CustomerResponse } from '../../types/customer';
import { buildCustomer } from '../../support/factories';

const customerPage = new CustomerPage();
const customerApi = new CustomerApi();

describe('Customers API', () => {
  describe('Create Customers', () => {
    it('creates a new customer via API', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then((response) => {
        expect(response.status).to.equal(201);
        expect(response.body).to.include(customer);
        expect(response.body.id).to.be.a('number');
      });
    });

    it('rejects a customer with a duplicate email', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then(() => {
        const duplicate = buildCustomer({ email: customer.email });

        cy.request({
          method: 'POST',
          url: '/api/customers',
          body: duplicate,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.equal(409);
        });
      });
    });

    it('retrieves a customer added via UI', () => {
      const customer = buildCustomer();

      customerPage.navigateToCustomers();
      customerPage.addCustomer(customer);

      customerPage.waitForTable();

      customerApi.getAllCustomers().then((response) => {
        const found = (response.body as CustomerResponse[]).find((c) => c.email === customer.email);
        expect(found).to.include(customer);
      });
    });
  });

  describe('Read Customers', () => {
    it('retrieves all seed customers', () => {
      cy.fixture('customers').then((data) => {
        customerApi.getAllCustomers().then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body.length).to.be.at.least(data.seed.length);

          (data.seed as CustomerResponse[]).forEach((seed) => {
            const found = (response.body as CustomerResponse[]).find((c) => c.email === seed.email);
            expect(found).to.include(seed);
          });
        });
      });
    });

    it('retrieves a single customer by id', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then((createResponse) => {
        const id = (createResponse.body as CustomerResponse).id;

        customerApi.getCustomerById(id).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.include(customer);
        });
      });
    });

    it('retrieves a customer added via UI by id', () => {
      const customer = buildCustomer();

      customerPage.navigateToCustomers();
      customerPage.addCustomer(customer);

      customerPage.waitForTable();

      customerApi.getAllCustomers().then((response) => {
        const found = (response.body as CustomerResponse[]).find((c) => c.email === customer.email);
        expect(found).to.not.equal(undefined);

        customerApi.getCustomerById(found!.id).then((detailResponse) => {
          expect(detailResponse.status).to.equal(200);
          expect(detailResponse.body).to.include(customer);
        });
      });
    });

    it('returns 404 for a non-existent customer', () => {
      customerApi.getCustomerById(99999).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  });

  describe('Update Customers', () => {
    it('updates a customer created via API', () => {
      const customer = buildCustomer();
      const editedCustomer = buildCustomer();

      customerApi.createCustomer(customer).then((createResponse) => {
        const id = (createResponse.body as CustomerResponse).id;

        customerApi.updateCustomer(id, editedCustomer).then((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.include(editedCustomer);
        });
      });
    });

    it('updates a customer added via UI', () => {
      const customer = buildCustomer();
      const editedCustomer = buildCustomer();

      customerPage.navigateToCustomers();
      customerPage.addCustomer(customer);

      customerPage.waitForTable();

      customerApi.getAllCustomers().then((response) => {
        const found = (response.body as CustomerResponse[]).find((c) => c.email === customer.email);

        customerApi.updateCustomer(found!.id, editedCustomer).then((updateResponse) => {
          expect(updateResponse.status).to.equal(200);
          expect(updateResponse.body).to.include(editedCustomer);
        });
      });
    });

    it('returns 404 when updating a non-existent customer', () => {
      const editedCustomer = buildCustomer();

      customerApi.updateCustomer(99999, editedCustomer).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  });

  describe('Delete Customers', () => {
    it('deletes a customer created via API', () => {
      const customer = buildCustomer();

      customerApi.createCustomer(customer).then((createResponse) => {
        const id = (createResponse.body as CustomerResponse).id;

        customerApi.deleteCustomer(id).then((response) => {
          expect(response.status).to.equal(200);

          customerApi.getCustomerById(id).then((getResponse) => {
            expect(getResponse.status).to.equal(404);
          });
        });
      });
    });

    it('deletes a customer added via UI', () => {
      const customer = buildCustomer();

      customerPage.navigateToCustomers();
      customerPage.addCustomer(customer);

      customerPage.waitForTable();

      customerApi.getAllCustomers().then((response) => {
        const found = (response.body as CustomerResponse[]).find((c) => c.email === customer.email);

        customerApi.deleteCustomer(found!.id).then((deleteResponse) => {
          expect(deleteResponse.status).to.equal(200);

          customerApi.getCustomerById(found!.id).then((getResponse) => {
            expect(getResponse.status).to.equal(404);
          });
        });
      });
    });

    it('returns 404 when deleting a non-existent customer', () => {
      customerApi.deleteCustomer(99999).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  });
});
