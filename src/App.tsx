import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import './App.css';

dayjs.extend(utc);
dayjs.extend(relativeTime);

function App() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>('');
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error.message);
        return;
      }
      if (data?.user) {
        setUser(data.user);

        const { data: existingProfile, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (selectError) {
          console.error("Error checking user profile:", selectError.message);
          return;
        }

        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: data.user.id, email: data.user.email }]);

          if (insertError) {
            console.error("Error creating profile:", insertError.message);
          } else {
            console.log("Profile created successfully", data.user.email);
          }
        } else {
          setUsername(existingProfile.username || '');
        }
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const checkUsername = async () => {
      if (!user) return;

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error.message);
        return;
      }

      if (!userProfile?.username) {
        const username = prompt("Pick a username:");
        if (username && username.trim() !== '') {
          const { error: updateError } = await supabase
            .from('users')
            .update({ username })
            .eq('id', user.id);

          if (updateError) {
            console.error("Error updating username:", updateError.message);
          } else {
            setUsername(username);
            console.log("Username updated successfully");
          }
        }
      } else {
        setUsername(userProfile.username);
      }
    };
    checkUsername();
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        created_by,
        users:created_by (
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error.message);
    else setPosts(data || []);
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.log('Login error:', error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="App" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      {user && (
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      )}
      <header className="App-header">
        <h1>CatchUp</h1>
        {!user && (
          <div className="app-description">
            <h2>Stay Connected with Your Circle</h2>
            <p>Share updates, connect with friends, and stay in the loop with what matters most.</p>
            <div className="feature-icons">
              <div className="feature-icon connect">
                Connect with Friends
              </div>
              <div className="feature-icon share">
                Share Your Updates
              </div>
              <div className="feature-icon stay-updated">
                Stay Updated
              </div>
            </div>
          </div>
        )}
        {user ? (
          <div>
            <p>Welcome, {username || 'Friend'}!</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const content = (form.elements.namedItem('content') as HTMLInputElement).value;

                if (content.trim() === '') {
                  alert('Please enter an update.');
                  return;
                }

                const { error } = await supabase.from('posts').insert([
                  {
                    content: content,
                    created_by: user.id,
                  },
                ]);

                if (error) {
                  console.error('Error saving post:', error.message);
                } else {
                  form.reset();
                  await fetchPosts();
                }
              }}
              style={{ margin: '1rem 0' }}
            >
              <div>
                <input type="text" name="content" placeholder="Share an update..." style={{ width: '80%', padding: '8px' }} />
                <button type="submit" style={{ marginLeft: '0.5rem' }}>Post</button>
              </div>
            </form>

            <h2>Recent Posts</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {posts.map((post) => (
                <li key={post.id} className="post-item">
                  <div className="post-content" style={{ flex: 1 }}>
                    <strong>{post.users?.username || 'Unknown User'}</strong>
                    {editingPostId === post.id ? (
                      <>
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          style={{ width: '100%', marginTop: '4px', padding: '4px' }}
                        />
                        <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                          <button
                            className="delete-button"
                            style={{ backgroundColor: '#4caf50' }}
                            onClick={async () => {
                              const { error } = await supabase
                                .from('posts')
                                .update({ content: editingContent })
                                .eq('id', post.id);

                              if (error) {
                                console.error('Error updating post:', error.message);
                              } else {
                                setEditingPostId(null);
                                await fetchPosts();
                              }
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="delete-button"
                            style={{ backgroundColor: '#aaa' }}
                            onClick={() => setEditingPostId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {post.content}
                        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '4px' }}>
                          {dayjs.utc(post.created_at).local().fromNow()}
                        </div>
                      </>
                    )}
                  </div>
                  {user && post.created_by === user.id && editingPostId !== post.id && (
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditingContent(post.content);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={async () => {
                          const { error } = await supabase.from('posts').delete().eq('id', post.id);
                          if (error) {
                            console.error('Error deleting post:', error.message);
                          } else {
                            await fetchPosts();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <button onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google logo"
              style={{ width: '20px', height: '20px' }}
            />
            Login with Google
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
