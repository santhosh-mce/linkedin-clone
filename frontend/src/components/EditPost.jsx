import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const EditPost = ({ post, onClose }) => {
  const [editContent, setEditContent] = useState(post.content);
  const [editImage, setEditImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image || '');

  const queryClient = useQueryClient();

  // Mutation for editing the post
  const { mutate: editPost, isLoading: isEditingPost } = useMutation({
    mutationFn: async (updatedPost) => {
      const formData = new FormData();
      formData.append('content', updatedPost.content);
      if (updatedPost.image) {
        formData.append('image', updatedPost.image);
      }

      const res = await axiosInstance.put(`/posts/edit/${post._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update post');
    },
  });

  const handleEditPost = (e) => {
    e.preventDefault();
    editPost({ content: editContent, image: editImage });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setEditImage(file);

    // Update image preview
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setImagePreview(fileURL);
    } else {
      setImagePreview('');
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
      <div className='bg-white p-4 rounded max-w-2xl'>
        <h3 className='text-lg font-semibold mb-2'>Edit Post</h3>
        <form onSubmit={handleEditPost}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className='w-full border border-gray-300 rounded mb-2 p-2'
            placeholder='Edit your post content here...'
          />
          <input type='file' onChange={handleFileChange} className='mb-2' />
          {imagePreview && (
            <img src={imagePreview} alt='Preview' className='w-full h-auto mb-2 rounded' />
          )}
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='mr-2 text-gray-500 hover:text-gray-700'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-1 rounded'
              disabled={isEditingPost}
            >
              {isEditingPost ? <Loader size={18} className='animate-spin' /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;
