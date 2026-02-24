import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import {
  peopleOutline,
  personAddOutline,
  trophyOutline,
  flameOutline,
  searchOutline,
  closeCircle,
  trashOutline,
  copyOutline,
  checkmarkCircle,
  globeOutline,
} from 'ionicons/icons';
import { friendsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FriendData {
  friendshipId: string;
  id: string;
  username: string;
  tag: string;
  isGuest: boolean;
  progress: {
    currentStreak: number;
    longestStreak: number;
    hskLevel: number;
    totalWords: number;
    targetWords: number;
  } | null;
  addedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  tag: string;
  progress: {
    currentStreak: number;
    hskLevel: number;
    totalWords: number;
  } | null;
}

const Friends: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'friends' | 'leaderboard'>('friends');

  // Friends state
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  // Leaderboard state
  const [leaderboardMode, setLeaderboardMode] = useState<'global' | 'friends'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      setFriendsLoading(true);
      const data = await friendsAPI.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      const data = leaderboardMode === 'global'
        ? await friendsAPI.getGlobalLeaderboard()
        : await friendsAPI.getFriendsLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardMode]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (activeSection === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeSection, loadLeaderboard]);

  const handleAddFriend = async () => {
    if (!tagInput.trim()) return;

    setAddError('');
    setAddSuccess('');
    setAddLoading(true);

    try {
      await friendsAPI.addFriend(tagInput.trim());
      setAddSuccess('Друг добавлен!');
      setTagInput('');
      loadFriends();
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка при добавлении друга';
      setAddError(message);
      setTimeout(() => setAddError(''), 4000);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendsAPI.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleCopyTag = () => {
    if (user?.tag) {
      navigator.clipboard.writeText(user.tag);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    }
  };

  const myRank = leaderboard.findIndex((e) => e.id === user?.id) + 1;
  const myEntry = leaderboard.find((e) => e.id === user?.id);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Friends</h1>
          <p className="text-amber-200/60 mt-1">Compete and learn together</p>
        </div>
      </div>

      {/* My Tag Card */}
      <div className="bg-gradient-to-r from-primary/20 to-amber-600/20 rounded-2xl p-4 border border-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-stone-400 text-xs mb-1">Your tag</div>
            <div className="text-white font-medium text-lg">{user?.tag || '...'}</div>
          </div>
          <button
            onClick={handleCopyTag}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all"
          >
            <IonIcon icon={copiedTag ? checkmarkCircle : copyOutline} className="w-5 h-5" />
            <span className="text-sm">{copiedTag ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-stone-800/60 rounded-xl p-1">
        {[
          { key: 'friends' as const, label: 'Friends', icon: peopleOutline },
          { key: 'leaderboard' as const, label: 'Leaderboard', icon: trophyOutline },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeSection === tab.key
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-stone-400 hover:text-stone-300'
            }`}
          >
            <IonIcon icon={tab.icon} className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeSection === 'friends' && (
        <div className="space-y-4">
          {/* Add Friend */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <IonIcon icon={personAddOutline} className="w-5 h-5 text-primary" />
              Add Friend
            </h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  placeholder="Enter tag (e.g. username#1234)"
                  className="w-full pl-12 pr-4 py-3 bg-stone-700/50 text-white placeholder-stone-500 rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <button
                onClick={handleAddFriend}
                disabled={addLoading || !tagInput.trim()}
                className="px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {addLoading ? '...' : 'Add'}
              </button>
            </div>
            {addError && (
              <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                <IonIcon icon={closeCircle} className="w-4 h-4" />
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mt-3 text-green-400 text-sm flex items-center gap-2">
                <IonIcon icon={checkmarkCircle} className="w-4 h-4" />
                {addSuccess}
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <h3 className="text-lg font-medium text-white mb-4">
              My Friends ({friends.length})
            </h3>

            {friendsLoading ? (
              <div className="text-center py-8 text-stone-500">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <IonIcon icon={peopleOutline} className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No friends yet</p>
                <p className="text-xs mt-1">Share your tag or enter a friend's tag above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend, index) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between bg-stone-900/50 hover:bg-stone-900/70 rounded-xl p-4 transition-all animate-slideUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-stone-700 rounded-full flex items-center justify-center text-3xl">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{friend.username}</div>
                        <div className="text-stone-500 text-xs mb-1">{friend.tag}</div>
                        <div className="flex items-center gap-3 text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <IonIcon icon={flameOutline} className="w-3 h-3 text-orange-400" />
                            {friend.progress?.currentStreak || 0}d
                          </span>
                          <span>HSK {friend.progress?.hskLevel || 1}</span>
                          <span>{friend.progress?.totalWords || 0} words</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remove friend"
                    >
                      <IonIcon icon={trashOutline} className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeSection === 'leaderboard' && (
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 bg-stone-800/60 rounded-xl p-1">
            <button
              onClick={() => setLeaderboardMode('global')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                leaderboardMode === 'global'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              <IonIcon icon={globeOutline} className="w-4 h-4" />
              Global
            </button>
            <button
              onClick={() => setLeaderboardMode('friends')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                leaderboardMode === 'friends'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              <IonIcon icon={peopleOutline} className="w-4 h-4" />
              Friends
            </button>
          </div>

          {/* My Position */}
          {myEntry && (
            <div className="bg-gradient-to-r from-primary/20 to-amber-600/20 rounded-2xl p-4 border border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/30 rounded-full flex items-center justify-center text-white font-bold">
                    #{myRank}
                  </div>
                  <div>
                    <div className="text-white font-medium">Your Position</div>
                    <div className="text-amber-400 text-sm">{myEntry.progress?.totalWords || 0} words learned</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">
                {leaderboardMode === 'global' ? 'Global' : 'Friends'} Leaderboard
              </h3>
              <span className="text-xs text-stone-400">By words learned</span>
            </div>

            {leaderboardLoading ? (
              <div className="text-center py-8 text-stone-500">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <IonIcon icon={trophyOutline} className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isMe = entry.id === user?.id;
                  const rankColors = ['text-amber-400', 'text-stone-300', 'text-amber-700'];
                  const rankBg = ['bg-amber-400/10 border-amber-400/30', 'bg-stone-400/10 border-stone-400/30', 'bg-amber-700/10 border-amber-700/30'];

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                        isMe
                          ? 'bg-primary/10 border border-primary/30'
                          : index < 3
                            ? `${rankBg[index]} border`
                            : 'bg-stone-900/30 hover:bg-stone-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${
                          index < 3 ? rankColors[index] : 'text-stone-500'
                        }`}>
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                        </div>
                        <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-xl font-medium text-stone-300">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-medium ${isMe ? 'text-primary' : 'text-white'}`}>
                            {entry.username} {isMe && '(You)'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <IonIcon icon={flameOutline} className="w-3 h-3 text-orange-400" />
                              {entry.progress?.currentStreak || 0}
                            </span>
                            <span>HSK {entry.progress?.hskLevel || 1}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${index < 3 ? rankColors[index] : 'text-white'}`}>
                          {entry.progress?.totalWords || 0}
                        </div>
                        <div className="text-xs text-stone-500">words</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
