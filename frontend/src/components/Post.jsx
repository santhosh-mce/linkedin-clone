import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { Loader, MessageCircle, Send, Share2, ThumbsUp, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import PostAction from './PostAction';
import EditPost from './EditPost';

const Post = ({ post }) => {
  const { postId } = useParams();
  const { data: authUser } = useQuery({ queryKey: ['authUser'] });
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [popupImage, setPopupImage] = useState('');
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const queryClient = useQueryClient();

  const isOwner = authUser?._id === post.author._id;
  const isLiked = post.likes.includes(authUser?._id);

  const { mutate: deletePost, isLoading: isDeletingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/posts/delete/${post._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    },
  });

  const { mutate: createComment, isLoading: isAddingComment } = useMutation({
    mutationFn: async (newComment) => {
      await axiosInstance.post(`/posts/${post._id}/comment`, { content: newComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Comment added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    },
  });

  const { mutate: likePost, isLoading: isLikingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/posts/${post._id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to like post');
    },
  });

  const handleDeletePost = () => {
    setIsConfirmDeleteOpen(true); // Open the confirmation dialog
  };

  const confirmDeletePost = () => {
    deletePost();
    setIsConfirmDeleteOpen(false); // Close the confirmation dialog
  };

  const cancelDeletePost = () => {
    setIsConfirmDeleteOpen(false); // Close the confirmation dialog
  };

  const handleLikePost = () => {
    if (isLikingPost) return;
    likePost();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment(newComment);
      setNewComment('');
      setComments([
        ...comments,
        {
          content: newComment,
          user: {
            _id: authUser._id,
            name: authUser.name,
            profilePicture: authUser.profilePicture,
          },
          createdAt: new Date(),
        },
      ]);
    }
  };

  const openImagePopup = (imageUrl) => {
    setPopupImage(imageUrl);
    setIsImagePopupOpen(true);
  };

  const closeImagePopup = () => {
    setIsImagePopupOpen(false);
    setPopupImage('');
  };

  const openEditPopup = () => {
    setIsEditPopupOpen(true);
  };

  const closeEditPopup = () => {
    setIsEditPopupOpen(false);
  };

  return (
    <div className='bg-secondary rounded-lg shadow mb-4'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center'>
            <Link to={`/profile/${post?.author?.username}`}>
              <img
                src={post.author.profilePicture || '/avatar.png'}
                alt={post.author.name}
                className='size-10 rounded-full mr-3'
              />
            </Link>

            <div>
              <Link to={`/profile/${post?.author?.username}`}>
                <h3 className='font-semibold'>{post.author.name}</h3>
              </Link>
              <p className='text-xs text-info'>{post.author.headline}</p>
              <p className='text-xs text-info'>
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isOwner && (
            <div className='flex items-center gap-5 flex-row-reverse'>
              <button onClick={handleDeletePost} className='text-red-500 hover:text-red-700'>
                {isDeletingPost ? <Loader size={18} className='animate-spin' /> : <Trash2 size={18} />}
              </button>
              <button onClick={openEditPopup} className='text-blue-500 hover:text-blue-700'>
                <p>Edit</p>
              </button>
            </div>
          )}
        </div>
        <p className='mb-4'>{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt='Post content'
            className='rounded-lg w-full mb-4 cursor-pointer'
            onClick={() => openImagePopup(post.image)}
          />
        )}

        <div className='flex justify-between text-info'>
          <PostAction
            icon={<ThumbsUp size={18} className={isLiked ? 'text-blue-500 fill-blue-300' : ''} />}
            text={`Like (${post.likes.length})`}
            onClick={handleLikePost}
          />
          <PostAction
            icon={<MessageCircle size={18} />}
            text={`Comment (${comments.length})`}
            onClick={() => setShowComments(!showComments)}
          />
          <PostAction icon={<Share2 size={18} />} text='Share' />
        </div>
      </div>

      {showComments && (
        <div className='px-4 pb-4'>
          <div className='mb-4 max-h-60 overflow-y-auto'>
            {comments.map((comment) => (
              <div key={comment._id} className='mb-2 bg-base-100 p-2 rounded flex items-start'>
                <img
                  src={comment.user.profilePicture || '/avatar.png'}
                  alt={comment.user.name}
                  className='size-6 rounded-full mr-2'
                />
                <div>
                  <p className='font-semibold'>{comment.user.name}</p>
                  <p className='text-sm'>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className='flex'>
            <input
              type='text'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Add a comment...'
              className='flex-1 border border-gray-300 rounded-l px-2 py-1'
            />
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-1 rounded-r'
              disabled={isAddingComment}
            >
              {isAddingComment ? <Loader size={18} className='animate-spin' /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}

      {isImagePopupOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50'>
          <div className='bg-white p-4 rounded-lg relative'>
            <div className=''>
              <img src={popupImage} alt='Popup' className='lg:max-w-4xl md:max-w-xl sm:max-w-md max-h-full' />

            </div>
            <button
              onClick={closeImagePopup}
              className='absolute -top-2 right-0 text-stone-900 text-3xl sm:text-lg md:text-3xl lg:text-4xl'
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {isEditPopupOpen && (
        <EditPost post={post} onClose={closeEditPopup} />
      )}

      {isConfirmDeleteOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded shadow-lg'>
            <p className='text-lg font-semibold mb-4'>Are you sure you want to delete this post?</p>
            <div className='flex justify-end gap-4'>
              <button onClick={cancelDeletePost} className='px-4 py-2 bg-gray-300 rounded'>
                Cancel
              </button>
              <button onClick={confirmDeletePost} className='px-4 py-2 bg-red-500 text-white rounded'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
