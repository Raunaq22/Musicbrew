import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ListeningRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeUsers, setActiveUsers] = useState(new Set());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadRoom();
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadRoom = async () => {
    try {
      const response = await api.get(`/listening-rooms/${id}`);
      setRoom(response.data);
      setQueue(response.data.queue || []);
      setCurrentTrack(response.data.currentTrack);
    } catch (error) {
      console.error('Error loading room:', error);
      toast.error('Failed to load listening room');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSocket = () => {
    // Initialize Socket.IO connection
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5001');
    
    const socket = socketRef.current;
    
    // Join the room
    socket.emit('join-room', id);
    
    // Listen for chat messages
    socket.on('new-chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });
    
    // Listen for user join/leave events
    socket.on('user-joined', (data) => {
      setActiveUsers(prev => new Set([...prev, data.userId]));
      toast.success(`${data.username || 'A user'} joined the room`);
    });
    
    socket.on('user-left', (data) => {
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });
    
    // Listen for track controls
    socket.on('track-control-update', (controlData) => {
      if (controlData.action === 'play') {
        setCurrentTrack(controlData.track);
      }
      // Handle other control actions
    });
    
    // Listen for queue updates
    socket.on('queue-updated', (data) => {
      setQueue(data.queue);
    });
    
    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      setIsTyping(true);
    });
    
    socket.on('user-stopped-typing', () => {
      setIsTyping(false);
    });
    
    // Handle disconnections
    socket.on('user-disconnected', (data) => {
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const socket = socketRef.current;
    if (socket) {
      socket.emit('chat-message', {
        roomId: id,
        message: currentMessage,
        username: user?.username || user?.displayName || 'Anonymous'
      });
      
      setCurrentMessage('');
      setIsTyping(false);
    }
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('typing-start', {
        roomId: id,
        username: user?.username || user?.displayName || 'Anonymous'
      });
      
      // Stop typing after 3 seconds of inactivity
      setTimeout(() => {
        socket.emit('typing-stop', {
          roomId: id,
          username: user?.username || user?.displayName || 'Anonymous'
        });
      }, 3000);
    }
  };

  const addToQueue = async (track) => {
    try {
      await api.post(`/listening-rooms/${id}/queue`, { track });
      setQueue(prev => [...prev, track]);
      
      // Notify other users
      const socket = socketRef.current;
      if (socket) {
        socket.emit('queue-update', {
          roomId: id,
          queue: [...queue, track]
        });
      }
    } catch (error) {
      toast.error('Failed to add track to queue');
    }
  };

  const leaveRoom = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('leave-room', id);
      socket.disconnect();
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-text-light mb-4">Room Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Room Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Header */}
          <div className="bg-card rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-light mb-2">{room.name}</h1>
                <p className="text-text-muted">{room.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src={room.host?.avatar || '/default-avatar.png'}
                      alt={room.host?.displayName || room.host?.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-text-muted">
                      Hosted by {room.host?.displayName || room.host?.username}
                    </span>
                  </div>
                  <div className="text-sm text-text-muted">
                    {activeUsers.size + 1} listening
                  </div>
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Current Track */}
          {currentTrack && (
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-light mb-4">Now Playing</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={currentTrack.albumArt || '/default-album.png'}
                  alt={currentTrack.name}
                  className="w-16 h-16 rounded-lg"
                />
                <div>
                  <h3 className="text-lg font-semibold text-text-light">{currentTrack.name}</h3>
                  <p className="text-text-muted">{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* Queue */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-bold text-text-light mb-4">Queue</h2>
            {queue.length === 0 ? (
              <p className="text-text-muted">No tracks in queue yet</p>
            ) : (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div key={`${track.id}-${index}`} className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                    <span className="text-text-muted text-sm">{index + 1}</span>
                    <img
                      src={track.albumArt || '/default-album.png'}
                      alt={track.name}
                      className="w-10 h-10 rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-text-light font-medium">{track.name}</h4>
                      <p className="text-text-muted text-sm">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="bg-card rounded-lg p-4 flex flex-col h-[600px]">
          <h2 className="text-xl font-bold text-text-light mb-4">Chat</h2>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="flex items-start space-x-2">
                  <span className="font-semibold text-primary">
                    {message.username}
                  </span>
                  <span className="text-text-muted text-xs">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-text-light ml-0">{message.message}</p>
              </div>
            ))}
            {isTyping && (
              <div className="text-text-muted text-sm italic">
                Someone is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-background text-text-light rounded-lg px-3 py-2 border border-gray-600 focus:border-primary focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningRoom;