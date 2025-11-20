import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../clients.js'
import LoadingSpinner from './LoadingSpinner'
import './CreatePost.css'

function CreatePost({ userId }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    comments: '',
    photos: '',
    travel_type: '',
    user_password: '',
    repost_id: ''
  })

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            // Using a reverse geocoding service (you might want to replace this with your preferred service)
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&limit=1`
            )
            const data = await response.json()
            if (data.results && data.results[0]) {
              const location = data.results[0].formatted
              setCurrentLocation(location)
              setFormData(prev => ({ ...prev, location: location }))
            }
          } catch {
            console.log('Could not get location name, using coordinates')
            setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
            setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }))
          }
        },
        () => {
          console.log('Location access denied or unavailable')
        }
      )
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const createPost = async (event) => {
    event.preventDefault();
    
    console.log('createPost function called'); // Debug log
    console.log('Form data:', formData); // Debug log
    console.log('User ID:', userId); // Debug log
    
    if (!formData.title.trim()) {
      alert('Please enter a title for your journey')
      return
    }

    if (!formData.user_password.trim()) {
      alert('Please set a secret key to manage this post later')
      return
    }

    setLoading(true)
    
    try {
      const postData = {
        title: formData.title,
        username: userId,
        user_password: formData.user_password,
        photos: formData.photos || '',
        location: formData.location,
        travel_type: formData.travel_type || '',
        comments: formData.comments,
        like: 0
      }

      console.log('Post data to insert:', postData); // Debug log

      // If reposting, fetch the original post
      if (formData.repost_id) {
        const { data: originalPost, error: fetchError } = await supabase
          .from('Travel')
          .select('*')
          .eq('id', formData.repost_id)
          .single()

        if (fetchError || !originalPost) {
          alert('Original post not found. Please check the Post ID.')
          setLoading(false)
          return
        }

        postData.description = `Repost of: "${originalPost.title}" by ${originalPost.username}\\n\\n${formData.comments}`
      }

      const result = await supabase
        .from('Travel')
        .insert([postData])
        .select();

      console.log('Insert result:', result); // Debug log
      
      if (result.error) {
        throw result.error;
      }

      alert('Post created successfully!');
      window.location = "/";
    } catch (error) {
      console.error('Error creating post:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      alert(`Error creating post: ${error.message || 'Unknown error'}. Check console for details.`)
    } finally {
      setLoading(false)
    }
  }

  const travelTypes = ['Adventure', 'Relaxation', 'Cultural', 'Business', 'Family', 'Solo', 'Question', 'Opinion']

  if (loading) return <LoadingSpinner />

  return (
    <div className="create-post">
      <div className="create-post-container">
        <h1>✈️ Share Your Journey</h1>
        
        {currentLocation && (
          <div className="current-location">
            <p>📍 Current Location: {currentLocation}</p>
          </div>
        )}

        <form onSubmit={createPost} className="create-form">
          {console.log('Form rendered')} {/* Debug log */}
          <div className="form-group">
            <label htmlFor="title">Journey Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Amazing sunset at Santorini"
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

          <div className="form-group">
            <label htmlFor="repost_id">Repost (Reference Post ID)</label>
            <input
              type="number"
              id="repost_id"
              name="repost_id"
              value={formData.repost_id}
              onChange={handleInputChange}
              placeholder="Enter post ID to reference (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user_password">Secret Key *</label>
            <input
              type="password"
              id="user_password"
              name="user_password"
              value={formData.user_password}
              onChange={handleInputChange}
              placeholder="Set a secret key to edit/delete this post later"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/')} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              onClick={() => console.log('Submit button clicked')}
            >
              Share Journey
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost