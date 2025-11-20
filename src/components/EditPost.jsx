import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../clients.js'
import LoadingSpinner from './LoadingSpinner'
import './EditPost.css'

function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    comments: '',
    photos: '',
    travel_type: ''
  })

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('Travel')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setPost(data)
      setFormData({
        title: data.title || '',
        location: data.location || '',
        comments: data.comments || '',
        photos: data.photos || '',
        travel_type: data.travel_type || ''
      })
    } catch (error) {
      console.error('Error fetching post:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const updatePost = async (event) => {
    event.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title for your journey')
      return
    }

    setLoading(true)
    
    try {
      await supabase
        .from('Travel')
        .update({ 
          title: formData.title, 
          author: post.username,  
          description: formData.comments,
          location: formData.location,
          photos: formData.photos,
          travel_type: formData.travel_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      window.location = "/";
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Error updating post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const travelTypes = ['Adventure', 'Relaxation', 'Cultural', 'Business', 'Family', 'Solo', 'Question', 'Opinion']

  if (loading) return <LoadingSpinner />
  if (!post) return <div>Post not found</div>

  return (
    <div className="edit-post">
      <div className="edit-post-container">
        <h1>✏️ Edit Journey</h1>

        <form onSubmit={updatePost} className="edit-form">
          <div className="form-group">
            <label htmlFor="title">Journey Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Santorini, Greece"
            />
          </div>

          <div className="form-group">
            <label htmlFor="travel_type">Journey Type</label>
            <select
              id="travel_type"
              name="travel_type"
              value={formData.travel_type}
              onChange={handleInputChange}
            >
              <option value="">Select type (optional)</option>
              {travelTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comments">Story & Experience</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Share your travel experience, tips, or thoughts..."
              rows="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="photos">Photo URL</label>
            <input
              type="url"
              id="photos"
              name="photos"
              value={formData.photos}
              onChange={handleInputChange}
              placeholder="https://example.com/your-travel-photo.jpg"
            />
            {formData.photos && (
              <div className="photo-preview">
                <img src={formData.photos} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(`/post/${id}`)} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update Journey
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPost