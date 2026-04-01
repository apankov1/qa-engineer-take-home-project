import "./CustomerForm.css"
import { ButtonType } from "./Button";
import Button from "./Button";
import { ChangeEvent, useState, useEffect } from "react";

interface CustomerInputField {
 name: string,
 label: string,
 dataTestId: string,
 required: boolean
}

const customerInputFields: Array<CustomerInputField> = [
  { name: "firstName", label: "First Name", dataTestId: "first-name", required: true},
  { name: "lastName", label: "Last Name", dataTestId: "last-name" , required: true},
  { name: "email", label: "Email", dataTestId: "email" , required: true},
  {
    name: "addressLine1",
    label: "Address Line 1",
    dataTestId: "address-line-1",
    required: true
  },
  {
    name: "addressLine2",
    label: "Address Line 2",
    dataTestId: "address-line-2",
    required: false
  },
  { name: "city", label: "City", dataTestId: "city" , required: true},
  { name: "state", label: "State", dataTestId: "state" , required: true},
  { name: "zip", label: "Zip", dataTestId: "zip" , required: true},
  { name: "notes", label: "Notes", dataTestId: "notes", required: false },
];


export interface CustomerData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
}

const defaultCustomerData: CustomerData = {
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
}

interface CustomerFormProps {
  closeModal: () => void;
  editCustomerId?: number;
}

const CustomerForm = ({ closeModal, editCustomerId }: CustomerFormProps) => {
  const [customerData, setCustomerData] = useState<CustomerData>(defaultCustomerData);
  const [loading, setLoading] = useState(!!editCustomerId);

  useEffect(() => {
    if (editCustomerId) {
      const fetchCustomer = async () => {
        try {
          const response = await fetch(`/api/customers/${editCustomerId}/details`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const json = await response.json();
          setCustomerData({
            firstName: json.firstName,
            lastName: json.lastName,
            email: json.email,
            addressLine1: json.addressLine1,
            addressLine2: json.addressLine2 ?? "",
            city: json.city,
            state: json.state,
            zip: json.zip,
            notes: json.notes ?? "",
          });
        } catch (e) {
          console.error("Failed to fetch customer:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [editCustomerId]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editCustomerId
      ? `/api/customers/${editCustomerId}`
      : '/api/customers';
    const method = editCustomerId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      if (editCustomerId) {
        window.location.reload();
      } else {
        closeModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  function handleFieldUpdate(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCustomerData((prev: CustomerData) => ({
      ...prev,
      [name]: value,
    }));
  }

  if (loading) return <p>Loading...</p>;

  return (
      <form onSubmit={(e) => handleSaveCustomer(e)}>
          <div className="form-grid">
            {customerInputFields.map((input) => (
              <div className="form-group" key={input.name}>
                <label htmlFor={input.name}>{input.label}</label>
                <input
                  onChange={(e) => handleFieldUpdate(e)}
                  type="text"
                  name={input.name}
                  data-testid={input.dataTestId}
                  required={input.required}
                  value={customerData[input.name as keyof CustomerData]}
                />
              </div>
            ))}
            <Button className="modal-save-button" type={ButtonType.Submit} label="Save" dataTestId="save-button"/>
          </div>
        </form>
  )
}

export default CustomerForm;
