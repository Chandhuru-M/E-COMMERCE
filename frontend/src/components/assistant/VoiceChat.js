import { useState, useEffect, useRef } from "react";

const VoiceChat = () => {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ta-IN"; // Tamil (auto understands English also)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setMessage(voiceText);
      sendMessage(voiceText);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    recognitionRef.current.start();
  };

  const sendMessage = async (text) => {
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      speakText(data.reply);
    } catch (err) {
      console.error(err);
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);

    // Auto language detection
    utterance.lang = /[\u0B80-\u0BFF]/.test(text) ? "ta-IN" : "en-US";

    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={styles.container}>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Speak or type..."
        style={styles.input}
      />

      <button onClick={() => sendMessage(message)} style={styles.btn}>
        Send
      </button>

      <button onClick={startListening} style={styles.micBtn}>
        {isListening ? (
          <span title="Listening...">
            {/* Active listening microphone icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign: 'middle'}}>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.77 2.36s-4.29-.9-5.77-2.36M9 18.9v-3.93m6 3.93v-3.93"/>
            </svg>
            <span style={{marginLeft: '6px'}}>Listening...</span>
          </span>
        ) : (
          <span title="Click to speak">
            {/* Idle microphone icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle'}}>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.77 2.36s-4.29-.9-5.77-2.36M9 18.9v-3.93m6 3.93v-3.93"/>
            </svg>
            <span style={{marginLeft: '6px'}}>Speak</span>
          </span>
        )}
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "10px",
  },
  btn: {
    padding: "10px 15px",
  },
  micBtn: {
    padding: "10px 15px",
    background: "#111",
    color: "#fff",
  },
};

export default VoiceChat;
