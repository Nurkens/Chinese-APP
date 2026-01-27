import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { search, bookOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { wordsAPI } from '../services/api';
import { useProgress } from '../contexts/ProgressContext';

interface Word {
  id: string;
  chinese: string;
  pinyin: string;
  translation: string;
  example?: string;
  hskLevel: number;
}

const WordLibrary: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [markingLearned, setMarkingLearned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { isWordLearned, markWordAsLearned, progress } = useProgress();

  useEffect(() => {
    loadWords(selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = words.filter(
        (word) =>
          word.chinese.includes(searchQuery) ||
          word.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          word.translation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWords(filtered);
    } else {
      setFilteredWords(words);
    }
  }, [searchQuery, words]);

  const loadWords = async (level: number) => {
    try {
      setLoading(true);
      const data = await wordsAPI.getWordsByHskLevel(level);
      setWords(data);
      setFilteredWords(data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsLearned = async () => {
    if (!selectedWord || markingLearned) return;

    setMarkingLearned(true);
    const success = await markWordAsLearned(selectedWord.id);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedWord(null);
      }, 1500);
    }

    setMarkingLearned(false);
  };

  const hskLevels = [1, 2, 3, 4];

  // Count learned words for current level
  const learnedCount = filteredWords.filter(w => isWordLearned(w.id)).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Word Library</h1>
          <p className="text-amber-200/60 mt-1">Browse and learn Chinese characters</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-white">{progress?.totalWords || 0}</div>
          <div className="text-xs text-amber-500">words learned</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
        {/* Search Bar */}
        <div className="relative mb-6">
          <IonIcon
            icon={search}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400"
          />
          <input
            type="text"
            placeholder="Search by Chinese, Pinyin, or English..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-stone-700/50 text-white placeholder-stone-400 rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* HSK Level Filters */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-sm mr-2">HSK Level:</span>
            {hskLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  selectedLevel === level
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-stone-700/50 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="text-sm text-stone-400">
            <span className="text-green-400">{learnedCount}</span> / {filteredWords.length} learned
          </div>
        </div>
      </div>

      {/* Word Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word, index) => {
            const learned = isWordLearned(word.id);
            return (
              <div
                key={word.id}
                onClick={() => setSelectedWord(word)}
                className={`relative bg-stone-800/60 backdrop-blur-md rounded-2xl p-6 border cursor-pointer hover:bg-stone-800/80 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-slideUp ${
                  learned
                    ? 'border-green-500/50 bg-green-900/20'
                    : 'border-amber-700/20 hover:border-primary/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {learned && (
                  <div className="absolute top-3 right-3">
                    <IonIcon icon={checkmarkCircle} className="w-6 h-6 text-green-400" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl font-light text-white">{word.chinese}</div>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg">
                    HSK {word.hskLevel}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-amber-500 text-lg">{word.pinyin}</div>
                  <div className="text-stone-300 text-sm">{word.translation}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredWords.length === 0 && !loading && (
        <div className="text-center py-20">
          <IonIcon icon={bookOutline} className="w-16 h-16 text-stone-600 mx-auto mb-4" />
          <p className="text-stone-400">No words found</p>
        </div>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => !showSuccess && setSelectedWord(null)}
        >
          <div
            className="bg-stone-900 rounded-3xl p-8 max-w-lg w-full mx-4 border border-amber-700/30 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {showSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <IonIcon icon={checkmarkCircle} className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-2xl text-green-400 font-medium">Word Learned!</h3>
                <p className="text-stone-400 mt-2">+1 to your vocabulary</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div className="text-8xl font-light text-white">{selectedWord.chinese}</div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <IonIcon icon={closeCircle} className="w-8 h-8 text-stone-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-stone-400 text-sm mb-1">Pinyin</div>
                    <div className="text-amber-500 text-2xl">{selectedWord.pinyin}</div>
                  </div>

                  <div>
                    <div className="text-stone-400 text-sm mb-1">Translation</div>
                    <div className="text-white text-xl">{selectedWord.translation}</div>
                  </div>

                  {selectedWord.example && (
                    <div>
                      <div className="text-stone-400 text-sm mb-1">Example</div>
                      <div className="text-amber-200/60">{selectedWord.example}</div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-stone-700">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 text-sm">HSK Level</span>
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg">
                        Level {selectedWord.hskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {isWordLearned(selectedWord.id) ? (
                  <div className="w-full mt-6 bg-green-600/20 text-green-400 font-medium py-3 rounded-xl text-center flex items-center justify-center gap-2">
                    <IonIcon icon={checkmarkCircle} className="w-5 h-5" />
                    Already Learned
                  </div>
                ) : (
                  <button
                    onClick={handleMarkAsLearned}
                    disabled={markingLearned}
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {markingLearned ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={checkmarkCircle} className="w-5 h-5" />
                        Mark as Learned
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordLibrary;
