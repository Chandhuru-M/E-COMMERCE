import React, { useState } from "react";
import axios from "axios";
import "./ChatAssistant.css";

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const { data } = await axios.post("/api/v1/assistant", { message: input });

      const botMessage = { sender: "bot", text: data.reply, data: data.data };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to assistant." }
      ]);
    }

    setInput("");
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
            <strong>Shopping Assistant</strong>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
              >
                {msg.text}
                {msg.data && msg.data.products && (
                  <div className="chat-products">
                    {msg.data.products.map((product) => (
                      <div key={product._id} className="chat-product-card">
                        <img
                          src={product.images && product.images[0] ? product.images[0].image : "/images/default_product.png"}
                          alt={product.name}
                        />
                        <div className="chat-product-info">
                          <p className="chat-product-name">{product.name}</p>
                          <p className="chat-product-price">${product.price}</p>
                          <a
                            href={`/product/${product._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-product-link"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inventory Info */}
                {msg.data && msg.data.stockInfo && (
                  <div className="chat-info-card">
                    <p><strong>Status:</strong> {msg.data.stockInfo.message}</p>
                    {msg.data.stockInfo.product && (
                       <p>Stock: {msg.data.stockInfo.stock} units</p>
                    )}
                  </div>
                )}

                {/* Loyalty Offer Info */}
                {msg.data && msg.data.offer && (
                  <div className="chat-info-card">
                    <p><strong>Original Price:</strong> ₹{msg.data.offer.originalPrice}</p>
                    <p><strong>Final Price:</strong> ₹{msg.data.offer.finalPrice}</p>
                    <p className="savings">You Save: ₹{msg.data.offer.savings}</p>
                  </div>
                )}

                {/* Delivery Info */}
                {msg.data && msg.data.deliveryInfo && (
                  <div className="chat-info-card">
                    <p><strong>Estimated Delivery:</strong> {msg.data.deliveryInfo.deliveryDate}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-footer">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
