// ═══════════════════════════════════════════════════════════════
// FitOptim AI — NSGA-II Inspired Plan Optimizer
// Generates real, mathematically-optimized fitness & nutrition plans
// ═══════════════════════════════════════════════════════════════

import { FOOD_DB } from './food-data.js';
import { EXERCISE_DB } from './exercise-data.js';

// ── TDEE & Macro Calculator ───────────────────────────────────
function calcBMR(profile) {
  const w = profile.weight || 65;
  const h = profile.height || 170;
  const a = profile.age || 25;
  if (profile.gender === 'female') return 10 * w + 6.25 * h - 5 * a - 161;
  return 10 * w + 6.25 * h - 5 * a + 5;
}

function calcTDEE(profile) {
  const bmr = calcBMR(profile);
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(bmr * (multipliers[profile.activity] || 1.55));
}

function getCalorieTarget(tdee, goal) {
  const adjustments = {
    weight_loss: -0.2,      // 20% deficit
    muscle_gain: 0.15,      // 15% surplus
    maintenance: 0,
    endurance: 0.1,
    flexibility: -0.05,
  };
  return Math.round(tdee * (1 + (adjustments[goal] || 0)));
}

function getMacroSplit(goal, calories) {
  const splits = {
    weight_loss:  { protein: 0.35, carbs: 0.35, fat: 0.30 },
    muscle_gain:  { protein: 0.30, carbs: 0.45, fat: 0.25 },
    maintenance:  { protein: 0.25, carbs: 0.45, fat: 0.30 },
    endurance:    { protein: 0.20, carbs: 0.55, fat: 0.25 },
    flexibility:  { protein: 0.25, carbs: 0.45, fat: 0.30 },
  };
  const s = splits[goal] || splits.maintenance;
  return {
    protein: Math.round(calories * s.protein / 4),
    carbs: Math.round(calories * s.carbs / 4),
    fat: Math.round(calories * s.fat / 9),
  };
}

// ── Food Selection Engine ─────────────────────────────────────
function getFoodsForRegion(region, diet) {
  const foods = FOOD_DB.filter(f => {
    // Filter by diet
    if (diet === 'veg' && f.type === 'non-veg') return false;
    if (diet === 'vegan' && (f.type === 'non-veg' || f.type === 'dairy')) return false;
    // Filter by region (allow 'universal' foods too)
    if (f.region !== 'universal' && f.region !== region) {
      // Include some cross-region foods with lower probability
      return Math.random() < 0.15;
    }
    return true;
  });
  return foods;
}

function selectFoodsForMeal(foods, mealType, targetCals, targetMacros, budget) {
  // Filter foods appropriate for this meal
  const candidates = foods.filter(f => f.meals.includes(mealType));
  if (candidates.length === 0) return [];

  // Score and select foods using a greedy approach with randomization
  const selected = [];
  let remainingCals = targetCals;
  let remainingProtein = targetMacros.protein;
  let remainingCost = budget;
  const maxItems = mealType === 'snack' ? 2 : 4;

  for (let i = 0; i < maxItems && remainingCals > 50; i++) {
    // Score each candidate
    const scored = candidates.map(food => {
      const servings = Math.min(remainingCals / food.calories, 2.5);
      const cals = food.calories * servings;
      const calFit = Math.max(0, 1 - Math.abs(cals - remainingCals / (maxItems - i)) / remainingCals);
      const proteinScore = food.protein / food.calories * 10;
      const costFit = food.cost <= remainingCost ? 1 : 0;
      const variety = selected.some(s => s.name === food.name) ? 0 : 1;
      const random = Math.random() * 0.3; // Add randomness for variety across generations
      return { food, score: calFit * 3 + proteinScore * 2 + costFit * 2 + variety * 3 + random, servings: Math.max(0.5, Math.min(servings, 2)) };
    });

    scored.sort((a, b) => b.score - a.score);
    const pick = scored[Math.floor(Math.random() * Math.min(3, scored.length))]; // Top 3 random pick

    if (pick) {
      const servingSize = Math.round(pick.servings * 10) / 10;
      selected.push({
        name: pick.food.name,
        portion: `${Math.round(pick.food.serving * servingSize)}${pick.food.unit}`,
        calories: Math.round(pick.food.calories * servingSize),
        protein: Math.round(pick.food.protein * servingSize),
        carbs: Math.round(pick.food.carbs * servingSize),
        fat: Math.round(pick.food.fat * servingSize),
        cost: Math.round(pick.food.cost * servingSize),
      });
      remainingCals -= pick.food.calories * servingSize;
      remainingProtein -= pick.food.protein * servingSize;
      remainingCost -= pick.food.cost * servingSize;
    }
  }

  return selected;
}

// ── Exercise Selection Engine ─────────────────────────────────
function selectExercises(profile, goal, overrides = {}) {
  const equipment = profile.equipment || [];
  const workoutDays = overrides.workoutDays || profile.weekly_workout_days || 4;
  const fitnessLevel = detectFitnessLevel(profile);

  // Filter exercises by available equipment and fitness level
  let candidates = EXERCISE_DB.filter(ex => {
    if (ex.equipment !== 'none' && !equipment.includes(ex.equipment) && !equipment.includes('gym')) return false;
    if (fitnessLevel === 'beginner' && ex.difficulty === 'advanced') return false;
    return true;
  });

  // Prioritize exercises by goal
  const goalPriority = {
    weight_loss: ['cardio', 'compound', 'hiit'],
    muscle_gain: ['compound', 'isolation', 'bodyweight'],
    maintenance: ['compound', 'cardio', 'flexibility'],
    endurance: ['cardio', 'compound', 'hiit'],
    flexibility: ['flexibility', 'bodyweight', 'cardio'],
  };

  const priorities = goalPriority[goal] || goalPriority.maintenance;
  candidates.sort((a, b) => {
    const aIdx = priorities.indexOf(a.category);
    const bIdx = priorities.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  // Pick exercises - balance muscle groups
  const selected = [];
  const usedMuscles = new Set();
  const targetCount = goal === 'weight_loss' ? 6 : goal === 'muscle_gain' ? 7 : 5;

  for (const ex of candidates) {
    if (selected.length >= targetCount) break;
    // Avoid too many exercises for same muscle group
    if (ex.muscles.every(m => usedMuscles.has(m)) && selected.length > 2) continue;

    const reps = getRepScheme(ex, goal, fitnessLevel);
    selected.push({
      name: ex.name,
      detail: reps,
      muscles: ex.muscles,
      category: ex.category,
      caloriesBurned: Math.round(ex.calPerMin * parseInt(reps) * (ex.category === 'cardio' ? 1 : 0.08)),
    });
    ex.muscles.forEach(m => usedMuscles.add(m));
  }

  return selected;
}

function getRepScheme(exercise, goal, level) {
  if (exercise.category === 'cardio') {
    const durations = { beginner: '15 mins', intermediate: '25 mins', advanced: '35 mins' };
    return durations[level] || '20 mins';
  }
  if (exercise.category === 'flexibility') {
    return `${level === 'beginner' ? '20' : '30'} sec hold × ${level === 'beginner' ? 2 : 3} sets`;
  }
  if (exercise.category === 'hiit') {
    return `${level === 'beginner' ? '30s on/30s off' : '40s on/20s off'} × ${level === 'beginner' ? 4 : 6} rounds`;
  }

  const schemes = {
    weight_loss:  { beginner: '3 × 12-15', intermediate: '4 × 12-15', advanced: '4 × 15-20' },
    muscle_gain:  { beginner: '3 × 8-10', intermediate: '4 × 8-12', advanced: '5 × 6-10' },
    maintenance:  { beginner: '3 × 10-12', intermediate: '3 × 10-12', advanced: '4 × 10-12' },
  };
  return (schemes[goal] || schemes.maintenance)[level] || '3 × 10-12';
}

function detectFitnessLevel(profile) {
  const scores = profile.fitness_scores || {};
  const avg = ((scores.strength || 5) + (scores.cardio || 5) + (scores.flexibility || 5)) / 3;
  if (avg <= 3.5) return 'beginner';
  if (avg <= 6.5) return 'intermediate';
  return 'advanced';
}

// ── NSGA-II Inspired Optimizer ────────────────────────────────
// Runs multiple candidate plans and selects the best one based on
// multi-objective optimization (caloric accuracy, macro balance, cost, variety)
export function generateOptimalPlan(profile, overrides = {}) {
  const tdee = profile.tdee || calcTDEE(profile);
  const goal = overrides.goal || profile.goal || 'maintenance';
  const targetCals = getCalorieTarget(tdee, goal);
  const macros = getMacroSplit(goal, targetCals);
  const region = overrides.region || profile.region || 'indian';
  const diet = overrides.diet || profile.diet || 'non-veg';
  const dailyBudget = overrides.budget || profile.budget || 300;

  const foods = getFoodsForRegion(region, diet);

  // Generate population of plans
  const POPULATION_SIZE = 12;
  const population = [];

  for (let i = 0; i < POPULATION_SIZE; i++) {
    const mealPlan = generateMealPlan(foods, targetCals, macros, dailyBudget);
    const score = scorePlan(mealPlan, targetCals, macros, dailyBudget);
    population.push({ meals: mealPlan, score });
  }

  // Select the best plan (Pareto-optimal: balanced across all objectives)
  population.sort((a, b) => b.score - a.score);
  const bestMeals = population[0].meals;

  // Calculate actual totals
  const totals = bestMeals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      acc.cost += item.cost;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });

  // Select exercises
  const exercises = selectExercises(profile, goal, overrides);

  // Build grocery list
  const groceryMap = {};
  bestMeals.forEach(meal => {
    meal.items.forEach(item => {
      if (groceryMap[item.name]) {
        groceryMap[item.name].quantity += 1;
      } else {
        groceryMap[item.name] = { name: item.name, quantity: 1, portion: item.portion, cost: item.cost };
      }
    });
  });
  const groceryList = Object.values(groceryMap);

  // Generate title
  const goalNames = { weight_loss: 'Lean Burn', muscle_gain: 'Muscle Builder', maintenance: 'Balance', endurance: 'Endurance Pro', flexibility: 'Flex & Flow' };
  const title = `${goalNames[goal] || 'Custom'} Plan — ${Math.round(totals.calories)} kcal`;

  // Generate tips
  const tips = generateTips(profile, goal, totals, macros);

  return {
    title,
    goal,
    stats: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      cost: Math.round(totals.cost),
    },
    meals: bestMeals.map(m => ({
      name: m.label,
      items: m.items.map(it => `${it.portion} ${it.name}`).join(', '),
      calories: Math.round(m.items.reduce((s, it) => s + it.calories, 0)),
    })),
    exercises: exercises.map(e => ({ name: e.name, detail: e.detail })),
    tips,
    groceryList,
  };
}

function generateMealPlan(foods, targetCals, macros, budget) {
  const mealSchedule = [
    { type: 'breakfast', label: 'Breakfast (7:30 AM)', calShare: 0.25 },
    { type: 'snack', label: 'Mid-Morning Snack (10:30 AM)', calShare: 0.10 },
    { type: 'lunch', label: 'Lunch (1:00 PM)', calShare: 0.30 },
    { type: 'snack', label: 'Evening Snack (4:30 PM)', calShare: 0.10 },
    { type: 'dinner', label: 'Dinner (7:30 PM)', calShare: 0.25 },
  ];

  return mealSchedule.map(meal => {
    const mealCals = targetCals * meal.calShare;
    const mealMacros = {
      protein: macros.protein * meal.calShare,
      carbs: macros.carbs * meal.calShare,
      fat: macros.fat * meal.calShare,
    };
    const mealBudget = budget * meal.calShare;
    const items = selectFoodsForMeal(foods, meal.type, mealCals, mealMacros, mealBudget);
    return { ...meal, items };
  });
}

function scorePlan(mealPlan, targetCals, targetMacros, budget) {
  const totals = mealPlan.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      acc.cost += item.cost;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });

  // Objective 1: Caloric accuracy (closer to target = better)
  const calAccuracy = Math.max(0, 1 - Math.abs(totals.calories - targetCals) / targetCals);

  // Objective 2: Protein accuracy
  const proteinAccuracy = Math.max(0, 1 - Math.abs(totals.protein - targetMacros.protein) / targetMacros.protein);

  // Objective 3: Budget fitness
  const budgetFit = totals.cost <= budget ? 1 : Math.max(0, 1 - (totals.cost - budget) / budget);

  // Objective 4: Variety (number of unique foods)
  const allFoods = new Set(mealPlan.flatMap(m => m.items.map(i => i.name)));
  const variety = Math.min(1, allFoods.size / 10);

  // Weighted sum  
  return calAccuracy * 4 + proteinAccuracy * 3 + budgetFit * 2 + variety * 1;
}

function generateTips(profile, goal, totals, macros) {
  const tips = [];
  const age = profile.age || 25;

  if (goal === 'muscle_gain') {
    tips.push(`Aim for ${Math.round(profile.weight * 1.8)}g protein daily (1.8g/kg). Space it evenly across meals for optimal muscle protein synthesis.`);
    if (age > 40) tips.push('At your age, prioritize recovery. Ensure 7-8 hours of sleep and consider adding collagen-rich foods.');
  } else if (goal === 'weight_loss') {
    tips.push(`Your ${Math.round((calcTDEE(profile) - totals.calories) / calcTDEE(profile) * 100)}% deficit is sustainable. Don't go below 1200 kcal. Prioritize protein to preserve muscle.`);
    tips.push('Drink water before meals — studies show it reduces calorie intake by 13%.');
  } else {
    tips.push('Consistency is key for maintenance. Track your weight weekly and adjust if it drifts more than 2kg.');
  }

  if (profile.stress_level && profile.stress_level > 7) {
    tips.push('High stress detected — elevated cortisol can cause weight gain. Consider yoga or meditation.');
  }

  return tips.join(' ');
}
