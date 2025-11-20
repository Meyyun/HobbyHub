import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../clients.js'
import LoadingSpinner from './LoadingSpinner'
import './PostDetail.css'

function PostDetail({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showSecretInput, setShowSecretInput] = useState(false)
  const [referencedPost, setReferencedPost] = useState(null)

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

      // Check if this is a repost and fetch the referenced post
      if (data.comments && data.comments.includes('Repost of:')) {
        const match = data.comments.match(/Repost of: "(.+)" by (.+)/)
        if (match) {
          // Try to find the referenced post by title and username
          const { data: refPost } = await supabase
            .from('Travel')
            .select('*')
            .eq('title', match[1])
            .eq('username', match[2])
            .single()
          
          if (refPost) {
            setReferencedPost(refPost)
          }
        }
      }
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

  const updateCount = async (event) => {
    event.preventDefault();

    try {
      await supabase
        .from('Travel')
        .update({ like: (post.like || 0) + 1})
        .eq('id', id)

      setPost((prevPost) => ({ ...prevPost, like: (prevPost.like || 0) + 1 }));
    } catch (error) {
      console.error('Error updating likes:', error)
      alert('Error updating likes')
    }
  }

  const handleEdit = () => {
    if (!secretKey) {
      setShowSecretInput(true)
      return
    }

    if (secretKey === post.user_password) {
      navigate(`/edit/${id}`)
    } else {
      alert('Incorrect secret key!')
      setSecretKey('')
    }
  }

  // DELETE post
  const deletePost = async (event) => {
    event.preventDefault();

    if (!secretKey) {
      setShowSecretInput(true)
      return
    }

    if (secretKey === post.user_password) {
      if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        try {
          await supabase
            .from('Travel')
            .delete()
            .eq('id', id); 

          window.location = "/";
        } catch (error) {
          console.error('Error deleting post:', error)
          alert('Error deleting post')
        }
      }
    } else {
      alert('Incorrect secret key!')
      setSecretKey('')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const updatedComments = post.comments 
        ? `${post.comments}\\n\\n--- Comment by ${userId} ---\\n${newComment}`
        : `--- Comment by ${userId} ---\\n${newComment}`

      const { error } = await supabase
        .from('Travel')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      setPost(prev => ({ ...prev, comments: updatedComments }))
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Error adding comment')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderComments = (commentsText) => {
    if (!commentsText) return null
    
    const parts = commentsText.split('--- Comment by')
    const mainContent = parts[0]
    const comments = parts.slice(1)

    return (
      <div className="comments-section">
        {mainContent && (
          <div className="main-content">
            <h3>Story & Experience</h3>
            <p>{mainContent}</p>
          </div>
        )}
        
        {comments.length > 0 && (
          <div className="comments-list">
            <h3>Comments ({comments.length})</h3>
            {comments.map((comment, index) => {
              const [userLine, ...contentLines] = comment.split('\\n')
              const username = userLine.replace(' ---', '').trim()
              const content = contentLines.join('\\n').replace(/^\\n+/, '')
              
              return (
                <div key={index} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{username}</span>
                  </div>
                  <p className="comment-content">{content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <LoadingSpinner />
  if (!post) return <div>Post not found</div>

  return (
    <div className="post-detail">
      <div className="post-detail-container">
        <div className="post-header">
          <div className="post-title-section">
            <h1>{post.title}</h1>
            {post.travel_type && (
              <span className={`post-flag ${post.travel_type.toLowerCase()}`}>
                {post.travel_type}
              </span>
            )}
          </div>
          
          <div className="post-meta">
            <span className="post-author">👤 {post.username}</span>
            <span className="post-location">📍 {post.location}</span>
            <span className="post-date">📅 {formatDate(post.created_at)}</span>
          </div>
        </div>

        {post.photos && (
          <div className="post-image">
            <img src={post.photos} alt={post.title} />
          </div>
        )}

        {referencedPost && (
          <div className="referenced-post">
            <h3>Referenced Post:</h3>
            <Link to={`/post/${referencedPost.id}`} className="ref-post-link">
              <div className="ref-post-card">
                <h4>{referencedPost.title}</h4>
                <p>By {referencedPost.username} • {referencedPost.location}</p>
                {referencedPost.photos && (
                  <img src={referencedPost.photos} alt={referencedPost.title} />
                )}
              </div>
            </Link>
          </div>
        )}

        <div className="post-actions">
          <button onClick={updateCount} className="upvote-btn">
            ❤️ {post.like || 0} Likes
          </button>
          
          {post.username === userId && (
            <div className="owner-actions">
              {!showSecretInput ? (
                <>
                  <button onClick={handleEdit} className="edit-btn">Edit</button>
                  <button onClick={deletePost} className="delete-btn">Delete</button>
                </>
              ) : (
                <div className="secret-input">
                  <input
                    type="password"
                    placeholder="Enter secret key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                  />
                  <button onClick={handleEdit} className="confirm-btn">Edit</button>
                  <button onClick={deletePost} className="confirm-btn delete">Delete</button>
                  <button onClick={() => {setShowSecretInput(false); setSecretKey('')}} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {renderComments(post.comments)}

        <div className="add-comment">
          <h3>Add a Comment</h3>
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this journey..."
              rows="4"
              required
            />
            <button type="submit" className="comment-submit-btn">
              Post Comment
            </button>
          </form>
        </div>

        <div className="navigation-actions">
          <Link to="/" className="back-btn">← Back to Feed</Link>
        </div>
      </div>
    </div>
  )
}

export default PostDetail