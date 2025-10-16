'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';

interface VideoCallRoomProps {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  consultationId: string;
  onLeave: () => void;
}

export default function VideoCallRoom({
  appId,
  channelName,
  token,
  uid,
  consultationId,
  onLeave,
}: VideoCallRoomProps) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgora();

    return () => {
      leaveCall();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      // Create client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-joined', handleUserJoined);
      agoraClient.on('user-left', handleUserLeft);

      // Join channel
      await agoraClient.join(appId, channelName, token, uid);

      // Create and publish local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await agoraClient.publish([audioTrack, videoTrack]);

      setConnectionState('connected');

      // Fetch existing messages
      await fetchMessages();
    } catch (error) {
      console.error('Error initializing Agora:', error);
      setConnectionState('failed');
    }
  };

  const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
    await client?.subscribe(user, mediaType);

    if (mediaType === 'video') {
      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === user.uid);
        if (exists) {
          return prev.map((u) => (u.uid === user.uid ? user : u));
        }
        return [...prev, user];
      });
    }

    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };

  const handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
    if (mediaType === 'video') {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    }
  };

  const handleUserJoined = (user: any) => {
    console.log('User joined:', user.uid);
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setMuted(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setMuted(!isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenTrack = await AgoraRTC.createScreenVideoTrack({});
        
        // Unpublish camera track
        if (localVideoTrack && client) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }

        // Publish screen track
        await client?.publish([screenTrack as any]);
        setLocalVideoTrack(screenTrack as any);
        setIsScreenSharing(true);

        // Play screen track locally
        if (localVideoRef.current) {
          (screenTrack as any).play(localVideoRef.current);
        }
      } else {
        // Stop screen sharing and return to camera
        if (localVideoTrack) {
          await client?.unpublish([localVideoTrack]);
          localVideoTrack.close();
        }

        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        await client?.publish([videoTrack]);
        setLocalVideoTrack(videoTrack);
        setIsScreenSharing(false);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const leaveCall = async () => {
    localVideoTrack?.close();
    localAudioTrack?.close();
    await client?.leave();
    onLeave();
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [consultationId]);

  useEffect(() => {
    if (connectionState !== 'connected') {
      return;
    }

    const intervalId = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [connectionState, fetchMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const response = await fetch(`/api/consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white font-medium">Video Consultation</span>
          <span className="text-gray-400 text-sm">
            {connectionState === 'connected' ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <button
          onClick={leaveCall}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          End Call
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video (main) */}
          <div className="absolute inset-0">
            {remoteUsers.length > 0 ? (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                {remoteUsers.map((user) => (
                  <RemoteVideo key={user.uid} user={user} />
                ))}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white text-lg">Waiting for other participant...</p>
              </div>
            )}
          </div>

          {/* Local Video (picture-in-picture) */}
          <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600">
            <div ref={localVideoRef} className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              You {isScreenSharing && '(Screen)'}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isAudioMuted ? (
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                )}
              </svg>
            </button>

            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isVideoMuted ? 'Start Video' : 'Stop Video'}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isVideoMuted ? (
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                ) : (
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                )}
              </svg>
            </button>

            <button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                isScreenSharing ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Share Screen"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 4h12v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8zm7 4a1 1 0 10-2 0v2a1 1 0 102 0v-2z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition shadow-lg"
              title="Toggle Chat"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-medium">Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{msg.sender_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-gray-700 text-white px-3 py-2 rounded-lg max-w-[80%]">
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function RemoteVideo({ user }: { user: any }) {
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && remoteVideoRef.current) {
      user.videoTrack.play(remoteVideoRef.current);
    }

    return () => {
      user.videoTrack?.stop();
    };
  }, [user]);

  return <div ref={remoteVideoRef} className="w-full h-full"></div>;
}
