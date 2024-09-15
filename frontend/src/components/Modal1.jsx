// components/Modal.js
import React from 'react';
import ReactDOM from 'react-dom';

const Modal1 = ({ isOpen, onClose, children }) => {
	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className='bg-white p-6 rounded-lg shadow-lg'>
				<button
					className='absolute top-2 right-2 text-gray-500'
					onClick={onClose}
				>
					&times;
				</button>
				{children}
			</div>
		</div>,
		document.body
	);
};

export default Modal1;
