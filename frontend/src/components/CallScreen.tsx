import React, { useState, useRef, useEffect, useCallback } from 'react'

interface CallScreenProps {
  isDark: boolean
  onEndCall: () => void
  partnerInfo?: {
    name: string
    skills: string[]
    interests: string[]
    experience: string
    lookingFor: string[]
  }
  userData?: {
    name: string
    skills: string[]
    company: string
    lookingFor: string[]
  }
}

interface ChatMessage {
  id: string
  text: string
  isFromPartner: boolean
  timestamp: Date
}

const CallScreen: React.FC<CallScreenProps> = ({ 
  isDark, 
  onEndCall, 
  userData 
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnecting, setIsConnecting] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [partnerProfile, setPartnerProfile] = useState<{name?: string; skills?: string[]; lookingFor?: string[]}>({})
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [remoteHasVideo, setRemoteHasVideo] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [isCallConnected, setIsCallConnected] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const userIdRef = useRef<string | null>(null)
  const partnerIdRef = useRef<string | null>(null)
  const sendersRef = useRef<RTCRtpSender[]>([])

  // Cleanup function for media streams - ensures camera light turns off
  const cleanupStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop() // This is crucial - stops the track and turns off camera light
        track.enabled = false
      })
    }
  }, [])

  // Get user's camera and microphone
  const getMediaStream = useCallback(async () => {
    try {
      setIsLoadingMedia(true)
      setMediaError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setIsLoadingMedia(false)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setIsLoadingMedia(false)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setMediaError('Camera and microphone access denied. Please allow access to continue.')
        } else if (error.name === 'NotFoundError') {
          setMediaError('No camera or microphone found on your device.')
        } else if (error.name === 'NotReadableError') {
          setMediaError('Camera or microphone is already in use by another application.')
        } else {
          setMediaError('Failed to access camera and microphone. Please check your device settings.')
        }
      } else {
        setMediaError('An unexpected error occurred while accessing media devices.')
      }
    }
  }, [])

  // Keep the local video element bound to the latest stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
    streamRef.current = localStream
  }, [localStream])

  // Improved video toggle - properly manages camera hardware
  const toggleVideo = useCallback(async () => {
    if (!localStream) return

    if (isVideoEnabled) {
      // Turning video OFF - Stop video tracks to turn off camera light
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.stop() // This stops the camera and turns off the light
      })
      
      // Create new stream with only audio tracks
      const audioTracks = localStream.getAudioTracks()
      const newStream = new MediaStream()
      audioTracks.forEach(track => newStream.addTrack(track))
      
      setLocalStream(newStream)
      streamRef.current = newStream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream
      }
      
      setIsVideoEnabled(false)
    } else {
      // Turning video ON - Get new video stream
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const videoTracks = videoStream.getVideoTracks()
        
        // Create new stream combining existing audio with new video
        const newStream = new MediaStream()
        
        // Add existing audio tracks
        const audioTracks = localStream.getAudioTracks()
        audioTracks.forEach(track => newStream.addTrack(track))
        
        // Add new video tracks
        videoTracks.forEach(track => newStream.addTrack(track))
        
        setLocalStream(newStream)
        streamRef.current = newStream
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream
        }
        
        setIsVideoEnabled(true)
      } catch (error) {
        console.error('Error enabling video:', error)
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setMediaError('Camera access denied. Please allow camera access to enable video.')
          } else if (error.name === 'NotFoundError') {
            setMediaError('No camera found on your device.')
          } else if (error.name === 'NotReadableError') {
            setMediaError('Camera is already in use by another application.')
          } else {
            setMediaError('Failed to enable video. Please check your camera settings.')
          }
        }
      }
    }
  }, [isVideoEnabled, localStream])

  // Improved audio toggle - properly manages microphone hardware
  const toggleAudio = useCallback(async () => {
    if (!localStream) return

    if (isAudioEnabled) {
      // Turning audio OFF - Stop audio tracks to disable microphone
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.stop() // This stops the microphone
      })
      
      // Create new stream with only video tracks
      const videoTracks = localStream.getVideoTracks()
      const newStream = new MediaStream()
      videoTracks.forEach(track => newStream.addTrack(track))
      
      setLocalStream(newStream)
      streamRef.current = newStream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream
      }
      
      setIsAudioEnabled(false)
    } else {
      // Turning audio ON - Get new audio stream
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioTracks = audioStream.getAudioTracks()
        
        // Create new stream combining existing video with new audio
        const newStream = new MediaStream()
        
        // Add existing video tracks
        const videoTracks = localStream.getVideoTracks()
        videoTracks.forEach(track => newStream.addTrack(track))
        
        // Add new audio tracks
        audioTracks.forEach(track => newStream.addTrack(track))
        
        setLocalStream(newStream)
        streamRef.current = newStream
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream
        }
        
        setIsAudioEnabled(true)
      } catch (error) {
        console.error('Error enabling audio:', error)
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setMediaError('Microphone access denied. Please allow microphone access to enable audio.')
          } else if (error.name === 'NotFoundError') {
            setMediaError('No microphone found on your device.')
          } else if (error.name === 'NotReadableError') {
            setMediaError('Microphone is already in use by another application.')
          } else {
            setMediaError('Failed to enable audio. Please check your microphone settings.')
          }
        }
      }
    }
  }, [isAudioEnabled, localStream])

  // Initialize media stream on component mount
  useEffect(() => {
    getMediaStream()

    return () => {
      // Cleanup on unmount - ensure all tracks are stopped and camera light is off
      if (streamRef.current) {
        cleanupStream(streamRef.current)
      }
      try {
        pcRef.current?.getSenders().forEach(s => {
          try { s.track?.stop() } catch {}
        })
        pcRef.current?.close()
      } catch {}
      try { wsRef.current?.close() } catch {}
    }
  }, [getMediaStream, cleanupStream])

  // Handle skip - send skip message and requeue
  const handleSkip = useCallback(() => {
    if (!partnerIdRef.current || !wsRef.current || !userIdRef.current) return
    
    // Send skip message to server
    wsRef.current.send(JSON.stringify({
      type: 'skip-call',
      from: userIdRef.current,
      data: {}
    }))
    
    // Close peer connection
    try {
      pcRef.current?.close()
      // Create new peer connection for next match
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      pcRef.current = pc
      
      // Re-attach local tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current as MediaStream))
      }
      
      pc.onicecandidate = (e) => {
        if (e.candidate && partnerIdRef.current && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            from: userIdRef.current,
            to: partnerIdRef.current,
            data: { candidate: e.candidate }
          }))
        }
      }
      
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsCallConnected(true)
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          setIsCallConnected(false)
        }
      }

      pc.ontrack = (ev) => {
        const [remoteStream] = ev.streams
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
          setIsCallConnected(true)
          const vt = remoteStream.getVideoTracks()[0]
          setRemoteHasVideo(!!vt && vt.enabled)
          if (vt) {
            vt.onmute = () => setRemoteHasVideo(false)
            vt.onunmute = () => setRemoteHasVideo(true)
            vt.onended = () => setRemoteHasVideo(false)
          }
        }
      }
    } catch (e) {
      console.error('Error handling skip:', e)
    }
    
    // Reset partner and requeue
    partnerIdRef.current = null
    setIsConnecting(true)
    setIsCallConnected(false)
    setRemoteHasVideo(false)
    setChatMessages([])
  }, [])

  // Enhanced cleanup when ending call
  const handleEndCall = useCallback(() => {
    // Stop all tracks before ending call
    if (streamRef.current) {
      cleanupStream(streamRef.current)
      setLocalStream(null)
      streamRef.current = null
    }
    try { wsRef.current?.send(JSON.stringify({ type: 'leave-queue', from: userIdRef.current, data: {} })) } catch {}
    try { pcRef.current?.close() } catch {}
    onEndCall()
  }, [onEndCall, cleanupStream])


  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ---- Signaling + WebRTC wiring ----
  useEffect(() => {
    // Get WS URL from env or auto-detect
    let wsUrl = import.meta.env.VITE_WS_URL
    if (!wsUrl) {
      // Auto-detect: if on HTTPS, use WSS; else WS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = window.location.protocol === 'https:' ? '' : ':3001'
      wsUrl = `${protocol}//${host}${port}`
    }
    // Ensure protocol matches (wss for https, ws for http)
    if (window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
      wsUrl = wsUrl.replace('ws://', 'wss://')
    }
    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    pcRef.current = pc

    // Pre-create transceivers to fix m-line order
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' })
      pc.addTransceiver('video', { direction: 'sendrecv' })
    } catch {}

    pc.onicecandidate = (e) => {
      if (e.candidate && partnerIdRef.current) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          from: userIdRef.current,
          to: partnerIdRef.current,
          data: { candidate: e.candidate }
        }))
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State (init):', pc.iceConnectionState)
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsCallConnected(true)
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        setIsCallConnected(false)
      }
    }

    pc.ontrack = (ev) => {
      const [remoteStream] = ev.streams
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream
        setIsCallConnected(true)
        const vt = remoteStream.getVideoTracks()[0]
        setRemoteHasVideo(!!vt && vt.enabled)
        if (vt) {
          vt.onmute = () => setRemoteHasVideo(false)
          vt.onunmute = () => setRemoteHasVideo(true)
          vt.onended = () => setRemoteHasVideo(false)
        }
      }
    }

    // Remove extra renegotiations; only the chosen offerer will create an offer in match-found

    const attachLocal = () => {
      if (streamRef.current) {
        // Remove previous senders to avoid duplicate tracks
        sendersRef.current.forEach(s => {
          try { pc.removeTrack(s) } catch {}
        })
        sendersRef.current = []
        const audioTracks = streamRef.current.getAudioTracks()
        const videoTracks = streamRef.current.getVideoTracks()
        audioTracks.forEach(t => {
          const sender = pc.addTrack(t, streamRef.current as MediaStream)
          sendersRef.current.push(sender)
        })
        videoTracks.forEach(t => {
          const sender = pc.addTrack(t, streamRef.current as MediaStream)
          sendersRef.current.push(sender)
        })
      }
    }
    attachLocal()

    ws.onmessage = async (msg) => {
      const payload = JSON.parse(msg.data)
      switch (payload.type) {
        case 'user-id': {
          userIdRef.current = payload.userId
          // join queue once we have id - send tags/skills if available
          ws.send(JSON.stringify({ 
            type: 'join-queue', 
            from: userIdRef.current, 
            data: {
              name: userData?.name,
              tags: userData?.lookingFor || [],
              skills: userData?.skills || [],
              lookingFor: userData?.lookingFor || []
            }
          }))
          break
        }
        case 'match-found': {
          partnerIdRef.current = payload.partnerId
          setIsConnecting(false)
          if (payload.partnerProfile) {
            setPartnerProfile({
              name: payload.partnerProfile.name,
              skills: payload.partnerProfile.skills,
              lookingFor: payload.partnerProfile.lookingFor
            })
          } else {
            setPartnerProfile({})
          }
          // Offerer: the user with lexicographically smaller id to avoid glare
          if (userIdRef.current && partnerIdRef.current && userIdRef.current < partnerIdRef.current) {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            ws.send(JSON.stringify({ type: 'offer', from: userIdRef.current, to: partnerIdRef.current, data: offer }))
          }
          break
        }
        case 'offer': {
          // We are answerer
          await pc.setRemoteDescription(payload.data)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          ws.send(JSON.stringify({ type: 'answer', from: userIdRef.current, to: payload.from, data: answer }))
          break
        }
        case 'answer': {
          await pc.setRemoteDescription(payload.data)
          break
        }
        case 'ice-candidate': {
          try {
            await pc.addIceCandidate(payload.data.candidate)
          } catch (e) {
            console.warn('Failed to add ICE', e)
          }
          break
        }
        case 'partner-skipped': {
          // reset and requeue
          partnerIdRef.current = null
          setIsConnecting(true)
          setIsCallConnected(false)
          setRemoteHasVideo(false)
          setPartnerProfile({})
          try {
            pcRef.current?.getSenders().forEach(s => { try { pcRef.current?.removeTrack(s) } catch {} })
            pcRef.current?.close()
            if (remoteVideoRef.current) (remoteVideoRef.current as HTMLVideoElement).srcObject = null
          } catch {}
          setChatMessages([])
          ws.send(JSON.stringify({ type: 'join-queue', from: userIdRef.current, data: {} }))
          break
        }
        case 'partner-disconnected': {
          partnerIdRef.current = null
          setIsConnecting(true)
          setIsCallConnected(false)
          setRemoteHasVideo(false)
          setPartnerProfile({})
          try {
            pcRef.current?.getSenders().forEach(s => { try { pcRef.current?.removeTrack(s) } catch {} })
            pcRef.current?.close()
            if (remoteVideoRef.current) (remoteVideoRef.current as HTMLVideoElement).srcObject = null
          } catch {}
          setChatMessages([])
          ws.send(JSON.stringify({ type: 'join-queue', from: userIdRef.current, data: {} }))
          break
        }
        case 'chat-message': {
          // Receive chat message from partner
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: payload.message || payload.data?.message || '',
            isFromPartner: true,
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
          }])
          break
        }
      }
    }

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnecting(false)
      setMediaError('Failed to connect to server. Please check your connection.')
    }

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
      // attempt soft cleanup
      try { pc.close() } catch {}
      // If unexpected close, try to reconnect after a delay
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect...')
          // Component will remount and reconnect
        }, 3000)
      }
    }

    return () => {
      try { ws.close() } catch {}
      try { pc.close() } catch {}
    }
  }, [userData])

  // When localStream becomes available later, add tracks and negotiate if needed
  useEffect(() => {
    const pc = pcRef.current
    if (!pc || !localStream) return
    try {
      // Remove existing senders
      sendersRef.current.forEach(s => {
        try { pc.removeTrack(s) } catch {}
      })
      sendersRef.current = []
      // Add current tracks
      localStream.getTracks().forEach(t => {
        const sender = pc.addTrack(t, localStream)
        sendersRef.current.push(sender)
      })
      // Trigger negotiation if already matched
      if (partnerIdRef.current && wsRef.current) {
        pc.dispatchEvent(new Event('negotiationneeded'))
      }
    } catch (e) {
      console.warn('Failed to reattach local tracks', e)
    }
  }, [localStream])

  const handleSendMessage = () => {
    if (chatMessage.trim() && partnerIdRef.current && wsRef.current) {
      const messageText = chatMessage.trim()
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'chat-message',
        from: userIdRef.current,
        to: partnerIdRef.current,
        data: { message: messageText }
      }))
      // Add to local messages
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: messageText,
        isFromPartner: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, newMessage])
      setChatMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const retryMediaAccess = () => {
    setMediaError(null)
    getMediaStream()
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className="flex h-screen">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`p-4 border-b transition-colors duration-300 ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Orbit Call
                </h1>
                {isConnecting && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Connecting...
                    </span>
                  </div>
                )}
                {/* Media Status Indicators */}
                {!isConnecting && (
                  <div className="flex items-center space-x-2">
                    {!isVideoEnabled && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                        <span>Camera Off</span>
                      </div>
                    )}
                    {!isAudioEnabled && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1m0 0V7a3 3 0 013-3h3.5M4 9v2m13.5-6.5a3 3 0 013 3v4a3 3 0 01-3 3H13" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                        <span>Mic Off</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsChatOpen(v => !v)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                  title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-9 8l4-4h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12z" />
                  </svg>
                  <span className="text-sm font-medium">Chat</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                  title="Report"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01"/>
                  </svg>
                </button>
                <button
                  onClick={handleEndCall}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="End Call"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Video Area - side-by-side portrait 3:4 rectangles */}
          <div className="flex-1 m-4 max-h-[calc(100vh-200px)] flex flex-row gap-4 items-stretch">
            {mediaError ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-medium mb-2 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    Media Access Required
                  </h3>
                  <p className={`mb-4 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {mediaError}
                  </p>
                  <button
                    onClick={retryMediaAccess}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Remote Video (Partner / Connecting / Queue) */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-slate-800 relative aspect-[3/4] flex flex-col justify-center items-center">
                  {isConnecting ? (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className={`text-xl font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-200'
                      }`}>
                        Finding your match...
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        This usually takes a few seconds
                      </p>
                    </div>
                  ) : !isCallConnected ? (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className={`text-xl font-medium mb-2 transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-200'
                      }`}>
                        Connecting call...
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-550'
                      }`}>
                        Establishing WebRTC stream
                      </p>
                    </div>
                  ) : remoteHasVideo ? (
                    <video
                      ref={remoteVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                      </div>
                      <p className={`${isDark ? 'text-white' : 'text-slate-200'} text-sm`}>
                        {(partnerProfile.name ? `${partnerProfile.name}'s` : "Partner's")} video is off
                      </p>
                    </div>
                  )}
                  {!isConnecting && partnerProfile.name && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                        isDark 
                          ? 'bg-slate-900/80 text-white' 
                          : 'bg-white/80 text-slate-900'
                      }`}>
                        {partnerProfile.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Local Video (Self) */}
                <div className="flex-1 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-700 aspect-[3/4]">
                  {isLoadingMedia ? (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : isVideoEnabled && localStream && localStream.getVideoTracks().length > 0 ? (
                    <video
                      ref={localVideoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                        <span className="text-white text-sm">Your Camera Off</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Video Controls - Fixed height to match chat input */}
          <div className={`h-20 p-8 border-t transition-colors duration-300 flex items-center justify-center ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={toggleAudio}
                disabled={isLoadingMedia || !!mediaError}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isAudioEnabled
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {isAudioEnabled ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m-7-7a7 7 0 007 7m-4 4h8" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11V7a3 3 0 10-6 0v1m0 3v0a3 3 0 004.243 2.828M5 11a7 7 0 0011.243 4.243" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleVideo}
                disabled={isLoadingMedia || !!mediaError}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isVideoEnabled
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
              >
                {isVideoEnabled ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={isConnecting}
                className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Skip to Next Person"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Partner Info & Chat (collapsible) */}
        <div className={`${isChatOpen ? 'w-80' : 'w-0'} ${isChatOpen ? 'border-l' : ''} transition-all duration-300 overflow-hidden flex flex-col h-full ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          {/* Partner Info Section - Always visible at top */}
          <div className={`p-4 border-b transition-colors duration-300 flex-shrink-0 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className="mb-4">
              <h3 className={`font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {partnerProfile.name || ''}
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {(partnerProfile.lookingFor && partnerProfile.lookingFor.length > 0)
                  ? partnerProfile.lookingFor.join(', ')
                  : ''}
              </p>
            </div>
            
            <div className="space-y-3">
              {(partnerProfile.skills && partnerProfile.skills.length > 0) ? (
                <div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Skills:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(partnerProfile.skills || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                          isDark 
                            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              
              {(partnerProfile.lookingFor && partnerProfile.lookingFor.length > 0) ? (
                <div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Looking for:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(partnerProfile.lookingFor || []).slice(0, 2).map((item) => (
                      <span
                        key={item}
                        className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                          isDark 
                            ? 'bg-purple-900/30 text-purple-300 border border-purple-700' 
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Chat Section - Takes remaining height */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className={`p-4 border-b transition-colors duration-300 flex-shrink-0 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <h3 className={`font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Chat
              </h3>
            </div>
            {/* Chat Messages - Scrollable area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className={`text-center text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Start the conversation!
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromPartner ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-lg transition-colors duration-300 ${
                      message.isFromPartner
                        ? isDark 
                          ? 'bg-slate-700 text-white' 
                          : 'bg-slate-200 text-slate-900'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.isFromPartner
                          ? isDark ? 'text-slate-300' : 'text-slate-500'
                          : 'text-emerald-100'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input - Fixed height to match video controls */}
            <div className={`h-20 border-t transition-colors duration-300 flex items-center px-4 flex-shrink-0 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border transition-all duration-300 ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Report User
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Please select a reason for reporting this partner. They will be flagged, and you will be immediately skipped to a new match.
            </p>
            <div className="space-y-2 mb-6">
              {[
                'Inappropriate Behavior / Nudity',
                'Harassment or Hate Speech',
                'Spam / Advertising',
                'Pretending to be someone else'
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reportReason === reason 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : isDark ? 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false)
                  setReportReason('')
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportReason}
                onClick={() => {
                  setIsReportModalOpen(false)
                  setReportReason('')
                  setToastMessage('User reported successfully. Finding new connection...')
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 4000)
                  handleSkip()
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallScreen


