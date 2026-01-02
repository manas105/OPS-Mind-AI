import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Message from './Message';

const MessageList = ({ messages = [], streamingContent = '', isSending = false }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isSending]);

  const streamingMessage = isSending
    ? {
        id: 'streaming',
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date().toISOString(),
        isStreaming: true,
      }
    : null;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {streamingMessage && <Message key={streamingMessage.id} message={streamingMessage} />}

      <div ref={scrollRef} />
    </Box>
  );
};

export default MessageList;
