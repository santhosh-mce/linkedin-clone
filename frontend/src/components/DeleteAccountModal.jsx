// components/DeleteAccountModal.js
import React from 'react';
import Modal1 from './Modal1'; // Import a generic Modal component if you have one

const DeleteAccountModal = ({ isOpen, onClose, onDelete }) => {
	return (
		<Modal1 isOpen={isOpen} onClose={onClose}>
			<div className='p-4'>
				<h2 className='text-xl font-bold mb-4'>Are you sure?</h2>
				<p className='mb-4'>This action cannot be undone. Your account and all related data will be permanently deleted.</p>
				<div className='flex justify-end gap-4'>
					<button
						onClick={onClose}
						className='bg-gray-500 text-white py-2 px-4 rounded-full hover:bg-gray-600 transition duration-300'
					>
						Cancel
					</button>
					<button
						onClick={onDelete}
						className='bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition duration-300'
					>
						Delete
					</button>
				</div>
			</div>
		</Modal1>
	);
};

export default DeleteAccountModal;
