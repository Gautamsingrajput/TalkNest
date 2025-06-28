import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import uploadImg from '../assets/upload.png';
import nest from '../assets/nest.png';

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
    socket.on('chat message', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'chat' }]);
    });

    socket.on('system message', (msg) => {
      setMessages((prev) => [...prev, { msg, type: 'system' }]);
    });

    socket.on('media message', (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'media' }]);
    });

    return () => {
      socket.off('chat message');
      socket.off('system message');
      socket.off('media message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (username.trim()) {
      socket.emit('set username', username);
      setJoined(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('chat message', input);
      setInput('');
    }
  };

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
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-2 sm:p-4">
      {!joined ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          className="bg-purple-700 p-6 rounded-xl shadow-lg max-w-md w-full"
        >
          <h2 className="text-2xl font-bold mb-4 text-center text-white">Join Chat</h2>
          <input
            className="w-full bg-neutral-300 p-2 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-blue-200 outline-none mb-3"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700">
            Join
          </button>
        </form>
      ) : (
        <div className="bg-[#FCE9EC] rounded-lg w-full max-w-3xl h-[90vh] flex flex-col ring-2 ring-purple-400">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 flex justify-between text-white p-3 rounded-t-lg font-semibold">
            <div className='flex gap-2'>
              <img className='h-10 bg-pink-200 rounded-full p-1' src={nest} alt="logo" />
              <h1 className="text-2xl">TalkNest</h1>
            </div>
            <p>Welcome, {username}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 bg-zinc-800 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            {messages.map((msg, i) => {
              const isMe = msg.user === username;
              const bubbleStyle = isMe
                ? 'bg-gradient-to-br from-pink-900 via-fuchsia-900 to-purple-900 text-white items-end'
                : 'bg-neutral-700 text-white items-start';

              return (
                <div key={i} className={`flex flex-col max-w-[100%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'system' ? (
                    <div className="text-center text-gray-500 italic w-full">{msg.msg}</div>
                  ) : msg.type === 'chat' ? (
                    <div className={`${bubbleStyle} px-3 py-2 m-1 rounded-xl shadow`}>
                      <div className="text-sm">
                        <b>{msg.user}</b>
                        <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                      </div>
                      <div>{msg.msg}</div>
                    </div>
                  ) : msg.type === 'media' ? (
                    <div className={`${bubbleStyle} p-2 rounded-xl shadow`}>
                      <div className="text-sm">
                        <b>{msg.user}</b>
                        <span className="ml-2 text-xs text-gray-400">[{msg.time}]</span>
                      </div>
                      <div className="mt-2">
                        {msg.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img src={msg.url} alt="media" className="max-w-xs rounded mt-1" />
                        ) : msg.url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={msg.url} controls className="max-w-xs rounded mt-1" />
                        ) : (
                          <a
                            href={msg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            View file
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
          <form onSubmit={handleSubmit} className="p-3 rounded-b-lg bg-gradient-to-br from-purple-500 to-pink-500 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-purple-800"
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
                }}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition inline-flex items-center justify-center"
                title="Attach file"
              >
                <img src={uploadImg} alt="Upload" className="h-6 w-6 object-contain" />
              </label>
            </div>

            <button
              type="submit"
              className="bg-purple-700 shadow-2xl hover:bg-purple-800 hover:shadow-purple-800 text-white px-4 py-2 rounded-2xl"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
