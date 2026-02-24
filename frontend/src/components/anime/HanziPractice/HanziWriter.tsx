import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HanziDrawingResult } from '../../../types/battle.types';
import { ANIME_THEME } from '../../../types/anime.types';

interface HanziWriterProps {
  character: string;
  onComplete?: (result: HanziDrawingResult) => void;
  showHints?: boolean;
  showOutline?: boolean;
  size?: number;
}

const HanziWriter: React.FC<HanziWriterProps> = ({
  character,
  onComplete,
  showHints = true,
  showOutline = true,
  size = 400,
}) => {
  const writerRef = useRef<HTMLDivElement>(null);
  const writerInstanceRef = useRef<any>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [strokesCorrect, setStrokesCorrect] = useState(0);
  const [strokesTotal, setStrokesTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [quizReady, setQuizReady] = useState(false);

  const strokesCorrectRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  function addParticles(isSuccess: boolean) {
    const count = isSuccess ? 12 : 5;
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: size / 2,
      y: size / 2,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  }

  function fireFireworks() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addParticles(true), i * 300);
    }
  }

  function startQuiz(writer: any, totalCount: number, fromStroke = 0) {
    writer.quiz({
      quizStartStrokeNum: fromStroke,
      showHintAfterMisses: 3,
      onMistake: () => {
        addParticles(false);
      },
      onCorrectStroke: () => {
        strokesCorrectRef.current += 1;
        setStrokesCorrect(strokesCorrectRef.current);
        addParticles(true);
      },
      onComplete: (summaryData: any) => {
        setIsComplete(true);
        setStrokesCorrect(totalCount);
        strokesCorrectRef.current = totalCount;

        const timeSpent = (Date.now() - startTimeRef.current) / 1000;
        const accuracy = summaryData.totalMistakes === 0
          ? 100
          : Math.max(0, 100 - summaryData.totalMistakes * 10);

        const result: HanziDrawingResult = {
          character,
          accuracy,
          strokesCorrect: totalCount - summaryData.totalMistakes,
          strokesTotal: totalCount,
          timeSpent,
          perfectStrokes: [],
        };

        fireFireworks();
        setTimeout(() => onCompleteRef.current?.(result), 2000);
      },
    }).then(() => {
      console.log('Quiz started successfully');
      setQuizReady(true);
    }).catch((err: any) => {
      console.error('Quiz failed to start:', err);
    });
  }

  // Initialize HanziWriter
  useEffect(() => {
    if (!writerRef.current) return;
    let cancelled = false;
    setQuizReady(false);
    setStrokesCorrect(0);
    setIsComplete(false);
    setParticles([]);
    strokesCorrectRef.current = 0;
    startTimeRef.current = Date.now();

    let writer: any = null;
    let totalCount = 0;

    const init = async () => {
      try {
        const HanziWriterLib = (await import('hanzi-writer')).default;
        if (cancelled) return;

        const charData = await HanziWriterLib.loadCharacterData(character);
        if (cancelled || !charData) return;
        totalCount = (charData as any).strokes?.length || 0;
        setStrokesTotal(totalCount);

        writerRef.current!.innerHTML = '';

        writer = HanziWriterLib.create(writerRef.current!, character, {
          width: size,
          height: size,
          padding: 20,
          strokeColor: ANIME_THEME.primary.gold,
          outlineColor: showOutline ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0)',
          showCharacter: false,
          showOutline: showOutline,
          drawingWidth: 30,
          strokeAnimationSpeed: 2,
          delayBetweenStrokes: 100,
        });

        if (cancelled) return;
        writerInstanceRef.current = { writer, totalCount };

        await writer.animateCharacter();
        if (cancelled) return;

        startQuiz(writer, totalCount);
      } catch (error) {
        console.error('Failed to initialize HanziWriter:', error);
      }
    };

    init();

    return () => {
      cancelled = true;
      writerInstanceRef.current = null;
    };
  }, [character, size, showOutline]);

  function handleShowHint() {
    console.log('=== Show Hint clicked ===');
    console.log('writerInstanceRef.current:', writerInstanceRef.current);
    console.log('quizReady:', quizReady);
    console.log('strokesCorrectRef.current:', strokesCorrectRef.current);

    const ref = writerInstanceRef.current;
    if (!ref) {
      console.log('ERROR: No writer instance');
      return;
    }
    const { writer, totalCount } = ref;
    const currentStroke = strokesCorrectRef.current;

    console.log('Attempting to animate stroke', currentStroke);
    try {
      const promise = writer.animateStroke(currentStroke);
      console.log('animateStroke returned:', promise);
      if (promise && promise.then) {
        promise.then(() => {
          console.log('Stroke animation complete, restarting quiz');
          startQuiz(writer, totalCount, currentStroke);
        }).catch((err: any) => {
          console.error('animateStroke error:', err);
        });
      }
    } catch (err) {
      console.error('Exception in handleShowHint:', err);
    }
  }

  function handleReset() {
    console.log('=== Reset clicked ===');
    console.log('writerInstanceRef.current:', writerInstanceRef.current);

    const ref = writerInstanceRef.current;
    if (!ref) {
      console.log('ERROR: No writer instance');
      return;
    }
    const { writer, totalCount } = ref;

    console.log('Resetting writer');
    try {
      writer.cancelQuiz();
      setStrokesCorrect(0);
      setIsComplete(false);
      setParticles([]);
      strokesCorrectRef.current = 0;
      startTimeRef.current = Date.now();
      setQuizReady(false);

      const hidePromise = writer.hideCharacter({ duration: 0 });
      console.log('hideCharacter returned:', hidePromise);

      Promise.resolve(hidePromise).then(() => {
        console.log('Character hidden');
        const showPromise = writer.showOutline();
        return Promise.resolve(showPromise);
      }).then(() => {
        console.log('Outline shown, starting quiz');
        startQuiz(writer, totalCount, 0);
      }).catch((err: any) => {
        console.error('Reset error:', err);
      });
    } catch (err) {
      console.error('Exception in handleReset:', err);
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Traditional paper background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(0deg, transparent 24%, rgba(255, 215, 0, 0.05) 25%, rgba(255, 215, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 215, 0, 0.05) 75%, rgba(255, 215, 0, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 215, 0, 0.05) 25%, rgba(255, 215, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 215, 0, 0.05) 75%, rgba(255, 215, 0, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
          borderRadius: '16px',
          border: `4px solid ${ANIME_THEME.primary.gold}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 0 40px rgba(255,215,0,0.1)`,
          zIndex: 0,
        }}
      />

      {/* Red grid lines */}
      <svg
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
        width={size}
        height={size}
      >
        <line x1={size / 2} y1="0" x2={size / 2} y2={size} stroke="rgba(255,100,100,0.2)" strokeWidth="2" strokeDasharray="5,5" />
        <line x1="0" y1={size / 2} x2={size} y2={size / 2} stroke="rgba(255,100,100,0.2)" strokeWidth="2" strokeDasharray="5,5" />
      </svg>

      {/* HanziWriter canvas */}
      <div
        ref={writerRef}
        style={{ position: 'relative', zIndex: 2, width: `${size}px`, height: `${size}px` }}
      />

      {/* Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, opacity: 1, scale: 1 }}
            animate={{
              x: particle.x + (Math.random() - 0.5) * 100,
              y: particle.y + (Math.random() - 0.5) * 100,
              opacity: 0,
              scale: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: ANIME_THEME.primary.lightGold,
              boxShadow: `0 0 20px ${ANIME_THEME.primary.lightGold}`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginTop: '20px',
          background: ANIME_THEME.background.card,
          borderRadius: '16px',
          padding: '20px',
          border: `2px solid ${ANIME_THEME.primary.gold}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: ANIME_THEME.text.white, fontSize: '16px' }}>
          <span>Strokes: {strokesCorrect} / {strokesTotal}</span>
          <span>{strokesTotal > 0 ? Math.round((strokesCorrect / strokesTotal) * 100) : 0}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${strokesTotal > 0 ? (strokesCorrect / strokesTotal) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${ANIME_THEME.primary.gold}, ${ANIME_THEME.primary.lightGold})`,
              boxShadow: `0 0 20px ${ANIME_THEME.primary.gold}`,
            }}
          />
        </div>
      </motion.div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {showHints && !isComplete && (
          <button
            onClick={handleShowHint}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: ANIME_THEME.accent.blue,
              color: ANIME_THEME.text.white,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            Show Hint
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: ANIME_THEME.accent.purple,
            color: ANIME_THEME.text.white,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Completion message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: ANIME_THEME.background.card,
            backdropFilter: 'blur(20px)',
            padding: '40px',
            borderRadius: '24px',
            border: `3px solid ${ANIME_THEME.primary.lightGold}`,
            textAlign: 'center',
            zIndex: 20,
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.6)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#127881;</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: ANIME_THEME.primary.lightGold, marginBottom: '12px' }}>
            Perfect!
          </div>
          <div style={{ fontSize: '18px', color: ANIME_THEME.text.white }}>
            You've mastered {character}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HanziWriter;
