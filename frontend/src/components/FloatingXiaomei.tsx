import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useXiaomei } from '../contexts/XiaomeiContext';

const FloatingXiaomei: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const { currentMessage, showMessage } = useXiaomei();

  useEffect(() => {
    setMounted(true);
    console.log("XIAOMEI PORTAL MOUNTED!");
    // Show a random idle message on mount
    showMessage('idle');
  }, [showMessage]);

  const xiaomeiSrc = `${import.meta.env.BASE_URL}xiaomei.png`;

  if (!mounted) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999999, 
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      <AnimatePresence>
        {showBubble && (
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
              maxWidth: '220px',
              color: '#fef3c7',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>XIAOMEI · 小美</div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
              {currentMessage || 'Ready to learn!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowBubble(!showBubble)}
      >
        <img
            src={xiaomeiSrc}
          alt="Tutor"
          style={{
            width: '160px',
            height: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 0 15px rgba(217, 119, 6, 0.5))'
          }}
          onError={(e) => {
            console.error("Image error!");
            e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2044/2044812.png";
          }}
        />
      </motion.div>
    </div>,
    document.body 
  );
};

export default FloatingXiaomei;