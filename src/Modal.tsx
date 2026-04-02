import "./Modal.css";
import React from 'react';

interface CustomerModalProps {
  onClose: () => void;
  children: React.ReactNode;
  editCustomer?: number;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ onClose, children, editCustomer }) => {
  return (
    <div className="modal-container" data-testid="modal-container" onClick={onClose}>
      <div
        className="modal-body"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close-button" data-testid="close-button" onClick={onClose}>X</div>
        <div className="modal-header" data-testid="modal-header">{editCustomer != null ? "Edit Customer" : "Add Customer"}</div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
