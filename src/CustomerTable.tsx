import Button from "./Button";
import { useCustomerContext } from "./CustomerProvider";
import { useState, useEffect, useMemo } from "react";
import CustomerForm, { CustomerData } from "./CustomerForm";
import Modal from "./Modal";

function CustomerTable() {
  const { customerData } = useCustomerContext();
  const [editModalCustomerId, setEditModalCustomerId] = useState<number | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const closeEditModal = () => {
    setEditModalCustomerId(null);
    window.location.reload();
  };

  const confirmDelete = async () => {
    if (deleteCustomerId === null) return;
    try {
      await fetch(`/api/customers/${deleteCustomerId}`, { method: 'DELETE' });
      window.location.reload();
    } catch (e) {
      console.error("Failed to delete customer:", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
        json.forEach((element: CustomerData) => {
          customerData.push({
            firstName: element.firstName,
            lastName: element.lastName,
            email: element.email,
            addressLine1: element.addressLine1,
            addressLine2: element.addressLine2 ?? "",
            city: element.city,
            state: element.state,
            zip: element.zip,
            notes: element.notes ?? "",
            id: element.id
          })
        });
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((customer) =>
      Object.values(customer).some(
        (val) => val != null && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="table-container">
      {editModalCustomerId != null && (
        <Modal onClose={closeEditModal} editCustomer={editModalCustomerId}>
          <CustomerForm closeModal={closeEditModal} editCustomerId={editModalCustomerId} />
        </Modal>
      )}

      {deleteCustomerId !== null && (
        <div className="modal-container" onClick={() => setDeleteCustomerId(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Confirm Delete</div>
            <div className="modal-content">
              <p>Are you sure you want to delete this customer?</p>
              <div className="confirm-buttons">
                <Button label="Yes" onClick={confirmDelete} dataTestId="confirm-delete-yes" />
                <Button label="No" onClick={() => setDeleteCustomerId(null)} dataTestId="confirm-delete-no" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="search-input"
          className="search-input"
        />
      </div>

      <table className="customer-table" data-cy="table_customers">
        <thead>
          <tr className="header-row">
            <th className="header-cell">First Name</th>
            <th className="header-cell">Last Name</th>
            <th className="header-cell">Email</th>
            <th className="header-cell">Address Line 1</th>
            <th className="header-cell">Address Line 2</th>
            <th className="header-cell">City</th>
            <th className="header-cell">State</th>
            <th className="header-cell">Zip Code</th>
            <th className="header-cell">Notes</th>
            <th className="header-cell">Actions</th>
          </tr>
        </thead>
        <tbody className="table-body">
        {
        filteredData?.map((customer, index) => (
          <tr key={index} className="table-row">
            <td className="table-cell">{customer.firstName}</td>
            <td className="table-cell">{customer.lastName}</td>
            <td className="table-cell">{customer.email}</td>
            <td className="table-cell">{customer.addressLine1}</td>
            <td className="table-cell">{customer.addressLine2}</td>
            <td className="table-cell">{customer.city}</td>
            <td className="table-cell">{customer.state}</td>
            <td className="table-cell">{customer.zip}</td>
            <td className="table-cell">{customer.notes}</td>
            <td className="table-cell">
              <Button label="Edit" onClick={() => setEditModalCustomerId(customer.id ?? null)} dataTestId={`edit-customer-button-${customer.id}`}/>
              <Button label="Delete" onClick={() => { if (customer.id != null) setDeleteCustomerId(customer.id); }} dataTestId={`delete-customer-button-${customer.id}`}/>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  )
}

export default CustomerTable;
