import { Customer, CustomerInput, validCustomer } from '../support/fixtures';
import { API_URL, createCustomer, removeFromCleanup, cleanupCreatedCustomers } from '../support/api';

describe('Customers API', () => {
  afterEach(() => {
    cleanupCreatedCustomers();
  });

  function expectCustomerToMatch(actual: Customer, expected: CustomerInput) {
    expect(actual.firstName).to.eq(expected.firstName);
    expect(actual.lastName).to.eq(expected.lastName);
    expect(actual.email).to.eq(expected.email);
    expect(actual.addressLine1).to.eq(expected.addressLine1);
    expect(actual.addressLine2).to.eq(expected.addressLine2 ?? '');
    expect(actual.city).to.eq(expected.city);
    expect(actual.state).to.eq(expected.state);
    expect(actual.zip).to.eq(expected.zip);
    expect(actual.notes).to.eq(expected.notes ?? '');
  }

  describe('GET /api/customers', () => {
    it('should return a list of customers including a created one', () => {
      createCustomer(validCustomer).then((createRes) => {
        cy.request('GET', API_URL).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
          const found = response.body.find((c: Customer) => c.id === createRes.body.id);
          expect(found).to.not.eq(undefined);
          expectCustomerToMatch(found, validCustomer);
        });
      });
    });

    it('should return customers with all expected fields', () => {
      createCustomer(validCustomer).then((createRes) => {
        cy.request('GET', API_URL).then((response) => {
          const customer = response.body.find((c: Customer) => c.id === createRes.body.id);
          expect(customer).to.have.property('id');
          expect(customer).to.have.property('firstName');
          expect(customer).to.have.property('lastName');
          expect(customer).to.have.property('email');
          expect(customer).to.have.property('addressLine1');
          expect(customer).to.have.property('addressLine2');
          expect(customer).to.have.property('city');
          expect(customer).to.have.property('state');
          expect(customer).to.have.property('zip');
          expect(customer).to.have.property('notes');
        });
      });
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer and return it with an id', () => {
      createCustomer(validCustomer).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body.id).to.be.a('number');
        expectCustomerToMatch(response.body, validCustomer);
      });
    });

    it('should default optional fields to empty string when omitted', () => {
      const requiredOnly: Partial<CustomerInput> = {
        firstName: validCustomer.firstName,
        lastName: validCustomer.lastName,
        email: validCustomer.email,
        addressLine1: validCustomer.addressLine1,
        city: validCustomer.city,
        state: validCustomer.state,
        zip: validCustomer.zip,
      };
      createCustomer(requiredOnly as CustomerInput).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.addressLine2).to.eq('');
        expect(response.body.notes).to.eq('');
        expect(response.body.firstName).to.eq(validCustomer.firstName);
        expect(response.body.email).to.eq(validCustomer.email);
      });
    });

    it('should return 400 when required fields are missing', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { firstName: 'Only' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('Missing required fields');
        expect(response.body.error).to.include('lastName');
        expect(response.body.error).to.include('email');
        expect(response.body.error).to.include('addressLine1');
        expect(response.body.error).to.include('city');
        expect(response.body.error).to.include('state');
        expect(response.body.error).to.include('zip');
      });
    });

    it('should return 400 when required fields are non-string types', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, firstName: 1, email: true },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('firstName');
        expect(response.body.error).to.include('email');
      });
    });

    it('should not create a customer on failed validation', () => {
      cy.request('GET', API_URL).then((beforeRes) => {
        const idsBefore = beforeRes.body.map((c: Customer) => c.id);
        cy.request({
          method: 'POST',
          url: API_URL,
          body: { firstName: 'FailedValidationOnly' },
          failOnStatusCode: false,
        }).then(() => {
          cy.request('GET', API_URL).then((afterRes) => {
            const idsAfter = afterRes.body.map((c: Customer) => c.id);
            expect(idsAfter).to.deep.eq(idsBefore);
          });
        });
      });
    });

    it('should return 400 when required fields are empty strings', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, email: '', city: '' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('email');
        expect(response.body.error).to.include('city');
      });
    });
  });

  describe('GET /api/customers/:customerId/details', () => {
    it('should return a single customer with all fields', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.id).to.eq(id);
          expectCustomerToMatch(response.body, validCustomer);
        });
      });
    });

    it('should return 404 for a non-existent customer', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/99999/details`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.error).to.eq('Customer not found');
      });
    });
  });

  describe('PUT /api/customers/:customerId', () => {
    it('should update an existing customer and return full updated object', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        const updatedData: CustomerInput = {
          ...validCustomer,
          firstName: 'Updated',
          lastName: 'Customer',
          email: 'updated@vistarmedia.com',
        };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.id).to.eq(id);
          expectCustomerToMatch(response.body, updatedData);
        });
      });
    });

    it('should persist all fields when fetched again', () => {
      const updatedData: CustomerInput = {
        ...validCustomer,
        firstName: 'Persisted',
        city: 'UpdatedCity',
      };
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then(() => {
          cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
            expectCustomerToMatch(response.body, updatedData);
          });
        });
      });
    });

    it('should return 404 when updating a non-existent customer', () => {
      cy.request({
        method: 'PUT',
        url: `${API_URL}/99999`,
        body: validCustomer,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.error).to.eq('Customer not found');
      });
    });

    it('should return 400 when updating with missing required fields', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { firstName: 'Only' },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.error).to.include('Missing required fields');
        });
      });
    });

    it('should return 400 when updating with non-string types', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { ...validCustomer, firstName: 123, email: false },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.error).to.include('firstName');
          expect(response.body.error).to.include('email');
        });
      });
    });

    it('should not modify any customer data on failed validation', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { firstName: 'Only' },
          failOnStatusCode: false,
        }).then(() => {
          cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
            expectCustomerToMatch(response.body, validCustomer);
          });
        });
      });
    });
  });

  describe('DELETE /api/customers/:customerId', () => {
    it('should delete an existing customer and return confirmation', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('message', 'Customer deleted');
          removeFromCleanup(id);
        });
      });
    });

    it('should no longer return deleted customer', () => {
      createCustomer(validCustomer).then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then(() => {
          removeFromCleanup(id);
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

    it('should return 404 when deleting a non-existent customer', () => {
      cy.request({
        method: 'DELETE',
        url: `${API_URL}/99999`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.error).to.eq('Customer not found');
      });
    });

    it('should not affect other customers when deleting one', () => {
      createCustomer({ ...validCustomer, firstName: 'Keeper' }).then((keeperRes) => {
        createCustomer({ ...validCustomer, firstName: 'ToRemove' }).then((removeRes) => {
          const removeId = removeRes.body.id;
          cy.request('DELETE', `${API_URL}/${removeId}`).then(() => {
            removeFromCleanup(removeId);
            cy.request('GET', `${API_URL}/${keeperRes.body.id}/details`).then((response) => {
              expect(response.status).to.eq(200);
              expectCustomerToMatch(response.body, { ...validCustomer, firstName: 'Keeper' });
            });
            cy.request({
              method: 'GET',
              url: `${API_URL}/${removeId}/details`,
              failOnStatusCode: false,
            }).then((response) => {
              expect(response.status).to.eq(404);
            });
          });
        });
      });
    });
  });

  describe('Boundary values and edge cases', () => {
    it('should reject whitespace-only required fields', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, firstName: '   ', email: '  ' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('firstName');
        expect(response.body.error).to.include('email');
      });
    });

    it('should reject completely empty body', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('firstName');
        expect(response.body.error).to.include('lastName');
        expect(response.body.error).to.include('email');
        expect(response.body.error).to.include('addressLine1');
        expect(response.body.error).to.include('city');
        expect(response.body.error).to.include('state');
        expect(response.body.error).to.include('zip');
      });
    });

    it('should handle non-numeric customer ID gracefully', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/abc/details`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('should handle negative customer ID', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/-1/details`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('should handle ID 0', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/0/details`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it('should ignore extra unknown fields in POST body', () => {
      createCustomer({
        ...validCustomer,
        admin: true,
        role: 'superuser',
        deleteAll: true,
      } as CustomerInput).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.not.have.property('admin');
        expect(response.body).to.not.have.property('role');
        expect(response.body).to.not.have.property('deleteAll');
        expectCustomerToMatch(response.body, validCustomer);
      });
    });

    it('should preserve special characters through create-read cycle', () => {
      const specialData: CustomerInput = {
        ...validCustomer,
        firstName: "O'Malley",
        lastName: 'Smith & Jones',
        addressLine1: '123 <Main> St',
        notes: 'Quote "test" & ampersand',
      };
      createCustomer(specialData).then((createRes) => {
        const id = createRes.body.id;
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.body.firstName).to.eq("O'Malley");
          expect(response.body.lastName).to.eq('Smith & Jones');
          expect(response.body.addressLine1).to.eq('123 <Main> St');
          expect(response.body.notes).to.eq('Quote "test" & ampersand');
        });
      });
    });

    it('should create two customers with identical data and assign different IDs', () => {
      createCustomer(validCustomer).then((first) => {
        createCustomer(validCustomer).then((second) => {
          expect(first.body.id).to.not.eq(second.body.id);
          cy.request('GET', `${API_URL}/${first.body.id}/details`).then((r) => {
            expect(r.status).to.eq(200);
          });
          cy.request('GET', `${API_URL}/${second.body.id}/details`).then((r) => {
            expect(r.status).to.eq(200);
          });
        });
      });
    });

    it('should return identical result when PUT is called twice with same data (idempotency)', () => {
      createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        const updatedData: CustomerInput = { ...validCustomer, firstName: 'Idempotent' };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then((first) => {
          cy.request('PUT', `${API_URL}/${id}`, updatedData).then((second) => {
            expectCustomerToMatch(first.body, updatedData);
            expectCustomerToMatch(second.body, updatedData);
            expect(first.body.id).to.eq(second.body.id);
          });
        });
      });
    });

    it('should return 404 when deleting an already-deleted customer', () => {
      createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then(() => {
          removeFromCleanup(id);
          cy.request({
            method: 'DELETE',
            url: `${API_URL}/${id}`,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body.error).to.eq('Customer not found');
          });
        });
      });
    });

    it('should reject PUT with whitespace-only required fields', () => {
      createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { ...validCustomer, firstName: '   ' },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.error).to.include('firstName');
        });
      });
    });
  });

  describe('ID generation', () => {
    it('should assign unique monotonically increasing IDs even after deletions', () => {
      createCustomer(validCustomer).then((first) => {
        const firstId = first.body.id;
        cy.request('DELETE', `${API_URL}/${firstId}`).then(() => {
          removeFromCleanup(firstId);
          createCustomer(validCustomer).then((second) => {
            expect(second.body.id).to.not.eq(firstId);
            expect(second.body.id).to.be.greaterThan(firstId);
          });
        });
      });
    });
  });
});
