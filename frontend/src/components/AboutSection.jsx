import { useState } from "react";

const AboutSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [about, setAbout] = useState(userData.about || "");

	const handleSave = () => {
		setIsEditing(false);
		onSave({ about });
	};

	return (
		<div className='bg-white shadow rounded-lg p-6 mb-6'>
			<h2 className='text-xl font-semibold mb-4'>About</h2>
			<textarea
				value={about}
				onChange={(e) => setAbout(e.target.value)}
				className={`w-full p-2 rounded ${isEditing ? 'border' : 'border-hidden'}`}
				rows='4'
				disabled={!isEditing} // Disable textarea when not editing
			/>


			{isOwnProfile && (
				<div className='mt-2'>
					{isEditing ? (
						<button
							onClick={handleSave}
							className='bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300'
							aria-label='Save changes'
						>
							Save
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className='text-primary hover:text-primary-dark transition duration-300'
							aria-label='Edit about section'
						>
							Edit
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default AboutSection;
