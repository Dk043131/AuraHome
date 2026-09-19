import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Send, 
  Wind, 
  Sun, 
  Moon, 
  Power, 
  Activity, 
  Zap, 
  Flame, 
  Languages,
  AlertCircle,
  Radio,
  Square
} from 'lucide-react';
import { languages, getTranslation } from '../i18n/translations';

export default function VoiceHub({ onExecuteCommand, currentLang = 'en', onSelectLang }) {
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micNotice, setMicNotice] = useState(null);

  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastIntent, setLastIntent] = useState("SYSTEM_READY");
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiModel, setAiModel] = useState("Aura AI");
  const [aiReasoning, setAiReasoning] = useState("");
  const [aiActions, setAiActions] = useState([]);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem("aura_voice_key") || "");

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const currentLangObj = languages.find(l => l.code === currentLang) || languages[0];
  const t = (key) => getTranslation(currentLang, key);

  // Set default greeting in the active language
  useEffect(() => {
    setLastResponse(t('welcome_voice'));
    setAiReasoning("Real-time environmental context engine active. Listening for speech or text.");
  }, [currentLang]);

  // Initialize Speech Recognition with language-specific code
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLangObj.speechCode || 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setIsRecordingAudio(false);
          setTranscript('');
          setMicNotice(null);
        };

        recognition.onresult = (event) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = (err) => {
          console.warn("WebSpeech recognition error:", err.error, err);
          setIsListening(false);
          // If Safari or browser restricts dictation/speech recognition, seamlessly activate MediaRecorder fallback
          if (err.error === 'not-allowed' || err.error === 'service-not-allowed' || err.error === 'audio-capture') {
            console.log("WebSpeech restricted by browser. Starting MediaRecorder fallback...");
            startMediaRecording();
          } else if (err.error !== 'no-speech') {
            setMicNotice(`STT Notice: ${err.error}. You can also use the instant voice buttons below.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("Could not create SpeechRecognition:", e);
      }
    }
  }, [currentLang, currentLangObj.speechCode]);

  // Clean up timers and audio tracks on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // HTML5 MediaRecorder Fallback for Safari & browsers without WebSpeech
  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicNotice(
          currentLang === 'ta'
            ? "மைக் அனுமதி தேவை. கீழே உள்ள உடனடி குரல் பொத்தான்களைப் பயன்படுத்தி சோதிக்கவும்."
            : "Microphone recording is not supported in this browser. Please type or use quick buttons."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/wav')) {
            mimeType = 'audio/wav';
          } else {
            mimeType = '';
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        const usedMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: usedMime });
        if (blob.size > 100) {
          await sendAudioToBackend(blob, usedMime);
        }
        setIsRecordingAudio(false);
        setIsListening(false);
      };

      recorder.start(250);
      setIsListening(true);
      setIsRecordingAudio(true);
      setRecordSeconds(0);
      setMicNotice(null);

      // Start recording timer with 8-second auto-stop
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds(sec => {
          if (sec >= 8) {
            stopMediaRecording();
            return sec;
          }
          return sec + 1;
        });
      }, 1000);

    } catch (err) {
      console.warn("Microphone access error:", err);
      setIsListening(false);
      setIsRecordingAudio(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicNotice(
          currentLang === 'ta'
            ? "சஃபாரியில் மைக் அனுமதி தேவை: Safari > Settings for this Website > Microphone: Allow என மாற்றவும். அல்லது கீழே உள்ள 1-கிளிக் சோதனை கட்டளையைப் பயன்படுத்தவும்."
            : "Microphone permission required in Safari. Tap 'Allow' when prompted or click any 1-click test button below."
        );
      } else {
        setMicNotice(`Microphone notice: ${err.message || 'Unable to access mic'}. Use the quick buttons below.`);
      }
    }
  };

  const stopMediaRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder:", e);
      }
    }
  };

  const sendAudioToBackend = async (audioBlob, mimeType) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const res = await fetch('/api/voice/audio-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_base64: base64Data,
              mime_type: mimeType,
              lang: currentLang,
              api_key: customKey || undefined
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.stt_transcript) {
              setTranscript(data.stt_transcript);
            }
            setLastResponse(data.spoken_response);
            setLastIntent(data.intent || "VOICE_AI");
            setAiModel("Aura AI");
            if (data.reasoning) setAiReasoning(data.reasoning);
            if (data.actions) setAiActions(data.actions);
            if (onExecuteCommand) onExecuteCommand(data);
            speakResponse(data.spoken_response);
          } else {
            const fallback = currentLang === 'ta' ? "கட்டளை பெறப்பட்டது." : "Audio processed.";
            setLastResponse(fallback);
          }
        } catch (e) {
          console.error("Audio command error:", e);
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (e) {
      console.error("Blob read error:", e);
      setIsProcessing(false);
    }
  };

  // Multilingual Text-to-Speech
  const speakResponse = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLangObj.speechCode || 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find native voice matching language
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(currentLang) || v.lang === currentLangObj.speechCode);
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Toggle listening button handler
  const handleToggleListening = () => {
    setMicNotice(null);

    if (isListening) {
      // Currently listening or recording -> stop
      if (isRecordingAudio) {
        stopMediaRecording();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
        }
        setIsListening(false);
      } else {
        setIsListening(false);
      }
      return;
    }

    // Try Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (recognitionRef.current && SpeechRecognition) {
      try {
        recognitionRef.current.lang = currentLangObj.speechCode || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Could not start speech recognition, falling back to MediaRecorder:", e);
        startMediaRecording();
      }
    } else {
      // Direct fallback to HTML5 MediaRecorder
      startMediaRecording();
    }
  };

  // Auto-submit transcript when speech recognition finishes
  useEffect(() => {
    if (!isListening && !isRecordingAudio && transcript.trim()) {
      handleSubmit(transcript);
    }
  }, [isListening, isRecordingAudio]);

  const handleSubmit = async (textToSubmit) => {
    const text = (textToSubmit || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setInputText('');
    setTranscript(text);

    try {
      const res = await fetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          lang: currentLang,
          api_key: customKey || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastResponse(data.spoken_response);
        setLastIntent(data.intent || "VOICE_AI");
        setAiModel("Aura AI");
        if (data.reasoning) setAiReasoning(data.reasoning);
        if (data.actions) setAiActions(data.actions);
        if (onExecuteCommand) onExecuteCommand(data);
        speakResponse(data.spoken_response);
      } else {
        const fallback = `Command executed: ${text}`;
        setLastResponse(fallback);
        speakResponse(fallback);
      }
    } catch (e) {
      console.error(e);
      const fallback = `Command executed: ${text}`;
      setLastResponse(fallback);
      speakResponse(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick commands in the active regional language
  const quickCommands = [
    { label: t('active') + " (Fan)", text: t('cmd_fan_on'), icon: Wind, group: "Fan" },
    { label: t('natural_breeze'), text: t('cmd_fan_breeze'), icon: Wind, group: "Fan" },
    { label: t('sleep_curve'), text: t('cmd_fan_sleep'), icon: Moon, group: "Fan" },
    { label: "Speed 4", text: t('cmd_fan_speed4'), icon: Wind, group: "Fan" },
    { label: t('circadian_sync'), text: t('cmd_circadian'), icon: Sun, group: "Light" },
    { label: t('candlelight'), text: t('cmd_candlelight'), icon: Flame, group: "Light" },
    { label: t('daylight_auto'), text: t('cmd_daylight'), icon: Sun, group: "Light" },
    { label: t('deep_focus'), text: t('cmd_focus'), icon: Sparkles, group: "Light" },
    { label: "Eco Mode", text: t('cmd_eco'), icon: Sparkles, group: "System" },
    { label: t('power_draw'), text: t('cmd_power'), icon: Zap, group: "System" },
    { label: t('motor_health'), text: t('cmd_health'), icon: Activity, group: "System" },
    { label: t('off') + " (All)", text: t('cmd_all_off'), icon: Power, group: "System" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Hero Voice Orb Section */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-8 sm:p-12 shadow-sm shadow-emerald-950/5 relative overflow-hidden text-center">
        
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-green-50/30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          
          {/* Top Bar with Language Tag & Voice-Out Mute */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>STT Engine: {currentLangObj.nativeName} ({currentLangObj.speechCode})</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <Languages className="w-3 h-3 text-emerald-600" />
                <span>{currentLangObj.nativeName} ({currentLangObj.speechCode})</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{voiceEnabled ? t('voice_out_active') : t('voice_out_muted')}</span>
              </button>
            </div>
          </div>

          {/* Big Voice Orb Interactive Button */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              
              {/* Multi-Tier Sonic Wave Aura (Active when listening, recording or speaking) */}
              {(isListening || isSpeaking) && (
                <>
                  <div className="absolute w-56 h-56 rounded-full border-2 border-emerald-400/30 animate-sonic-3 pointer-events-none" />
                  <div className="absolute w-44 h-44 rounded-full border-2 border-emerald-500/40 animate-sonic-2 pointer-events-none" />
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-400/20 animate-sonic-1 pointer-events-none" />
                </>
              )}

              {/* Ambient Idle Glow */}
              {!isListening && !isSpeaking && (
                <div className="absolute w-36 h-36 rounded-full bg-emerald-200/40 blur-xl pointer-events-none animate-pulse-subtle" />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleListening();
                }}
                className={`btn-tactile relative z-30 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer select-none active:scale-95 ${
                  isRecordingAudio
                    ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 text-white shadow-rose-500/50 ring-8 ring-rose-200 scale-105 animate-pulse'
                    : isListening
                    ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-rose-500/50 ring-8 ring-rose-100 scale-105'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-500/50 ring-8 ring-emerald-100'
                    : 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 hover:from-emerald-600 hover:to-teal-400 text-white shadow-emerald-600/40 ring-8 ring-emerald-50 hover:ring-emerald-100'
                }`}
                title={isRecordingAudio ? "Recording... Click to finish" : isListening ? "Listening... Click to stop" : "Tap to speak in your language"}
              >
                {/* Visualizer when Speaking, Listening or Recording */}
                {isRecordingAudio ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1.5 h-6">
                      <span className="w-1.5 bg-white rounded-full h-5 animate-eq-1" />
                      <span className="w-1.5 bg-white rounded-full h-7 animate-eq-2" />
                      <span className="w-1.5 bg-white rounded-full h-8 animate-eq-3" />
                      <span className="w-1.5 bg-white rounded-full h-7 animate-eq-4" />
                      <span className="w-1.5 bg-white rounded-full h-5 animate-eq-5" />
                    </div>
                    <span className="text-[11px] font-black tracking-widest uppercase">
                      {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                ) : (isListening || isSpeaking) ? (
                  <div className="flex items-center gap-1 mb-1 h-8">
                    <span className="w-1 bg-white rounded-full h-7 animate-eq-1" />
                    <span className="w-1 bg-white rounded-full h-8 animate-eq-2" />
                    <span className="w-1.5 bg-white rounded-full h-9 animate-eq-3" />
                    <span className="w-1 bg-white rounded-full h-8 animate-eq-4" />
                    <span className="w-1 bg-white rounded-full h-7 animate-eq-5" />
                  </div>
                ) : (
                  <Mic className="w-10 h-10 mb-0.5 drop-shadow-sm transition-transform hover:scale-110" />
                )}

                <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-xs mt-0.5">
                  {isRecordingAudio 
                    ? (currentLang === 'ta' ? 'முடிக்க அழுத்தவும்' : 'Tap to Stop')
                    : isListening 
                    ? t('listening') 
                    : isSpeaking 
                    ? 'Speaking' 
                    : t('tap_speak')}
                </span>
              </button>
            </div>

            {/* Status */}
            <div className="mt-4">
              <span className={`text-xs font-bold uppercase tracking-wider block ${
                isRecordingAudio ? 'text-rose-600 animate-pulse' : isListening ? 'text-rose-600' : isSpeaking ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                {isRecordingAudio
                  ? `🔴 ${currentLangObj.nativeName} Audio Recording (${String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:${String(recordSeconds % 60).padStart(2, '0')})... Tap button to submit`
                  : isListening
                  ? `🎙️ ${currentLangObj.nativeName} STT Active... Speak now`
                  : isProcessing
                  ? t('processing_sub')
                  : isSpeaking
                  ? t('speaking_sub')
                  : t('idle_sub')}
              </span>
            </div>

            {/* Live Regional STT Subtitle Bubble */}
            {isListening && !isRecordingAudio && (
              <div className="mt-4 px-5 py-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>🎙️ {currentLangObj.nativeName} ({currentLangObj.speechCode}) STT Live:</span>
                </div>
                <p className="text-sm font-bold text-slate-900 tracking-wide min-h-[1.5rem]">
                  {transcript ? `"${transcript}"` : (currentLang === 'ta' ? 'பேசுங்கள்... (எ.கா. "ஃபேனை போடு")' : 'Listening for your voice...')}
                </p>
              </div>
            )}

            {/* Safari Permission & Mic Notice Banner */}
            {micNotice && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 max-w-md mx-auto text-left shadow-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold leading-relaxed">{micNotice}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setMicNotice(null)} 
                  className="text-amber-500 hover:text-amber-800 p-0.5 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Instant 1-Click Interactive Voice Test Chips */}
            <div className="mt-6 pt-5 border-t border-emerald-100/80 w-full max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLang === 'ta' ? 'உடனடி குரல் கட்டளை சோதனை (Single-Click Voice Test):' : 'Instant 1-Click Voice Command Tests:'}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: currentLang === 'ta' ? '🌀 ஃபேன் போடு' : '🌀 Turn on Fan', cmd: t('cmd_fan_on') },
                  { label: currentLang === 'ta' ? '💡 விளக்கு அணை' : '💡 Turn off Light', cmd: t('cmd_candlelight') },
                  { label: currentLang === 'ta' ? '🍃 இயற்கை காற்று' : '🍃 Natural Breeze', cmd: t('cmd_fan_breeze') },
                  { label: currentLang === 'ta' ? '⚡ மின் பயன்பாடு' : '⚡ Power Usage', cmd: t('cmd_power') },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(item.cmd)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 hover:border-emerald-300 text-emerald-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Spoken Response Display Card */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs text-left relative space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('ai_response_title')} ({currentLangObj.nativeName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  {aiModel}
                </span>
                <button
                  type="button"
                  onClick={() => speakResponse(lastResponse)}
                  title="Replay Audio"
                  className="p-1 rounded-md hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              "{lastResponse}"
            </p>

            {/* Actions Executed Pills */}
            {aiActions && aiActions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Actions:</span>
                {aiActions.map((act, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    ✓ {act}
                  </span>
                ))}
              </div>
            )}

            {/* Environmental Context Reasoning */}
            {aiReasoning && (
              <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-slate-600 leading-normal">
                <span className="font-bold text-emerald-800 mr-1">🌱 Context Reasoning:</span>
                {aiReasoning}
              </div>
            )}

            {transcript && (
              <p className="text-[11px] text-slate-400 italic font-medium pt-1">
                Transcribed Query: "{transcript}"
              </p>
            )}
          </div>

          {/* Text Input Fallback Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('type_placeholder')}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>{t('execute')}</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

        </div>
      </div>

      {/* Quick Voice Command Chips by Category (Localized) */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-sm shadow-emerald-950/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">{t('quick_actions_title')}</h3>
            <p className="text-xs text-slate-500 font-medium">{t('quick_actions_sub')}</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {quickCommands.length} {t('intents_count')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(cmd.text)}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-left transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700">
                    {cmd.group}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-white group-hover:bg-emerald-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <Icon className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 block">
                    {cmd.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block truncate">
                    "{cmd.text}"
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
