import { useEffect, useRef, useState } from 'react'
import { database } from '../firebase' // ✅ Changed from 'db' to 'database'
import { ref, set, onValue, push, remove } from 'firebase/database'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react'

interface Props {
  roomId: string
  role: 'caller' | 'receiver'
  currentUserId: string
  onClose: () => void
}

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
}

export default function CallModal({ roomId, role, currentUserId, onClose }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [connectionState, setConnectionState] = useState<string>('initializing')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    let pc: RTCPeerConnection
    let localStreamInstance: MediaStream

    const startCall = async () => {
      try {
        // 1. Get user media (Camera & Mic)
        localStreamInstance = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setLocalStream(localStreamInstance)
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamInstance

        // 2. Setup Peer Connection
        pc = new RTCPeerConnection(servers)
        pcRef.current = pc

        localStreamInstance.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamInstance)
        })

        const remoteStreamInstance = new MediaStream()
        setRemoteStream(remoteStreamInstance)
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamInstance

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStreamInstance.addTrack(track)
          })
        }

        pc.onconnectionstatechange = () => {
          setConnectionState(pc.connectionState)
        }

        // 3. Signaling via Firebase (Using 'database')
        const callDoc = ref(database, `calls/${roomId}`)
        const offerCandidates = ref(database, `calls/${roomId}/offerCandidates`)
        const answerCandidates = ref(database, `calls/${roomId}/answerCandidates`)

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            if (role === 'caller') {
              push(offerCandidates, event.candidate.toJSON())
            } else {
              push(answerCandidates, event.candidate.toJSON())
            }
          }
        }

        if (role === 'caller') {
          // Caller creates the offer
          const offerDescription = await pc.createOffer()
          await pc.setLocalDescription(offerDescription)

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          }
          await set(callDoc, { offer, status: 'ringing' })

          // Listen for the answer
          onValue(callDoc, (snapshot) => {
            const data = snapshot.val()
            if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer)
              pc.setRemoteDescription(answerDescription)
              setConnectionState('connected')
            }
          })

          // Listen for remote ICE candidates
          onValue(answerCandidates, (snapshot) => {
            snapshot.forEach((childSnapshot) => {
              const candidate = new RTCIceCandidate(childSnapshot.val())
              pc.addIceCandidate(candidate)
            })
          })
        } else {
          // Receiver waits for the offer
          onValue(callDoc, async (snapshot) => {
            const data = snapshot.val()
            if (data?.offer && !pc.currentRemoteDescription) {
              const offerDescription = new RTCSessionDescription(data.offer)
              await pc.setRemoteDescription(offerDescription)

              const answerDescription = await pc.createAnswer()
              await pc.setLocalDescription(answerDescription)

              const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              }
              await set(ref(database, `calls/${roomId}/answer`), answer)
              
              // Listen for caller's ICE candidates
              onValue(offerCandidates, (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                  const candidate = new RTCIceCandidate(childSnapshot.val())
                  pc.addIceCandidate(candidate)
                })
              })
            }
          })
        }
      } catch (err) {
        console.error('Failed to start call', err)
        setConnectionState('error')
      }
    }

    startCall()

    return () => {
      if (pc) pc.close()
      if (localStreamInstance) {
        localStreamInstance.getTracks().forEach((track) => track.stop())
      }
      remove(ref(database, `calls/${roomId}`))
    }
  }, [roomId, role])

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isAudioMuted
      setIsAudioMuted(!isAudioMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = isVideoOff
      setIsVideoOff(!isVideoOff)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl relative rounded-3xl overflow-hidden bg-black shadow-2xl aspect-video border border-slate-700">
        
        {/* Remote Video (Full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Floating Top Right) */}
        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 bg-slate-800 rounded-xl overflow-hidden shadow-xl border-2 border-slate-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Connection Status Overlay */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-lg font-semibold">
              {connectionState === 'error' ? 'Call Failed' : 'Connecting to call...'}
            </p>
            <p className="text-sm text-slate-400 mt-2">Waiting for the other person</p>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/80 backdrop-blur px-6 py-3 rounded-full border border-slate-600">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
          >
            {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={onClose}
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}