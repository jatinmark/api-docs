// components/RoleplaySession.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { calliqAPI } from '@/lib/calliq-api';
import { Button } from '@/components/ui/Button';

/**
 * Converts an ArrayBuffer (raw binary data) into a Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Define TypeScript interfaces for the expected API response data.
interface ScoreData {
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  feedback_summary: string;
}

interface ReportData {
  audio_link: string;
  score_data: ScoreData;
}

interface RoleplaySessionProps {
  callId: string;
}

const RoleplaySession: React.FC<RoleplaySessionProps> = ({ callId }) => {
    // --- STATE MANAGEMENT ---
    const [status, setStatus] = useState('Idle');
    const [isCallActive, setIsCallActive] = useState(false);
    const userRole = 'agent'; // Always send 'agent' to backend, displayed as 'Coach' in UI
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- REFS ---
    const socketRef = useRef<WebSocket | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isRecordingRef = useRef<boolean>(false);

    // --- AUDIO PLAYBACK ---
    const audioQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef<boolean>(false);
    
    const playNextAudioChunk = useCallback(() => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
        if (!audioContextRef.current) return;

        isPlayingRef.current = true;
        const pcm16 = audioQueueRef.current.shift();

        if (!pcm16) {
            isPlayingRef.current = false;
            return;
        }

        // Convert Int16 to Float32
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768;
        }

        // Create audio buffer at 16kHz
        const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
        audioBuffer.copyToChannel(float32, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
            isPlayingRef.current = false;
            playNextAudioChunk();
        };

        source.start();
    }, []);
    // --- SESSION LIFECYCLE FUNCTIONS ---

    const handleStartSession = async () => {
        setReportData(null);
        sessionIdRef.current = null;
        setIsCallActive(true);
        setStatus('Initializing...');
        try {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                // Create AudioContext with explicit 16kHz sample rate for better quality
                audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            }
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

            setStatus('Requesting session...');
            const data = await calliqAPI.getRoleplaySession(callId, userRole);
            if (!data.websocket_url) throw new Error('Could not get session URL.');

            setStatus('Accessing microphone...');
            // Request microphone with optimized settings for 16kHz
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });
            audioStreamRef.current = stream;
            console.log("Microphone access granted.");
            console.log(data.websocket_url)
            

            await connectWebSocket(data.websocket_url, stream);
        } catch (err: any) {
            console.error("Failed to start session:", err);
            setStatus(`Error: ${err.message}`);
            handleStopSession();
        }
    };
    
    const handleStopSession = () => {
        isRecordingRef.current = false;
        if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
        if (audioProcessorRef.current) audioProcessorRef.current.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.close();

        audioProcessorRef.current = null;
        audioContextRef.current = null;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        // Update UI state
        // If a session ID was received, the user can now get their report.
        if (sessionIdRef.current) {
            setStatus('Session ended. You can now generate your feedback report.');
        } else {
            setStatus('Session ended.');
        }
        setIsCallActive(false);
    };

    /**
     * Connects to the WebSocket and sets up all event handlers.
     */
    const connectWebSocket = async (url: string, stream: MediaStream) => {
        console.log('Connecting to WebSocket:', url);
        socketRef.current = new WebSocket(url);
        setStatus('Connecting to server...');

        socketRef.current.onopen = async () => {
            console.log('WebSocket connected. Sending handshake...');

            // Send the initial audio configuration handshake
            const handshake = {
                type: 'browser_audio',
                action: 'start',
                sampleRate: 16000,
                format: 'pcm16',
                tts_provider: 'cartesia'
            };
            socketRef.current?.send(JSON.stringify(handshake));
            console.log('Sent handshake:', handshake);

            // Send the message to start the conversation/recording
            socketRef.current?.send(JSON.stringify({ type: 'start_conversation' }));
            console.log('Sent start_conversation message');

            setStatus('Connected to server. You can start speaking.');
            isRecordingRef.current = true;

            const audioContext = audioContextRef.current!;
            const source = audioContext.createMediaStreamSource(stream);

            // Use ScriptProcessor with 1024 buffer size for 16kHz (simpler and more reliable)
            const processor = audioContext.createScriptProcessor(1024, 1, 1);
            audioProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!isRecordingRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);

                // Convert Float32 to Int16 with proper clamping
                for (let i = 0; i < inputData.length; i++) {
                    pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                // Convert to base64 and send
                const base64Data = arrayBufferToBase64(pcm16.buffer);
                const audioMessage = { type: 'audio', data: base64Data };
                socketRef.current?.send(JSON.stringify(audioMessage));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
        };

        // Handle incoming messages from the server
        socketRef.current.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);

                // Handle session_info message
                if (message.type === 'session_info' && message.session_id) {
                    console.log(`✅ Received session_id: ${message.session_id}`);
                    sessionIdRef.current = message.session_id;
                    setStatus('Session active. You can start speaking.');
                    return;
                }

                // Handle audio messages from the bot
                if (message.type === 'audio' && message.data) {
                    const audioData = atob(message.data);
                    const pcm16 = new Int16Array(audioData.length / 2);
                    for (let i = 0; i < pcm16.length; i++) {
                        const byte1 = audioData.charCodeAt(i * 2);
                        const byte2 = audioData.charCodeAt(i * 2 + 1);
                        pcm16[i] = (byte2 << 8) | byte1;
                    }
                    audioQueueRef.current.push(pcm16);
                    playNextAudioChunk();
                }

            } catch (error) {
                console.error('Message processing error:', error);
            }
        };

        socketRef.current.onerror = (error) => { console.error('WebSocket error:', error); setStatus('Connection error'); handleStopSession(); };
        socketRef.current.onclose = () => {console.log('WebSocket closed.'); if (isCallActive) handleStopSession(); };
    };

    /**
     * Fetches the final feedback report (audio link + score) from the backend.
     */
    const handleGetReport = async () => {
        if (!sessionIdRef.current) {
            setStatus('Error: Session ID is missing.');
            return;
        }
        setIsProcessing(true);
        setReportData(null); // Clear old report data
        setStatus('Generating your feedback report... This may take a moment.');
        try {
            const result: ReportData = await calliqAPI.scoreRoleplay({
                call_id: callId,
                user_role: userRole,
                session_id: sessionIdRef.current,
            });
            setReportData(result);
            setStatus('Feedback report ready!');
        } catch (error) {
            console.error("Failed to get report:", error);
            setStatus('Error: Could not generate your report.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            {/* Stage 1: Pre-call UI for role selection */}
            {!isCallActive && !reportData && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Role: Coach 🎙️</h4>
                </div>
            )}

            {/* Main call control buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={handleStartSession} disabled={isCallActive || isProcessing}>
                    {isCallActive ? 'Session Active' : 'Start as Coach'}
                </Button>
                <Button onClick={handleStopSession} disabled={!isCallActive} variant="destructive">
                    Stop Session
                </Button>
            </div>
            
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Status: {status}</p>
            
            {/* Stage 2: Post-call UI to trigger report generation */}
            {/* This button appears only after a call has ended AND we have a session ID. */}
            {!isCallActive && sessionIdRef.current && !reportData && (
                <div style={{ marginTop: '1.5rem' }}>
                    <Button onClick={handleGetReport} disabled={isProcessing}>
                        {isProcessing ? 'Generating...' : 'Get Feedback Report'}
                    </Button>
                </div>
            )}
            
            {/* Stage 3: Final report display */}
            {reportData && (
                <div style={{ marginTop: '1.5rem', border: '1px solid #ccc', padding: '1rem' }}>
                    <h3>Your Feedback Report</h3>
                    
                    <div>
                        <strong>Listen to your recording:</strong>
                        <audio controls src={reportData.audio_link} style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>

                    <h4>Overall Score: {reportData.score_data.overall_score} / 10</h4>
                    
                    <div>
                        <strong>What went well:</strong>
                        <ul>{reportData.score_data.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>

                    <div>
                        <strong>Areas for improvement:</strong>
                        <ul>{reportData.score_data.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                    <p><strong>Summary:</strong> {reportData.score_data.feedback_summary}</p>
                </div>
            )}
        </div>
    );
};

export default RoleplaySession;