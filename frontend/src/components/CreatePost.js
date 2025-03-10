import React, { useState } from 'react';
import axios from 'axios';

const CreatePost = () => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        author_id: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://kamanbo23-github-io.onrender.com/posts/create_post', formData);
            alert('Post created successfully!');
            setFormData({ title: '', content: '', author_id: '' });
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to create post');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px', margin: '0 auto' }}>
            <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
            />
            <textarea
                placeholder="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                style={{ margin: '10px 0', minHeight: '100px' }}
            />
            <input
                type="number"
                placeholder="Author ID"
                value={formData.author_id}
                onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                required
            />
            <button type="submit" style={{ padding: '10px', marginTop: '10px' }}>Create Post</button>
        </form>
    );
};

export default CreatePost;