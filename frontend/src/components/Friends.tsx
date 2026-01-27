import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  peopleOutline,
  personAddOutline,
  trophyOutline,
  flameOutline,
  checkmarkCircle,
  closeCircle,
  searchOutline,
  chatbubbleOutline,
  shieldOutline,
  medalOutline,
  ribbonOutline,
  arrowUpOutline,
  arrowDownOutline,
  timeOutline,
} from 'ionicons/icons';

interface Friend {
  id: string;
  username: string;
  avatar: string;
  level: number;
  streak: number;
  wordsLearned: number;
  weeklyXP: number;
  isOnline: boolean;
  lastActive: string;
}

interface FriendRequest {
  id: string;
  username: string;
  avatar: string;
  level: number;
  type: 'incoming' | 'outgoing';
}

interface Challenge {
  id: string;
  challenger: string;
  challengerAvatar: string;
  opponent: string;
  opponentAvatar: string;
  type: 'words' | 'streak' | 'reviews';
  target: number;
  challengerProgress: number;
  opponentProgress: number;
  endsAt: string;
  status: 'active' | 'won' | 'lost' | 'pending';
}

const Friends: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'friends' | 'leaderboard' | 'challenges'>('friends');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [challengeType, setChallengeType] = useState<'words' | 'streak' | 'reviews'>('words');
  const [challengeTarget, setChallengeTarget] = useState(20);

  // Mock data
  const [friends] = useState<Friend[]>([
    { id: '1', username: 'LingMaster', avatar: '🐉', level: 5, streak: 42, wordsLearned: 580, weeklyXP: 1250, isOnline: true, lastActive: 'now' },
    { id: '2', username: 'HanziHero', avatar: '🦊', level: 3, streak: 15, wordsLearned: 320, weeklyXP: 890, isOnline: true, lastActive: 'now' },
    { id: '3', username: 'PinyinPro', avatar: '🐼', level: 4, streak: 28, wordsLearned: 450, weeklyXP: 1100, isOnline: false, lastActive: '2h ago' },
    { id: '4', username: 'CharacterKing', avatar: '🐯', level: 6, streak: 100, wordsLearned: 890, weeklyXP: 2100, isOnline: false, lastActive: '5h ago' },
    { id: '5', username: 'ToneWarrior', avatar: '🦅', level: 2, streak: 7, wordsLearned: 150, weeklyXP: 430, isOnline: false, lastActive: '1d ago' },
  ]);

  const [friendRequests] = useState<FriendRequest[]>([
    { id: '1', username: 'MandarinNinja', avatar: '🥷', level: 4, type: 'incoming' },
    { id: '2', username: 'ZhongwenFan', avatar: '🎋', level: 2, type: 'incoming' },
    { id: '3', username: 'DragonLearner', avatar: '🐲', level: 3, type: 'outgoing' },
  ]);

  const [challenges] = useState<Challenge[]>([
    { id: '1', challenger: 'You', challengerAvatar: '🐼', opponent: 'LingMaster', opponentAvatar: '🐉', type: 'words', target: 30, challengerProgress: 18, opponentProgress: 22, endsAt: '2d', status: 'active' },
    { id: '2', challenger: 'HanziHero', challengerAvatar: '🦊', opponent: 'You', opponentAvatar: '🐼', type: 'reviews', target: 50, challengerProgress: 35, opponentProgress: 41, endsAt: '5d', status: 'active' },
    { id: '3', challenger: 'You', challengerAvatar: '🐼', opponent: 'PinyinPro', opponentAvatar: '🐼', type: 'streak', target: 7, challengerProgress: 7, opponentProgress: 5, endsAt: 'ended', status: 'won' },
  ]);

  const myStats = { username: 'You', avatar: '🐼', level: 3, streak: 12, wordsLearned: 280, weeklyXP: 950 };

  // Sort leaderboard by weeklyXP
  const leaderboard = [...friends, { ...myStats, id: 'me', isOnline: true, lastActive: 'now' }]
    .sort((a, b) => b.weeklyXP - a.weeklyXP);

  const myRank = leaderboard.findIndex(f => f.id === 'me' || f.username === 'You') + 1;

  const searchResults = searchQuery.length >= 2
    ? [
        { id: 'r1', username: searchQuery + '_learner', avatar: '🎓', level: 2 },
        { id: 'r2', username: 'study_' + searchQuery, avatar: '📚', level: 4 },
      ]
    : [];

  const handleSendChallenge = () => {
    if (!selectedFriend) return;
    setShowChallenge(false);
    setSelectedFriend(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Friends</h1>
          <p className="text-amber-200/60 mt-1">Compete and learn together</p>
        </div>
        <button
          onClick={() => setShowAddFriend(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all hover:scale-105"
        >
          <IonIcon icon={personAddOutline} className="w-5 h-5" />
          <span className="text-sm">Add Friend</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-stone-800/60 rounded-xl p-1">
        {[
          { key: 'friends', label: 'Friends', icon: peopleOutline },
          { key: 'leaderboard', label: 'Leaderboard', icon: trophyOutline },
          { key: 'challenges', label: 'Challenges', icon: shieldOutline },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
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

      {/* Friends List */}
      {activeSection === 'friends' && (
        <div className="space-y-4">
          {/* Friend Requests */}
          {friendRequests.filter(r => r.type === 'incoming').length > 0 && (
            <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary">
                  {friendRequests.filter(r => r.type === 'incoming').length}
                </span>
                Friend Requests
              </h3>
              <div className="space-y-3">
                {friendRequests.filter(r => r.type === 'incoming').map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-stone-900/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-stone-700 rounded-full flex items-center justify-center text-2xl">
                        {req.avatar}
                      </div>
                      <div>
                        <div className="text-white font-medium">{req.username}</div>
                        <div className="text-stone-400 text-xs">Level {req.level}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all">
                        <IonIcon icon={checkmarkCircle} className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all">
                        <IonIcon icon={closeCircle} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends Grid */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <h3 className="text-lg font-medium text-white mb-4">
              My Friends ({friends.length})
            </h3>
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between bg-stone-900/50 hover:bg-stone-900/70 rounded-xl p-4 transition-all animate-slideUp cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => { setSelectedFriend(friend); setShowChallenge(true); }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-stone-700 rounded-full flex items-center justify-center text-3xl">
                        {friend.avatar}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-stone-900"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{friend.username}</div>
                      <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                        <span className="flex items-center gap-1">
                          <IonIcon icon={flameOutline} className="w-3 h-3 text-orange-400" />
                          {friend.streak}d
                        </span>
                        <span>HSK {friend.level}</span>
                        <span>{friend.isOnline ? 'Online' : friend.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-medium">{friend.weeklyXP} XP</div>
                    <div className="text-stone-500 text-xs">{friend.wordsLearned} words</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Outgoing */}
          {friendRequests.filter(r => r.type === 'outgoing').length > 0 && (
            <div className="bg-stone-800/40 rounded-2xl p-4 border border-stone-700">
              <h4 className="text-sm text-stone-400 mb-3">Pending Requests</h4>
              {friendRequests.filter(r => r.type === 'outgoing').map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{req.avatar}</span>
                    <span className="text-stone-300 text-sm">{req.username}</span>
                  </div>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <IonIcon icon={timeOutline} className="w-3 h-3" />
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeSection === 'leaderboard' && (
        <div className="space-y-4">
          {/* My Position */}
          <div className="bg-gradient-to-r from-primary/20 to-amber-600/20 rounded-2xl p-4 border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/30 rounded-full flex items-center justify-center text-white font-bold">
                  #{myRank}
                </div>
                <div>
                  <div className="text-white font-medium">Your Position</div>
                  <div className="text-amber-400 text-sm">{myStats.weeklyXP} XP this week</div>
                </div>
              </div>
              {myRank <= 3 && (
                <IonIcon icon={medalOutline} className="w-8 h-8 text-amber-400" />
              )}
            </div>
          </div>

          {/* Weekly Leaderboard */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Weekly Leaderboard</h3>
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <IonIcon icon={timeOutline} className="w-3 h-3" />
                Resets in 3d
              </span>
            </div>

            <div className="space-y-2">
              {leaderboard.map((user, index) => {
                const isMe = user.username === 'You';
                const rankColors = ['text-amber-400', 'text-stone-300', 'text-amber-700'];
                const rankBg = ['bg-amber-400/10 border-amber-400/30', 'bg-stone-400/10 border-stone-400/30', 'bg-amber-700/10 border-amber-700/30'];

                return (
                  <div
                    key={user.id || index}
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
                      <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-xl">
                        {user.avatar}
                      </div>
                      <div>
                        <div className={`font-medium ${isMe ? 'text-primary' : 'text-white'}`}>
                          {user.username} {isMe && '(You)'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <IonIcon icon={flameOutline} className="w-3 h-3 text-orange-400" />
                            {user.streak}
                          </span>
                          <span>{user.wordsLearned} words</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${index < 3 ? rankColors[index] : 'text-white'}`}>
                        {user.weeklyXP}
                      </div>
                      <div className="text-xs text-stone-500">XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Challenges */}
      {activeSection === 'challenges' && (
        <div className="space-y-4">
          {/* Active Challenges */}
          <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
            <h3 className="text-lg font-medium text-white mb-4">Active Challenges</h3>

            {challenges.filter(c => c.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <IonIcon icon={shieldOutline} className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active challenges</p>
                <p className="text-xs mt-1">Challenge a friend from your friends list!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {challenges.filter(c => c.status === 'active').map((challenge) => {
                  const isChallenger = challenge.challenger === 'You';
                  const myProgress = isChallenger ? challenge.challengerProgress : challenge.opponentProgress;
                  const theirProgress = isChallenger ? challenge.opponentProgress : challenge.challengerProgress;
                  const opponent = isChallenger ? challenge.opponent : challenge.challenger;
                  const opponentAvatar = isChallenger ? challenge.opponentAvatar : challenge.challengerAvatar;
                  const amWinning = myProgress > theirProgress;

                  return (
                    <div key={challenge.id} className="bg-stone-900/50 rounded-2xl p-5 border border-stone-700">
                      {/* Challenge Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            challenge.type === 'words' ? 'bg-blue-500/20 text-blue-400' :
                            challenge.type === 'streak' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {challenge.type === 'words' ? 'Learn Words' :
                             challenge.type === 'streak' ? 'Keep Streak' : 'Complete Reviews'}
                          </span>
                          <span className="text-stone-500 text-xs">Target: {challenge.target}</span>
                        </div>
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <IonIcon icon={timeOutline} className="w-3 h-3" />
                          {challenge.endsAt}
                        </span>
                      </div>

                      {/* VS Display */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-xl">🐼</div>
                          <div>
                            <div className="text-white text-sm font-medium">You</div>
                            <div className={`text-lg font-bold ${amWinning ? 'text-green-400' : 'text-stone-300'}`}>
                              {myProgress}
                            </div>
                          </div>
                        </div>

                        <div className="text-stone-500 text-sm font-bold">VS</div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">{opponent}</div>
                            <div className={`text-lg font-bold ${!amWinning ? 'text-green-400' : 'text-stone-300'}`}>
                              {theirProgress}
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-xl">
                            {opponentAvatar}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-2">
                        <div className="w-full bg-stone-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all"
                            style={{ width: `${(myProgress / challenge.target) * 100}%` }}
                          />
                        </div>
                        <div className="w-full bg-stone-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                            style={{ width: `${(theirProgress / challenge.target) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-center mt-3">
                        {amWinning ? (
                          <span className="text-green-400 text-xs flex items-center gap-1">
                            <IonIcon icon={arrowUpOutline} className="w-3 h-3" />
                            You're ahead by {myProgress - theirProgress}!
                          </span>
                        ) : (
                          <span className="text-orange-400 text-xs flex items-center gap-1">
                            <IonIcon icon={arrowDownOutline} className="w-3 h-3" />
                            Behind by {theirProgress - myProgress}. Keep going!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Challenges */}
          {challenges.filter(c => c.status === 'won' || c.status === 'lost').length > 0 && (
            <div className="bg-stone-800/40 rounded-3xl p-6 border border-stone-700">
              <h3 className="text-lg font-medium text-white mb-4">Completed</h3>
              <div className="space-y-3">
                {challenges.filter(c => c.status === 'won' || c.status === 'lost').map((challenge) => (
                  <div key={challenge.id} className={`flex items-center justify-between rounded-xl p-4 ${
                    challenge.status === 'won'
                      ? 'bg-green-900/20 border border-green-500/30'
                      : 'bg-red-900/20 border border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <IonIcon
                        icon={challenge.status === 'won' ? ribbonOutline : closeCircle}
                        className={`w-6 h-6 ${challenge.status === 'won' ? 'text-green-400' : 'text-red-400'}`}
                      />
                      <div>
                        <div className="text-white text-sm">
                          vs {challenge.opponent === 'You' ? challenge.challenger : challenge.opponent}
                        </div>
                        <div className="text-stone-400 text-xs capitalize">{challenge.type} challenge</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      challenge.status === 'won'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {challenge.status === 'won' ? 'Victory!' : 'Defeated'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowAddFriend(false)}
        >
          <div
            className="bg-stone-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-amber-700/30 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-primary">Add Friend</h3>
              <button
                onClick={() => setShowAddFriend(false)}
                className="p-2 text-stone-400 hover:text-white transition-colors"
              >
                <IonIcon icon={closeCircle} className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full pl-12 pr-4 py-3 bg-stone-700/50 text-white placeholder-stone-500 rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-stone-400 text-xs mb-2">Results</div>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-stone-800/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-xl">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-white text-sm">{user.username}</div>
                        <div className="text-stone-400 text-xs">Level {user.level}</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-lg transition-all">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                <IonIcon icon={searchOutline} className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Enter a username to find friends</p>
              </div>
            )}

            {searchQuery.length === 1 && (
              <div className="text-center py-4 text-stone-500 text-sm">
                Type at least 2 characters...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenge Friend Modal */}
      {showChallenge && selectedFriend && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => { setShowChallenge(false); setSelectedFriend(null); }}
        >
          <div
            className="bg-stone-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-amber-700/30 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-primary">Challenge</h3>
              <button
                onClick={() => { setShowChallenge(false); setSelectedFriend(null); }}
                className="p-2 text-stone-400 hover:text-white transition-colors"
              >
                <IonIcon icon={closeCircle} className="w-6 h-6" />
              </button>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-4 bg-stone-800/60 rounded-xl p-4 mb-6">
              <div className="w-14 h-14 bg-stone-700 rounded-full flex items-center justify-center text-3xl">
                {selectedFriend.avatar}
              </div>
              <div>
                <div className="text-white font-medium">{selectedFriend.username}</div>
                <div className="text-stone-400 text-xs">
                  HSK {selectedFriend.level} • {selectedFriend.wordsLearned} words • {selectedFriend.streak}d streak
                </div>
              </div>
            </div>

            {/* Challenge Type */}
            <div className="mb-4">
              <label className="block text-stone-400 text-sm mb-2">Challenge Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'words', label: 'Words', color: 'blue' },
                  { key: 'streak', label: 'Streak', color: 'orange' },
                  { key: 'reviews', label: 'Reviews', color: 'purple' },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setChallengeType(type.key as any)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      challengeType === type.key
                        ? `bg-${type.color}-500/30 text-${type.color}-400 border border-${type.color}-500/50`
                        : 'bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className="mb-6">
              <label className="block text-stone-400 text-sm mb-2">Target</label>
              <div className="flex items-center gap-3">
                {[10, 20, 30, 50].map((target) => (
                  <button
                    key={target}
                    onClick={() => setChallengeTarget(target)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      challengeTarget === target
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {target}
                  </button>
                ))}
              </div>
              <p className="text-stone-500 text-xs mt-2">
                {challengeType === 'words' && `First to learn ${challengeTarget} words wins`}
                {challengeType === 'streak' && `Maintain a ${challengeTarget} day streak`}
                {challengeType === 'reviews' && `First to complete ${challengeTarget} reviews wins`}
              </p>
            </div>

            {/* Send Challenge Button */}
            <button
              onClick={handleSendChallenge}
              className="w-full py-4 bg-gradient-to-r from-primary to-amber-600 text-white font-medium rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <IonIcon icon={shieldOutline} className="w-5 h-5" />
              Send Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
