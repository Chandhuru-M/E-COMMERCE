import React, { useState } from "react";
import axios from "axios";
import "../../ChatAssistant.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useSelector(state => state.authState);
  const navigate = useNavigate();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if user is authenticated for sales agent features
      if (!isAuthenticated) {
        const botMessage = { 
          sender: "bot", 
          text: "Please log in to use the AI Shopping Assistant. I can help you search products, check inventory, and complete purchases!" 
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
        setInput("");
        return;
      }

      // Use the advanced Sales Agent API
      const headers = sessionId ? { "x-session-id": sessionId } : {};
      const { data } = await axios.post("/api/v1/sales/parse-search", 
        { message: input, page: 1, limit: 5 }, 
        { headers }
      );

      // Save session ID for multi-turn conversation
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      let botResponse = "";

      // Handle different intents
      if (data.intent === "search" && data.items && data.items.length > 0) {
        botResponse = `I found ${data.total || data.items.length} products for "${data.query}":\n\n`;
        data.items.forEach((item, idx) => {
          botResponse += `${idx + 1}. ${item.name || item.title} - ₹${item.price}\n`;
        });
        botResponse += "\n✨ Click on any product card below to view details!";

        // Store products in message for potential selection
        const botMessage = { 
          sender: "bot", 
          text: botResponse,
          products: data.items 
        };
        setMessages((prev) => [...prev, botMessage]);
      } else if (data.intent === "search") {
        botResponse = `Sorry, I couldn't find any products matching "${data.query}". Try searching for laptops, phones, or other electronics!`;
        setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
      } else {
        // Default response for other intents
        botResponse = data.message || "I can help you search for products! Try asking: 'Show me laptops under 50000'";
        setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
      }

    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = err.response?.data?.message || "Error connecting to assistant. Please try again.";
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: errorMsg }
      ]);
    }

    setIsLoading(false);
    setInput("");
  };

  const handleProductClick = async (product) => {
    // Check if it's an external product (FakeStore) that needs to be imported
    const isFakeStore = product.id && product.id.toString().startsWith('FAKESTORE_');
    
    if (isFakeStore) {
      // Need to import FakeStore product first
      try {
        setIsLoading(true);
        const { data } = await axios.post("/api/v1/sales/select", {
          selection: {
            source: "fakestore",
            id: product.id,
            rawFake: product.rawData // if available
          },
          sessionId: sessionId
        });

        if (data.success && data.product) {
          // Product imported successfully, navigate to it
          setIsOpen(false);
          navigate(`/product/${data.product._id || data.product.id}`);
        } else {
          // Show error message
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "Sorry, I couldn't load this product. Please try another one." }
          ]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error selecting product:", error);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Sorry, there was an error loading this product. Please try again." }
        ]);
        setIsLoading(false);
      }
    } else {
      // For internal MongoDB products, navigate directly
      setIsOpen(false);
      navigate(`/product/${product._id || product.id}`);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button className="chat-float-btn" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <strong>🤖 AI Shopping Assistant</strong>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>👋 Hi! I'm your AI Shopping Assistant.</p>
                <p>Try asking:</p>
                <ul>
                  <li>"Show me laptops"</li>
                  <li>"Find phones under 30000"</li>
                  <li>"What's in stock?"</li>
                </ul>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
                >
                  {msg.text}
                </div>
                {/* Render product cards if available */}
                {msg.products && msg.products.length > 0 && (
                  <div className="product-cards">
                    {msg.products.map((product) => (
                      <div 
                        key={product.id || product._id} 
                        className="product-card"
                        onClick={() => handleProductClick(product)}
                      >
                        <img 
                          src={product.images?.[0]?.image || product.image || "https://via.placeholder.com/60?text=No+Image"} 
                          alt={product.name || product.title}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=No+Image" }}
                        />
                        <h4>{product.name || product.title}</h4>
                        <p>₹{product.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot">
                <span className="typing-indicator">●●●</span>
              </div>
            )}
          </div>

          <div className="chat-footer">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
