import { Customer, CustomerInput, validCustomer } from '../support/fixtures';
import { API_URL } from '../support/commands';

describe('Customers API', () => {
  beforeEach(() => {
    cy.resetData();
  });

  describe('CREATE — POST /api/customers', () => {
    it('should create a new customer and return it with an id', () => {
      cy.createCustomer(validCustomer).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.have.property('id');
        expect(res.body.id).to.be.a('number');
        cy.verifyCustomerApi(res.body, validCustomer);
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
      cy.createCustomer(requiredOnly as CustomerInput).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body.addressLine2).to.eq('');
        expect(res.body.notes).to.eq('');
        expect(res.body.firstName).to.eq(validCustomer.firstName);
        expect(res.body.email).to.eq(validCustomer.email);
      });
    });

    it('should return 400 when required fields are missing', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { firstName: 'Only' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('Missing required fields');
        expect(res.body.error).to.include('lastName');
        expect(res.body.error).to.include('email');
        expect(res.body.error).to.include('addressLine1');
        expect(res.body.error).to.include('city');
        expect(res.body.error).to.include('state');
        expect(res.body.error).to.include('zip');
      });
    });

    it('should return 400 when required fields are non-string types', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, firstName: 1, email: true },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('firstName');
        expect(res.body.error).to.include('email');
      });
    });

    it('should return 400 when required fields are empty strings', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, email: '', city: '' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('email');
        expect(res.body.error).to.include('city');
      });
    });

    it('should not create a customer on failed validation', () => {
      cy.listCustomers().then((beforeRes) => {
        const idsBefore = beforeRes.body.map((c: Customer) => c.id);
        cy.request({
          method: 'POST',
          url: API_URL,
          body: { firstName: 'FailedValidationOnly' },
          failOnStatusCode: false,
        }).then(() => {
          cy.listCustomers().then((afterRes) => {
            const idsAfter = afterRes.body.map((c: Customer) => c.id);
            expect(idsAfter).to.deep.eq(idsBefore);
          });
        });
      });
    });

    it('should reject whitespace-only required fields', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, firstName: '   ', email: '  ' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('firstName');
        expect(res.body.error).to.include('email');
      });
    });

    it('should reject completely empty body', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('firstName');
        expect(res.body.error).to.include('lastName');
        expect(res.body.error).to.include('email');
        expect(res.body.error).to.include('addressLine1');
        expect(res.body.error).to.include('city');
        expect(res.body.error).to.include('state');
        expect(res.body.error).to.include('zip');
      });
    });

    it('should return 400 when optional fields are non-string types', () => {
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { ...validCustomer, notes: { x: 1 }, addressLine2: 123 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error).to.include('notes');
        expect(res.body.error).to.include('addressLine2');
      });
    });

    it('should ignore extra unknown fields in POST body', () => {
      cy.createCustomer({
        ...validCustomer,
        admin: true,
        role: 'superuser',
        deleteAll: true,
      } as CustomerInput).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.not.have.property('admin');
        expect(res.body).to.not.have.property('role');
        expect(res.body).to.not.have.property('deleteAll');
        cy.verifyCustomerApi(res.body, validCustomer);
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
      cy.createCustomer(specialData).then((createRes) => {
        cy.getCustomer(createRes.body.id).then((res) => {
          expect(res.body.firstName).to.eq("O'Malley");
          expect(res.body.lastName).to.eq('Smith & Jones');
          expect(res.body.addressLine1).to.eq('123 <Main> St');
          expect(res.body.notes).to.eq('Quote "test" & ampersand');
        });
      });
    });

    it('should create two customers with identical data and assign different IDs', () => {
      cy.createCustomer(validCustomer).then((first) => {
        cy.createCustomer(validCustomer).then((second) => {
          expect(first.body.id).to.not.eq(second.body.id);
          cy.getCustomer(first.body.id).then((r) => expect(r.status).to.eq(200));
          cy.getCustomer(second.body.id).then((r) => expect(r.status).to.eq(200));
        });
      });
    });

    it('should assign unique monotonically increasing IDs even after deletions', () => {
      cy.createCustomer(validCustomer).then((first) => {
        const firstId = first.body.id;
        cy.request('DELETE', `${API_URL}/${firstId}`).then(() => {
          cy.createCustomer(validCustomer).then((second) => {
            expect(second.body.id).to.not.eq(firstId);
            expect(second.body.id).to.be.greaterThan(firstId);
          });
        });
      });
    });
  });

  describe('READ — GET /api/customers, GET /api/customers/:id/details', () => {
    it('should return a list of customers including a created one', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.listCustomers().then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body).to.be.an('array');
          const found = res.body.find((c: Customer) => c.id === createRes.body.id);
          expect(found).to.not.eq(undefined);
          cy.verifyCustomerApi(found as Customer, validCustomer);
        });
      });
    });

    it('should return customers with all expected fields', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.listCustomers().then((res) => {
          const customer = res.body.find((c: Customer) => c.id === createRes.body.id);
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

    it('should return a single customer with all fields', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.getCustomer(createRes.body.id).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.id).to.eq(createRes.body.id);
          cy.verifyCustomerApi(res.body, validCustomer);
        });
      });
    });

    it('should return 404 for a non-existent customer', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/99999/details`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.error).to.eq('Customer not found');
      });
    });

    it('should handle non-numeric customer ID gracefully', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/abc/details`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });

    it('should handle negative customer ID', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/-1/details`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });

    it('should handle ID 0', () => {
      cy.request({
        method: 'GET',
        url: `${API_URL}/0/details`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  describe('UPDATE — PUT /api/customers/:id', () => {
    it('should update an existing customer and return full updated object', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        const updatedData: CustomerInput = {
          ...validCustomer,
          firstName: 'Updated',
          lastName: 'Customer',
          email: 'updated@vistarmedia.com',
        };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.id).to.eq(id);
          cy.verifyCustomerApi(res.body, updatedData);
        });
      });
    });

    it('should persist all fields when fetched again', () => {
      const updatedData: CustomerInput = {
        ...validCustomer,
        firstName: 'Persisted',
        city: 'UpdatedCity',
      };
      cy.createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then(() => {
          cy.verifyCustomerApi(id, updatedData);
        });
      });
    });

    it('should return 404 when updating a non-existent customer', () => {
      cy.request({
        method: 'PUT',
        url: `${API_URL}/99999`,
        body: validCustomer,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.error).to.eq('Customer not found');
      });
    });

    it('should return 400 when updating with missing required fields', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${createRes.body.id}`,
          body: { firstName: 'Only' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.include('Missing required fields');
        });
      });
    });

    it('should return 400 when updating with non-string types', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${createRes.body.id}`,
          body: { ...validCustomer, firstName: 123, email: false },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.include('firstName');
          expect(res.body.error).to.include('email');
        });
      });
    });

    it('should return 400 when updating with non-string optional fields', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${createRes.body.id}`,
          body: { ...validCustomer, notes: ['array'], addressLine2: { nested: true } },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.include('notes');
          expect(res.body.error).to.include('addressLine2');
        });
      });
    });

    it('should not modify any customer data on failed validation', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { firstName: 'Only' },
          failOnStatusCode: false,
        }).then(() => {
          cy.verifyCustomerApi(id, validCustomer);
        });
      });
    });

    it('should return identical result when PUT is called twice with same data (idempotency)', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        const updatedData: CustomerInput = { ...validCustomer, firstName: 'Idempotent' };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then((first) => {
          cy.request('PUT', `${API_URL}/${id}`, updatedData).then((second) => {
            cy.verifyCustomerApi(first.body, updatedData);
            cy.verifyCustomerApi(second.body, updatedData);
            expect(first.body.id).to.eq(second.body.id);
          });
        });
      });
    });

    it('should reject PUT with whitespace-only required fields', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${createRes.body.id}`,
          body: { ...validCustomer, firstName: '   ' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.error).to.include('firstName');
        });
      });
    });
  });

  describe('DELETE — DELETE /api/customers/:id', () => {
    it('should delete an existing customer and return confirmation', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request('DELETE', `${API_URL}/${createRes.body.id}`).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body).to.have.property('message', 'Customer deleted');
        });
      });
    });

    it('should no longer return deleted customer', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        cy.request('DELETE', `${API_URL}/${createRes.body.id}`).then(() => {
          cy.request({
            method: 'GET',
            url: `${API_URL}/${createRes.body.id}/details`,
            failOnStatusCode: false,
          }).then((res) => {
            expect(res.status).to.eq(404);
            expect(res.body.error).to.eq('Customer not found');
          });
        });
      });
    });

    it('should return 404 when deleting a non-existent customer', () => {
      cy.request({
        method: 'DELETE',
        url: `${API_URL}/99999`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404);
        expect(res.body.error).to.eq('Customer not found');
      });
    });

    it('should not affect other customers when deleting one', () => {
      cy.createCustomer({ ...validCustomer, firstName: 'Keeper' }).then((keeperRes) => {
        cy.createCustomer({ ...validCustomer, firstName: 'ToRemove' }).then((removeRes) => {
          cy.request('DELETE', `${API_URL}/${removeRes.body.id}`).then(() => {
            cy.getCustomer(keeperRes.body.id).then((res) => {
              expect(res.status).to.eq(200);
              cy.verifyCustomerApi(res.body, { ...validCustomer, firstName: 'Keeper' });
            });
            cy.request({
              method: 'GET',
              url: `${API_URL}/${removeRes.body.id}/details`,
              failOnStatusCode: false,
            }).then((res) => {
              expect(res.status).to.eq(404);
            });
          });
        });
      });
    });

    it('should return 404 when deleting an already-deleted customer', () => {
      cy.createCustomer(validCustomer).then((createRes) => {
        const id = createRes.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then(() => {
          cy.request({
            method: 'DELETE',
            url: `${API_URL}/${id}`,
            failOnStatusCode: false,
          }).then((res) => {
            expect(res.status).to.eq(404);
            expect(res.body.error).to.eq('Customer not found');
          });
        });
      });
    });
  });
});
