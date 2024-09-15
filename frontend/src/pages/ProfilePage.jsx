// components/ProfilePage.js

import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import toast from "react-hot-toast";
import DeleteAccountModal from "../components/DeleteAccountModal"; // Import the DeleteAccountModal component
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
	const { username } = useParams();
	const queryClient = useQueryClient();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const navigate = useNavigate();

	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get("/auth/me");
				return res.data;
			} catch (err) {
				if (err.response && err.response.status === 401) {
					return null;
				}
				toast.error(err.response.data.message || "Something went wrong");
			}
		},
	});

	const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
		queryKey: ["userProfile", username],
		queryFn: () => axiosInstance.get(`/users/${username}`),
	});

	const { mutate: updateProfile } = useMutation({
		mutationFn: async (updatedData) => {
			await axiosInstance.put("/users/profile", updatedData);
		},
		onSuccess: () => {
			toast.success("Profile updated successfully");
			queryClient.invalidateQueries(["userProfile", username]);
		},
	});

	const { mutate: deleteAccount } = useMutation({
		mutationFn: async () => {
			if (!authUser?._id) {
				throw new Error("User ID is missing");
			}
			await axiosInstance.delete(`/auth/delete/${authUser._id}`);
		},
		onSuccess: () => {
			toast.success("Account deleted successfully");
			navigate("/login"); // Redirect to homepage after deletion
		},
		onError: (error) => {
			toast.error("Failed to delete account");
			console.error("Error deleting account:", error);
		},
	});

	if (isLoading || isUserProfileLoading) return null;

	const isOwnProfile = authUser.username === userProfile.data.username;
	const userData = isOwnProfile ? authUser : userProfile.data;

	const handleSave = (updatedData) => {
		updateProfile(updatedData);
	};

	const handleDeleteAccount = () => {
		try {
			deleteAccount();
			setShowDeleteModal(false);
		} catch (error) {
			console.error("Error deleting account:", error);
		}
	};

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />

			{isOwnProfile && (
				<div className='mt-6'>
					<button
						className='w-full bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition duration-300'
						onClick={() => setShowDeleteModal(true)}
					>
						Delete Account
					</button>
				</div>
			)}

			{/* Render the DeleteAccountModal */}
			<DeleteAccountModal 
				isOpen={showDeleteModal} 
				onClose={() => setShowDeleteModal(false)} 
				onDelete={handleDeleteAccount} 
			/>
		</div>
	);
};

export default ProfilePage;
