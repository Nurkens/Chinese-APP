import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useXiaomei } from '../contexts/XiaomeiContext';
import { useAuth } from '../contexts/AuthContext';
import XiaomeiChat from './ai/XiaomeiChat';

const FloatingXiaomei: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const { currentMessage, showMessage } = useXiaomei();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
    showMessage('idle');
  }, [showMessage]);

  const xiaomeiSrc = `${import.meta.env.BASE_URL}xiaomei.png`;

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999999,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <AnimatePresence>
            {showBubble && !chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: '#2c1e14',
                  border: '2px solid #d97706',
                  borderRadius: '16px',
                  padding: '12px',
                  marginBottom: '10px',
                  maxWidth: '240px',
                  color: '#fef3c7',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontFamily: 'sans-serif',
                }}
              >
                <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
                  XIAOMEI · 小美
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                  {currentMessage || 'Ready to learn!'}
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => setChatOpen(true)}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '6px 10px',
                      background: '#d97706',
                      color: '#1c1410',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    💬 Chat with me
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isAuthenticated && !showBubble) {
                setChatOpen(true);
              } else {
                setShowBubble(!showBubble);
              }
            }}
            onDoubleClick={() => isAuthenticated && setChatOpen(true)}
          >
            <img
              src={xiaomeiSrc}
              alt="Tutor"
              style={{
                width: '160px',
                height: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 0 15px rgba(217, 119, 6, 0.5))',
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/2044/2044812.png';
              }}
            />
          </motion.div>
        </div>,
        document.body,
      )}

      <XiaomeiChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default FloatingXiaomei;
