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
        {isListening ? "🎙 Listening..." : "🎤 Speak"}
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
