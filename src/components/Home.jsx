import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../clients.js'
import LoadingSpinner from './LoadingSpinner'
import './Home.css'

function Home() {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [filterFlag, setFilterFlag] = useState('')
  const [showContent, setShowContent] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const {data} = await supabase
        .from('Travel')
        .select()
        .order('created_at', { ascending: false })

      // set state of posts
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterAndSortPosts = useCallback(() => {
    let filtered = [...posts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Flag filter
    if (filterFlag) {
      filtered = filtered.filter(post => post.travel_type === filterFlag)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'like') {
        return (b.like || 0) - (a.like || 0)
      }
      return 0
    })

    setFilteredPosts(filtered)
  }, [posts, searchTerm, sortBy, filterFlag])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    filterAndSortPosts()
  }, [filterAndSortPosts])

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const uniqueFlags = [...new Set(posts.map(post => post.travel_type).filter(Boolean))]

  if (loading) return <LoadingSpinner />

  return (
    <div className="home">
      <div className="home-header">
        <h1>🌍 Travel Collection</h1>
        <p>Discover amazing places and travel experiences</p>
        
        <div className="controls">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="created_at">Sort by Date</option>
              <option value="like">Sort by Likes</option>
            </select>

            <select 
              value={filterFlag} 
              onChange={(e) => setFilterFlag(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {uniqueFlags.map(flag => (
                <option key={flag} value={flag}>{flag}</option>
              ))}
            </select>

            <button 
              onClick={() => setShowContent(!showContent)}
              className="toggle-content-btn"
            >
              {showContent ? 'Hide Content' : 'Show Content'}
            </button>
          </div>
        </div>
      </div>

      <div className="posts-grid">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">
            <h3>No travel posts yet</h3>
            <p>Be the first to share your travel experience!</p>
            <Link to="/create" className="create-first-post">Create Your First Journey</Link>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="post-card">
              <Link to={`/post/${post.id}`} className="post-link">
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                  {post.travel_type && (
                    <span className={`post-flag ${post.travel_type.toLowerCase()}`}>
                      {post.travel_type}
                    </span>
                  )}
                </div>

                <div className="post-meta">
                  <span className="post-time">{formatTimeAgo(post.created_at)}</span>
                  <span className="post-location">📍 {post.location}</span>
                  <span className="post-likes">❤️ {post.like || 0}</span>
                </div>

                {showContent && (
                  <>
                    {post.photos && (
                      <div className="post-image">
                        <img src={post.photos} alt={post.title} />
                      </div>
                    )}
                    {post.comments && (
                      <p className="post-content">{post.comments.substring(0, 150)}...</p>
                    )}
                  </>
                )}

                <div className="post-author">
                  <small>By {post.username}</small>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="stats-bar">
        <div className="stats">
          <span>Total Journeys: {posts.length}</span>
          <span>Countries Visited: {new Set(posts.map(p => p.location?.split(',').pop()?.trim())).size}</span>
        </div>
      </div>
    </div>
  )
}

export default Home