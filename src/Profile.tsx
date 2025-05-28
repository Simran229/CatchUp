// Profile.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Profile({ userId }: { userId: string }) {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [picTimestamp, setPicTimestamp] = useState<number>(Date.now());
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('profile_picture, bio, username')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        // Add cache-busting query param if profile_picture exists
        setProfilePicture(data?.profile_picture ? `${data.profile_picture}?t=${Date.now()}` : null);
        setBio(data?.bio || '');
        setUsername(data?.username || '');
        setPicTimestamp(Date.now());
      }
    };
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Handle file selection (just preview, don't upload yet)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setUploadSuccess(false);
  };

  // Upload file when user clicks update
  const handleProfilePicUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadSuccess(false);
    const file = selectedFile;
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/profile.${fileExt}`;

    // Upload image
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading file:', uploadError.message);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (publicUrl) {
      // Save URL to user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile picture:', updateError.message);
      } else {
        setProfilePicture(`${publicUrl}?t=${Date.now()}`); // update the displayed image with cache-busting
        setPreviewUrl(null); // clear preview, now using uploaded image
        setSelectedFile(null);
        setPicTimestamp(Date.now());
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
        console.log('Profile picture updated:', publicUrl);
      }
    }
    setUploading(false);
  };

  // Update bio
  const handleBioUpdate = async () => {
    const { error } = await supabase.from('users').update({ bio }).eq('id', userId);
    if (error) {
      console.error('Error updating bio:', error.message);
    } else {
      alert('Bio updated!');
    }
  };

  return (
    <div
      style={{
        margin: '2.5rem auto',
        maxWidth: '700px',
        background: 'var(--surface)',
        border: '1.5px solid var(--accent)',
        borderRadius: '22px',
        padding: '2.2rem 2rem 2rem 2rem',
        boxShadow: '0 8px 32px var(--shadow)',
        position: 'relative',
      }}
    >
      <h2 style={{ textAlign: 'center', color: 'var(--primary)', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.2rem', letterSpacing: '-1px' }}>Profile</h2>
      {username && (
        <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.2rem', letterSpacing: '0.5px' }}>
          @{username}
        </div>
      )}
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--background) 60%, var(--accent) 100%)',
          overflow: 'hidden',
          border: '3px solid var(--accent)',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: '0 2px 16px var(--shadow)',
          position: 'relative',
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              transition: 'box-shadow 0.3s',
            }}
          />
        ) : profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              transition: 'box-shadow 0.3s',
            }}
          />
        ) : (
          <span style={{ color: 'var(--border)', fontSize: '3.5rem', fontWeight: 700 }}>?</span>
        )}
      </div>
      <label htmlFor="profile-upload" style={{
        display: 'block',
        margin: '0 auto 1.2rem',
        textAlign: 'center',
        cursor: 'pointer',
        color: 'var(--accent)',
        fontWeight: 600,
        fontSize: '1rem',
        letterSpacing: '0.5px',
        border: '1.5px dashed var(--accent)',
        borderRadius: '8px',
        padding: '0.5rem 1.2rem',
        background: 'var(--background)',
        transition: 'background 0.2s, color 0.2s',
      }}>
        <input id="profile-upload" type="file" onChange={handleFileChange} style={{ display: 'none' }} />
        {'Choose Profile Picture'}
      </label>
      {previewUrl && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            onClick={handleProfilePicUpload}
            disabled={uploading}
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 28px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1.08rem',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 8px var(--shadow)',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              opacity: uploading ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            {uploading ? 'Uploading...' : 'Update Profile Picture'}
          </button>
        </div>
      )}
      {uploadSuccess && (
        <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600, marginBottom: '1rem' }}>
          Profile picture updated!
        </div>
      )}
      <div style={{ marginTop: '1.5rem', background: 'var(--surface)', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow)', padding: '1rem 0.8rem' }}>
        <textarea
          placeholder="Write a short bio..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.7rem',
            border: '1.5px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--background)',
            color: 'var(--text-primary)',
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '1.05rem',
            marginBottom: '0.7rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleBioUpdate}
          style={{
            display: 'block',
            margin: '0.5rem auto 0',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 28px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.08rem',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px var(--shadow)',
            transition: 'all 0.3s ease',
          }}
        >
          Update Bio
        </button>
      </div>
    </div>
  );
}

export default Profile;
