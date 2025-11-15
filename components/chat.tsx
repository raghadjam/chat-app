'use client';

import { useEffect, useState, useRef } from 'react';
import { Realtime } from 'ably';

interface Message {
  user: string;
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [ably, setAbly] = useState<Realtime | null>(null);
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = prompt("Enter your username") || "Anonymous";
    setUsername(name);

    const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!key) {
      console.error("Ably API key missing!");
      return;
    }

    // Initialize Ably only once
    const ablyClient = new Realtime({ key });
    setAbly(ablyClient);

    const channel = ablyClient.channels.get('chat');
    channelRef.current = channel;

    channel.subscribe((msg) => {
      setMessages((prev) => [...prev, msg.data as Message]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input || !channelRef.current) return;

    channelRef.current.publish('message', { user: username, text: input });
    setInput('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Realtime Chat</h1>
      <div style={{
        border: '1px solid #ccc',
        padding: '1rem',
        height: '400px',
        overflowY: 'auto',
        marginBottom: '1rem'
      }}>
        {messages.map((msg, i) => (
          <div key={i}><strong>{msg.user}:</strong> {msg.text}</div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        style={{ width: '80%', padding: '0.5rem' }}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem', marginLeft: '0.5rem' }}>
        Send
      </button>
    </div>
  );
}
