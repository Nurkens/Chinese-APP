/**
 * ⚔️ useBattleEngine Hook
 *
 * Manages battle state, combat logic, and damage calculations.
 * Core hook for RPG battle system.
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  BattleState,
  Monster,
  Question,
  AttackResult,
  BattleRewards,
  HanziDrawingResult,
} from '../types/battle.types';

interface UseBattleEngineReturn {
  battleState: BattleState | null;
  startBattle: (monster: Monster) => void;
  attack: (answer: string, timeSpent: number) => AttackResult;
  useUltimate: (drawingResult: HanziDrawingResult) => AttackResult;
  endBattle: () => BattleRewards | null;
  resetBattle: () => void;
}

const INITIAL_PLAYER_HP = 100;
const ULTIMATE_CHARGE_PER_CORRECT = 25;
const COMBO_MULTIPLIER = 0.1; // 10% extra damage per combo
const CRITICAL_HIT_THRESHOLD = 5; // Seconds - faster = critical

export const useBattleEngine = (): UseBattleEngineReturn => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Start a new battle
  const startBattle = useCallback((monster: Monster) => {
    const initialState: BattleState = {
      battleId: `battle-${Date.now()}`,
      playerHP: INITIAL_PLAYER_HP,
      playerMaxHP: INITIAL_PLAYER_HP,
      monsterHP: monster.maxHP,
      monsterMaxHP: monster.maxHP,
      currentQuestion: null,
      turn: 'player',
      ultimateCharge: 0,
      isUltimateActive: false,
      combo: 0,
      round: 1,
      status: 'active',
    };

    setBattleState(initialState);
    setCurrentMonster(monster);
    setStartTime(new Date());

    // TODO: Fetch questions from backend
    // For now, use mock questions
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        type: 'multiple_choice',
        difficulty: 1,
        question: 'What does 你好 (nǐ hǎo) mean?',
        options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
        correctAnswer: 'Hello',
        hanzi: '你好',
        timeLimit: 30,
      },
      {
        id: 'q2',
        type: 'type_answer',
        difficulty: 1,
        question: 'Type the pinyin for 谢谢',
        correctAnswer: 'xièxie',
        hanzi: '谢谢',
        explanation: 'xiè xie means "thank you"',
      },
      {
        id: 'q3',
        type: 'hanzi_drawing',
        difficulty: 2,
        question: 'Draw the character for "person"',
        correctAnswer: '人',
        hanzi: '人',
      },
    ];

    setQuestions(mockQuestions);
    setQuestionIndex(0);

    // Set first question
    setBattleState((prev) =>
      prev ? { ...prev, currentQuestion: mockQuestions[0] } : null
    );
  }, []);

  // Calculate damage based on player stats and combo
  const calculateDamage = useCallback(
    (isCorrect: boolean, timeSpent: number, combo: number): number => {
      if (!isCorrect) return 0;

      const baseDamage = 20;
      const comboBonus = combo * COMBO_MULTIPLIER * baseDamage;
      const criticalHit = timeSpent < CRITICAL_HIT_THRESHOLD;
      const criticalMultiplier = criticalHit ? 1.5 : 1;

      return Math.floor((baseDamage + comboBonus) * criticalMultiplier);
    },
    []
  );

  // Handle player attack
  const attack = useCallback(
    (answer: string, timeSpent: number): AttackResult => {
      if (!battleState || !currentMonster) {
        throw new Error('No active battle');
      }

      const question = battleState.currentQuestion;
      if (!question) {
        throw new Error('No current question');
      }

      // Check answer
      const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

      // Calculate damage
      const damage = calculateDamage(isCorrect, timeSpent, battleState.combo);
      const criticalHit = isCorrect && timeSpent < CRITICAL_HIT_THRESHOLD;

      // Update battle state
      let newPlayerHP = battleState.playerHP;
      let newMonsterHP = battleState.monsterHP;
      let newCombo = battleState.combo;
      let newUltimateCharge = battleState.ultimateCharge;

      if (isCorrect) {
        newMonsterHP = Math.max(0, newMonsterHP - damage);
        newCombo += 1;
        newUltimateCharge = Math.min(100, newUltimateCharge + ULTIMATE_CHARGE_PER_CORRECT);
      } else {
        // Wrong answer - take damage
        const monsterDamage = Math.floor(currentMonster.attack * 0.5);
        newPlayerHP = Math.max(0, newPlayerHP - monsterDamage);
        newCombo = 0; // Reset combo on wrong answer
      }

      // Check battle end conditions
      let newStatus: BattleState['status'] = 'active';
      if (newMonsterHP <= 0) {
        newStatus = 'victory';
      } else if (newPlayerHP <= 0) {
        newStatus = 'defeat';
      }

      // Move to next question
      const nextQuestionIndex = questionIndex + 1;
      const nextQuestion = nextQuestionIndex < questions.length ? questions[nextQuestionIndex] : null;

      setBattleState((prev) =>
        prev
          ? {
              ...prev,
              playerHP: newPlayerHP,
              monsterHP: newMonsterHP,
              combo: newCombo,
              ultimateCharge: newUltimateCharge,
              currentQuestion: nextQuestion,
              turn: 'monster',
              round: prev.round + 1,
              status: newStatus,
            }
          : null
      );

      setQuestionIndex(nextQuestionIndex);

      return {
        isCorrect,
        damage,
        criticalHit,
        ultimateChargeGain: isCorrect ? ULTIMATE_CHARGE_PER_CORRECT : 0,
        combo: newCombo,
        newPlayerHP,
        newMonsterHP,
        explanation: question.explanation,
      };
    },
    [battleState, currentMonster, questionIndex, questions, calculateDamage]
  );

  // Use ultimate move (Hanzi Drawing)
  const useUltimate = useCallback(
    (drawingResult: HanziDrawingResult): AttackResult => {
      if (!battleState || !currentMonster) {
        throw new Error('No active battle');
      }

      if (battleState.ultimateCharge < 100) {
        throw new Error('Ultimate not charged');
      }

      // Calculate ultimate damage based on drawing accuracy
      const baseDamage = 50;
      const accuracyMultiplier = drawingResult.accuracy / 100;
      const damage = Math.floor(baseDamage * accuracyMultiplier);

      const newMonsterHP = Math.max(0, battleState.monsterHP - damage);
      const newStatus: BattleState['status'] = newMonsterHP <= 0 ? 'victory' : 'active';

      setBattleState((prev) =>
        prev
          ? {
              ...prev,
              monsterHP: newMonsterHP,
              ultimateCharge: 0,
              isUltimateActive: false,
              status: newStatus,
            }
          : null
      );

      return {
        isCorrect: drawingResult.accuracy >= 70,
        damage,
        criticalHit: drawingResult.accuracy >= 95,
        ultimateChargeGain: 0,
        combo: battleState.combo,
        newPlayerHP: battleState.playerHP,
        newMonsterHP,
        explanation: `Ultimate Move: ${damage} damage dealt!`,
      };
    },
    [battleState, currentMonster]
  );

  // End battle and calculate rewards
  const endBattle = useCallback((): BattleRewards | null => {
    if (!battleState || !currentMonster || !startTime) return null;

    const endTime = new Date();
    const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000; // seconds

    // Calculate rank
    const hpPercentage = (battleState.playerHP / battleState.playerMaxHP) * 100;
    const rank = hpPercentage === 100 ? 'S' : hpPercentage >= 80 ? 'A' : hpPercentage >= 60 ? 'B' : hpPercentage >= 40 ? 'C' : 'D';

    // Calculate bonuses
    const perfectRound = battleState.playerHP === battleState.playerMaxHP;
    const speedBonus = timeSpent < 60 ? 50 : timeSpent < 120 ? 25 : 0;
    const comboBonus = Math.floor(battleState.combo * 5);

    const baseRewards = currentMonster.rewards;
    const totalSpiritStones = baseRewards.spiritStones + speedBonus + comboBonus;

    const rewards: BattleRewards = {
      spiritStones: totalSpiritStones,
      experience: baseRewards.experience,
      rank,
      perfectRound,
      speedBonus,
      comboBonus,
      cardDrops: [], // TODO: Implement card drop logic
    };

    // Reset battle
    setBattleState(null);
    setCurrentMonster(null);
    setQuestions([]);
    setQuestionIndex(0);
    setStartTime(null);

    return rewards;
  }, [battleState, currentMonster, startTime]);

  // Reset battle
  const resetBattle = useCallback(() => {
    setBattleState(null);
    setCurrentMonster(null);
    setQuestions([]);
    setQuestionIndex(0);
    setStartTime(null);
  }, []);

  return {
    battleState,
    startBattle,
    attack,
    useUltimate,
    endBattle,
    resetBattle,
  };
};
