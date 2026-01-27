import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import {
  checkmarkCircle,
  closeCircle,
  refreshOutline,
  timeOutline,
  flameOutline,
  trophyOutline,
  arrowForward,
} from 'ionicons/icons';
import { srsAPI } from '../services/api';
import { useProgress } from '../contexts/ProgressContext';

interface ReviewCard {
  id: string;
  wordId: string;
  word: {
    id: string;
    chinese: string;
    pinyin: string;
    translation: string;
    example?: string;
    hskLevel: number;
  };
  easeFactor: number;
  interval: number;
  repetitions: number;
  isNew: boolean;
}

interface ReviewStats {
  totalDue: number;
  newCards: number;
  reviewCards: number;
  learnedToday: number;
  reviewedToday: number;
}

interface IntervalPreview {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

const ReviewSession: React.FC = () => {
  const { refreshProgress } = useProgress();
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [intervalPreview, setIntervalPreview] = useState<IntervalPreview | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const session = await srsAPI.getReviewSession(5, 15);
      setCards(session.cards);
      setStats(session.stats);
      setCurrentIndex(0);
      setShowAnswer(false);
      setSessionComplete(false);
      setReviewedCount(0);
      setCorrectCount(0);
    } catch (error) {
      console.error('Failed to load review session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Load interval preview when showing answer
  useEffect(() => {
    if (showAnswer && cards[currentIndex]) {
      srsAPI.getIntervalPreview(cards[currentIndex].word.id)
        .then(setIntervalPreview)
        .catch(console.error);
    }
  }, [showAnswer, currentIndex, cards]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleReview = async (quality: 'again' | 'hard' | 'good' | 'easy') => {
    const card = cards[currentIndex];
    if (!card) return;

    try {
      await srsAPI.submitReview(card.word.id, quality);
      setReviewedCount(prev => prev + 1);

      if (quality !== 'again') {
        setCorrectCount(prev => prev + 1);
      }

      // If "again", add card back to end of queue
      if (quality === 'again') {
        setCards(prev => [...prev, card]);
      }

      // Move to next card
      if (currentIndex + 1 >= cards.length && quality !== 'again') {
        // Session complete
        setSessionComplete(true);
        await refreshProgress();
      } else {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
        setIntervalPreview(null);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const currentCard = cards[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IonIcon icon={checkmarkCircle} className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-light text-primary mb-4">All Caught Up!</h2>
          <p className="text-stone-400 mb-8">No cards due for review right now.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={loadSession}
              className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-all flex items-center gap-2"
            >
              <IonIcon icon={refreshOutline} className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <IonIcon icon={trophyOutline} className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-light text-primary mb-4">Session Complete!</h2>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-stone-800/60 rounded-2xl p-4">
              <div className="text-3xl font-light text-white">{reviewedCount}</div>
              <div className="text-xs text-stone-400">Reviewed</div>
            </div>
            <div className="bg-stone-800/60 rounded-2xl p-4">
              <div className="text-3xl font-light text-green-400">{correctCount}</div>
              <div className="text-xs text-stone-400">Correct</div>
            </div>
            <div className="bg-stone-800/60 rounded-2xl p-4">
              <div className="text-3xl font-light text-amber-400">{accuracy}%</div>
              <div className="text-xs text-stone-400">Accuracy</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={loadSession}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all flex items-center gap-2"
            >
              <IonIcon icon={refreshOutline} className="w-5 h-5" />
              Review More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Review Session</h1>
          <p className="text-amber-200/60 mt-1">Spaced repetition learning</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-light text-white">
              {currentIndex + 1} / {cards.length}
            </div>
            <div className="text-xs text-stone-400">cards remaining</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center gap-4 bg-stone-800/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-400">{stats.newCards}</span>
            <span className="text-stone-500">new</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400">{stats.reviewCards}</span>
            <span className="text-stone-500">review</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IonIcon icon={flameOutline} className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400">{stats.reviewedToday}</span>
            <span className="text-stone-500">today</span>
          </div>
        </div>
      )}

      {/* Card */}
      {currentCard && (
        <div className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl border border-amber-700/20 shadow-2xl overflow-hidden">
          {/* Card Type Badge */}
          <div className="px-6 pt-6 flex items-center justify-between">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
              currentCard.isNew
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {currentCard.isNew ? 'New' : 'Review'}
            </span>
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-lg">
              HSK {currentCard.word.hskLevel}
            </span>
          </div>

          {/* Question Side */}
          <div className="p-8 text-center">
            <div className="text-8xl font-light text-white mb-4 transition-all duration-300">
              {currentCard.word.chinese}
            </div>

            {!showAnswer && (
              <button
                onClick={handleShowAnswer}
                className="mt-8 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all flex items-center gap-2 mx-auto"
              >
                Show Answer
                <IonIcon icon={arrowForward} className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Answer Side */}
          {showAnswer && (
            <div className="border-t border-stone-700/50 p-8 animate-slideUp">
              <div className="text-center mb-6">
                <div className="text-amber-500 text-2xl mb-2">{currentCard.word.pinyin}</div>
                <div className="text-white text-xl">{currentCard.word.translation}</div>
                {currentCard.word.example && (
                  <div className="text-stone-400 text-sm mt-4 italic">
                    "{currentCard.word.example}"
                  </div>
                )}
              </div>

              {/* Rating Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                <button
                  onClick={() => handleReview('again')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all"
                >
                  <span className="font-medium">Again</span>
                  <span className="text-xs opacity-75">
                    {intervalPreview?.again || '<1d'}
                  </span>
                </button>
                <button
                  onClick={() => handleReview('hard')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-all"
                >
                  <span className="font-medium">Hard</span>
                  <span className="text-xs opacity-75">
                    {intervalPreview?.hard || '1d'}
                  </span>
                </button>
                <button
                  onClick={() => handleReview('good')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-all"
                >
                  <span className="font-medium">Good</span>
                  <span className="text-xs opacity-75">
                    {intervalPreview?.good || '3d'}
                  </span>
                </button>
                <button
                  onClick={() => handleReview('easy')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all"
                >
                  <span className="font-medium">Easy</span>
                  <span className="text-xs opacity-75">
                    {intervalPreview?.easy || '4d'}
                  </span>
                </button>
              </div>

              <p className="text-center text-stone-500 text-xs mt-4">
                Rate how well you remembered this word
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-stone-800/40 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
          style={{ width: `${(currentIndex / cards.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ReviewSession;
