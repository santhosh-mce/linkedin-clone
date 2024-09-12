// components/Modal.js
import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, imageUrl }) => {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50'>
			<div className='relative'>
				<button
					onClick={onClose}
					className='absolute top-2 right-2 text-stone-900 p-1 rounded-full'
				>
					<X size={24} />
				</button>
				<img
					src={imageUrl}
					alt='Modal Content'
					className='max-w-screen-lg max-h-80'
				/>
			</div>
		</div>
	);
};

export default Modal;
