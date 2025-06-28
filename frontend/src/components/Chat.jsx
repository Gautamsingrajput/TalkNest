import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

import uploadImg from '../assets/upload.png';
import nest from '../assets/logo2.png';

// 🔗 Deployed backend URL (replace with your actual backend URL if different)
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
  }, []);

  // Scroll to the latest message whenever messages state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle joining the chat
  const handleJoin = () => {
    if (username.trim()) {
      socket.emit('set username', username);
      setJoined(true);
    }
  };

  // Handle sending a text message
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('chat message', input);
      setInput('');
    }
  };

  // Handle file uploads (images/videos)
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData);
      socket.emit('media message', res.data);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    // Main container for both states, now with an even darker background
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-0 sm:p-4 font-sans">
      {!joined ? (
        // Join Chat Form container
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          className="bg-gray-900 p-6 rounded-xl shadow-xl shadow-purple-500/50 max-w-sm w-full mx-auto sm:max-w-md border border-purple-700 animate-fade-in"
        >
          <h2 className="text-2xl font-bold mb-4 text-center text-white">Join TalkNest</h2>
          <input
            className="w-full bg-gray-800 text-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none mb-4 placeholder-gray-400"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-lime-500 text-gray-900 py-3 rounded-xl hover:bg-lime-600 transition-all duration-300 ease-in-out font-semibold text-lg shadow-md hover:shadow-lime-400 hover:ring-2 hover:ring-lime-400"
          >
            Join
          </button>
        </form>
      ) : (
        // Main Chat Interface
        <div
          className="bg-gray-950 rounded-none sm:rounded-lg w-full h-screen sm:h-[95vh] flex flex-col ring-2 ring-purple-600 overflow-hidden shadow-3xl shadow-purple-700/70"
        >
          {/* Header */}
          <div
            className="bg-gradient-to-br from-purple-900 to-fuchsia-900 flex justify-between items-center text-white px-3 py-2 sm:p-4 rounded-t-lg font-semibold shadow-md"
          >
            <div className='flex items-center gap-2'>
              <img className='h-9 w-9 sm:h-10 sm:w-10 bg-pink-200 rounded-full p-1 object-contain' src={nest} alt="logo" />
              <h1 className="text-xl sm:text-2xl">TalkNest</h1>
            </div>
            <p className="text-sm sm:text-base">Welcome, <span className="font-bold text-cyan-300">{username}</span></p>
          </div>

          {/* Messages Display Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-950 custom-scrollbar">
            {messages.map((msg, i) => {
              const isMe = msg.user === username;
              const bubbleStyle = isMe
                ? 'bg-gradient-to-br from-fuchsia-800 via-purple-800 to-indigo-800 text-white self-end' // Darker gradient
                : 'bg-gray-800 text-white self-start'; // Darker gray

              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-gray-500 italic text-sm w-full my-1 animate-fade-in">
                      {msg.msg}
                    </div>
                  ) : msg.type === 'chat' ? (
                    <div className={`${bubbleStyle} px-3 py-2 rounded-xl shadow-md max-w-[85%] break-words border border-transparent ${isMe ? 'border-fuchsia-700' : 'border-gray-700'} animate-message-in`}>
                      <div className="text-xs sm:text-sm mb-1">
                        <b className="text-cyan-300">{msg.user}</b>
                        <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                      </div>
                      <div className="text-sm sm:text-base">{msg.msg}</div>
                    </div>
                  ) : msg.type === 'media' ? (
                    <div className={`${bubbleStyle} p-2 rounded-xl shadow-md max-w-[85%] border border-transparent ${isMe ? 'border-fuchsia-700' : 'border-gray-700'} animate-message-in`}>
                      <div className="text-xs sm:text-sm mb-1">
                        <b className="text-cyan-300">{msg.user}</b>
                        <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                      </div>
                      <div className="mt-1">
                        {msg.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img
                            src={msg.url}
                            alt="media"
                            className="max-w-full h-auto rounded-lg shadow-sm border border-gray-700"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/200x150/333/eee?text=Image+Load+Error'; }}
                          />
                        ) : msg.url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={msg.url}
                            controls
                            className="max-w-full h-auto rounded-lg shadow-sm border border-gray-700"
                            onError={(e) => { e.target.onerror = null; e.target.src = ''; console.log('Video load error'); }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <a
                            href={msg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline text-sm sm:text-base hover:text-blue-300 transition-colors"
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
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 rounded-b-lg bg-gradient-to-br from-purple-950 to-pink-950 flex gap-2 items-center shadow-inner-top">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-gray-800 text-gray-100 placeholder-gray-400 rounded-xl p-2 sm:p-3 focus:outline-none focus:ring-4 focus:ring-opacity-75 focus:ring-cyan-500
                         focus:shadow-xl focus:shadow-cyan-500/70 transition-all duration-300 ease-in-out border border-gray-700 animate-pulse-glow"
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
                className="cursor-pointer p-2 sm:p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition inline-flex items-center justify-center shadow-md
                           hover:ring-4 hover:ring-opacity-75 hover:ring-lime-400 hover:shadow-xl hover:shadow-lime-400/70 animate-pulse-glow-btn"
                title="Attach file"
              >
                <img src={uploadImg} alt="Upload" className="h-5 w-5 sm:h-6 sm:w-6 object-contain filter invert" />
              </label>
            </div>

            <button
              type="submit"
              className="bg-purple-700 shadow-xl hover:bg-purple-800 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl transition-all duration-300 ease-in-out font-semibold text-sm sm:text-base
                         hover:ring-4 hover:ring-opacity-75 hover:ring-pink-500 hover:shadow-xl hover:shadow-pink-500/70 animate-pulse-glow-btn"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Custom Styles including darker theme colors and animations */}
      <style>
        {`
        body {
          background-color: #000; /* Ensures the very background is black */
        }

        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a; /* Darker track */
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444; /* Darker thumb */
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666; /* Lighter gray on hover */
        }

        /* Keyframe for message entry animation */
        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Keyframe for general fade-in */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Keyframe for glowing pulse on input focus */
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0);
          }
          50% {
            box-shadow: 0 0 10px rgba(0,255,255,0.7), 0 0 20px rgba(0,255,255,0.4);
          }
          100% {
            box-shadow: 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0);
          }
        }

        /* Keyframe for glowing pulse on button hover/active */
        @keyframes pulseGlowBtn {
          0% {
            box-shadow: 0 0 0px rgba(0,0,0,0);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px rgba(255,0,255,0.7), 0 0 25px rgba(255,0,255,0.4);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 0px rgba(0,0,0,0);
            transform: scale(1);
          }
        }

        /* Apply message entry animation */
        .animate-message-in {
          animation: messageIn 0.3s ease-out forwards;
        }

        /* Apply fade-in animation */
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        /* Apply glowing pulse to input on focus */
        input:focus.animate-pulse-glow {
          animation: pulseGlow 1.5s infinite alternate;
        }

        /* Apply glowing pulse to buttons on hover */
        .animate-pulse-glow-btn:hover {
          animation: pulseGlowBtn 0.8s ease-in-out; /* Adjusted for better button feel */
        }
        `}
      </style>
    </div>
  );
};

export default Chat;
