import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Ensure these image paths are correctly handled in your environment
// In a real project, you'd likely import them or use public URLs
const uploadImg = "https://placehold.co/24x24/E5E7EB/1F2937?text=Upload"; // Placeholder for upload.png
const nest = "https://placehold.co/40x40/EC4899/FFFFFF?text=Nest";     // Placeholder for nest.png

// 🔗 Deployed backend URL
const BACKEND_URL = 'https://talknest-1fir.onrender.com';
const socket = io(BACKEND_URL);

const Chat = () => {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Listen for incoming chat messages
    socket.on('chat message', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'chat' }]);
    });

    // Listen for system messages (e.g., user joined/left)
    socket.on('system message', (msg) => {
      setMessages((prev) => [...prev, { msg, type: 'system' }]);
    });

    // Listen for media messages (images, videos)
    socket.on('media message', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'media' }]);
    });

    // Clean up socket listeners on component unmount
    return () => {
      socket.off('chat message');
      socket.off('system message');
      socket.off('media message');
    };
  }, []); // Empty dependency array means this runs once on mount

  // Scroll to the latest message whenever messages state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle joining the chat
  const handleJoin = () => {
    if (username.trim()) { // Ensure username is not empty
      socket.emit('set username', username); // Emit username to server
      setJoined(true); // Set joined state to true
    }
  };

  // Handle sending a text message
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (input.trim()) { // Ensure message is not empty
      socket.emit('chat message', input); // Emit chat message to server
      setInput(''); // Clear the input field
    }
  };

  // Handle file uploads (images/videos)
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file); // Append the selected file to FormData

    try {
      // Send the file to the backend upload endpoint
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      // Emit the media message URL received from the backend to the socket
      socket.emit('media message', res.data);
    } catch (err) {
      console.error('Upload failed:', err);
      // Optionally, add user feedback for failed upload
    }
  };

  return (
    // Conditional rendering of either the join form or the chat interface
    // The main container classes (full screen, background, centering) are applied based on the state.
    !joined ? (
      // Join Chat Form container - now handles full screen centering
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 sm:p-4 font-sans">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          className="bg-purple-700 p-6 rounded-xl shadow-lg max-w-sm w-full mx-auto sm:max-w-md"
        >
          <h2 className="text-2xl font-bold mb-4 text-center text-white">Join TalkNest</h2>
          <input
            className="w-full bg-neutral-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none mb-4 text-gray-800"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all duration-300 ease-in-out font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Join
          </button>
        </form>
      </div>
    ) : (
      // Main Chat Interface - now directly takes full viewport height and width
      // and inherits the background from the body or a higher-level CSS.
      // Removed `min-h-screen`, `items-center`, `justify-center`, `p-0 sm:p-4` as it's the main app now.
      // Changed h-screen sm:h-[90vh] to just h-screen for full height on all devices.
      <div className="bg-[#FCE9EC] rounded-none sm:rounded-lg w-full h-screen flex flex-col ring-2 ring-purple-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 flex justify-between items-center text-white p-3 sm:p-4 rounded-t-lg font-semibold shadow-md">
          <div className='flex items-center gap-2'>
            <img className='h-8 w-8 sm:h-10 sm:w-10 bg-pink-200 rounded-full p-1' src={nest} alt="logo" />
            <h1 className="text-xl sm:text-2xl">TalkNest</h1>
          </div>
          <p className="text-sm sm:text-base">Welcome, <span className="font-bold">{username}</span></p>
        </div>

        {/* Messages Display Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-zinc-800 custom-scrollbar">
          {messages.map((msg, i) => {
            const isMe = msg.user === username;
            const bubbleStyle = isMe
              ? 'bg-gradient-to-br from-pink-800 via-fuchsia-800 to-purple-800 text-white self-end'
              : 'bg-neutral-700 text-white self-start';

            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                {msg.type === 'system' ? (
                  <div className="text-center text-gray-400 italic text-sm w-full my-1">
                    {msg.msg}
                  </div>
                ) : msg.type === 'chat' ? (
                  <div className={`${bubbleStyle} px-3 py-2 rounded-xl shadow-md max-w-[85%] break-words`}>
                    <div className="text-xs sm:text-sm mb-1">
                      <b>{msg.user}</b>
                      <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                    </div>
                    <div className="text-sm sm:text-base">{msg.msg}</div>
                  </div>
                ) : msg.type === 'media' ? (
                  <div className={`${bubbleStyle} p-2 rounded-xl shadow-md max-w-[85%]`}>
                    <div className="text-xs sm:text-sm mb-1">
                      <b>{msg.user}</b>
                      <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                    </div>
                    <div className="mt-1">
                      {msg.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={msg.url}
                          alt="media"
                          className="max-w-full h-auto rounded-lg shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x150?text=Image+Load+Error'; }}
                        />
                      ) : msg.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={msg.url}
                          controls
                          className="max-w-full h-auto rounded-lg shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.src = ''; console.log('Video load error'); }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <a
                          href={msg.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 underline text-sm sm:text-base hover:text-blue-200 transition-colors"
                        >
                          View file: {msg.url.split('/').pop()}
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 rounded-b-lg bg-gradient-to-br from-purple-500 to-pink-500 flex gap-2 items-center shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-white rounded-xl p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-purple-800 text-gray-800 text-sm sm:text-base"
          />
          <div className="relative">
            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleFileUpload(file);
                e.target.value = null;
              }}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer p-2 sm:p-3 rounded-full bg-purple-100 hover:bg-purple-200 transition inline-flex items-center justify-center shadow-md"
              title="Attach file"
            >
              <img src={uploadImg} alt="Upload" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
            </label>
          </div>

          <button
            type="submit"
            className="bg-purple-700 shadow-xl hover:bg-purple-800 hover:shadow-purple-900 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl transition-all duration-300 ease-in-out font-semibold text-sm sm:text-base"
          >
            Send
          </button>
        </form>
      </div>
    )
  );
};

export default Chat;
