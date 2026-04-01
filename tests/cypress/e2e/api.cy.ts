interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

describe('Customers API', () => {
  const API_URL = '/api/customers';

  const validCustomer = {
    firstName: 'John',
    lastName: 'Appleseed',
    email: 'johnappleseed@vistarmedia.com',
    addressLine1: '400 Market St',
    addressLine2: 'Suite 825',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19106',
    notes: 'This is a sample note.',
  };

  const createdIds: number[] = [];

  function createCustomer(data = validCustomer) {
    return cy.request('POST', API_URL, data).then((res) => {
      createdIds.push(res.body.id);
      return res;
    });
  }

  function removeFromCleanup(id: number) {
    const idx = createdIds.indexOf(id);
    if (idx > -1) createdIds.splice(idx, 1);
  }

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

  describe('GET /api/customers', () => {
    it('should return a list of customers including a created one', () => {
      createCustomer().then((createRes) => {
        cy.request('GET', API_URL).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
          const found = response.body.find((c: Customer) => c.id === createRes.body.id);
          expect(found).to.not.eq(undefined);
          expect(found.firstName).to.eq(validCustomer.firstName);
        });
      });
    });

    it('should return customers with expected fields', () => {
      createCustomer().then((createRes) => {
        cy.request('GET', API_URL).then((response) => {
          const customer = response.body.find((c: Customer) => c.id === createRes.body.id);
          expect(customer).to.have.property('id');
          expect(customer).to.have.property('firstName');
          expect(customer).to.have.property('lastName');
          expect(customer).to.have.property('email');
          expect(customer).to.have.property('addressLine1');
          expect(customer).to.have.property('city');
          expect(customer).to.have.property('state');
          expect(customer).to.have.property('zip');
        });
      });
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer and return it with an id', () => {
      createCustomer().then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body.firstName).to.eq(validCustomer.firstName);
        expect(response.body.lastName).to.eq(validCustomer.lastName);
        expect(response.body.email).to.eq(validCustomer.email);
        expect(response.body.addressLine1).to.eq(validCustomer.addressLine1);
        expect(response.body.addressLine2).to.eq(validCustomer.addressLine2);
        expect(response.body.city).to.eq(validCustomer.city);
        expect(response.body.state).to.eq(validCustomer.state);
        expect(response.body.zip).to.eq(validCustomer.zip);
        expect(response.body.notes).to.eq(validCustomer.notes);
      });
    });

    it('should default optional fields to empty string when omitted', () => {
      const requiredOnly = {
        firstName: validCustomer.firstName,
        lastName: validCustomer.lastName,
        email: validCustomer.email,
        addressLine1: validCustomer.addressLine1,
        city: validCustomer.city,
        state: validCustomer.state,
        zip: validCustomer.zip,
      };
      createCustomer(requiredOnly as typeof validCustomer).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.addressLine2).to.eq('');
        expect(response.body.notes).to.eq('');
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
      cy.request({
        method: 'POST',
        url: API_URL,
        body: { firstName: 'FailedValidationOnly' },
        failOnStatusCode: false,
      }).then(() => {
        cy.request('GET', API_URL).then((res) => {
          const found = res.body.find((c: Customer) => c.firstName === 'FailedValidationOnly');
          expect(found).to.eq(undefined);
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
    it('should return a single customer by id', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.id).to.eq(id);
          expect(response.body.firstName).to.eq(validCustomer.firstName);
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
    it('should update an existing customer', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        const updatedData = {
          ...validCustomer,
          firstName: 'Updated',
          lastName: 'Customer',
          email: 'updated@vistarmedia.com',
        };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.id).to.eq(id);
          expect(response.body.firstName).to.eq('Updated');
          expect(response.body.lastName).to.eq('Customer');
          expect(response.body.email).to.eq('updated@vistarmedia.com');
        });
      });
    });

    it('should persist updates when fetched again', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        const updatedData = { ...validCustomer, firstName: 'Persisted' };
        cy.request('PUT', `${API_URL}/${id}`, updatedData).then(() => {
          cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
            expect(response.body.firstName).to.eq('Persisted');
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
      createCustomer().then((createResponse) => {
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
      createCustomer().then((createResponse) => {
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

    it('should not modify customer data on failed validation', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        cy.request({
          method: 'PUT',
          url: `${API_URL}/${id}`,
          body: { firstName: 'Only' },
          failOnStatusCode: false,
        }).then(() => {
          cy.request('GET', `${API_URL}/${id}/details`).then((response) => {
            expect(response.body.firstName).to.eq(validCustomer.firstName);
            expect(response.body.email).to.eq(validCustomer.email);
          });
        });
      });
    });
  });

  describe('DELETE /api/customers/:customerId', () => {
    it('should delete an existing customer', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then((response) => {
          expect(response.status).to.eq(200);
          removeFromCleanup(id);
        });
      });
    });

    it('should no longer return deleted customer', () => {
      createCustomer().then((createResponse) => {
        const id = createResponse.body.id;
        cy.request('DELETE', `${API_URL}/${id}`).then(() => {
          removeFromCleanup(id);
          cy.request({
            method: 'GET',
            url: `${API_URL}/${id}/details`,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404);
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
              expect(response.body.firstName).to.eq('Keeper');
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

  describe('ID generation', () => {
    it('should assign unique IDs even after deletions', () => {
      createCustomer().then((first) => {
        const firstId = first.body.id;
        cy.request('DELETE', `${API_URL}/${firstId}`).then(() => {
          removeFromCleanup(firstId);
          createCustomer().then((second) => {
            expect(second.body.id).to.not.eq(firstId);
          });
        });
      });
    });
  });
});
