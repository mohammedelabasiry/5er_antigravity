import fs from 'fs';
import path from 'path';
import { calculateScoreAndCategory, EvaluationInputs } from './evaluation';

// Paths for model weights
const WEIGHTS_FILE = path.join(process.cwd(), 'src', 'lib', 'model_weights.json');

// Interface for Neural Network Weights
interface NeuralNetworkWeights {
  weights1: number[][]; // 12 x 8 (hidden x input)
  biases1: number[];    // 12
  weights2Cat: number[][]; // 4 x 12 (categories A,B,C,D x hidden)
  biases2Cat: number[];    // 4
  weights2Amt: number[][]; // 1 x 12 (amount x hidden)
  biases2Amt: number[];    // 1
}

export interface MLPredictionResult {
  score: number;
  category: 'A' | 'B' | 'C' | 'D';
  recommendedAmount: number;
  probabilities: { A: number; B: number; C: number; D: number };
  confidence: number; // overall prediction confidence (0-100)
}

class PovertyAssessmentModel {
  private weights!: NeuralNetworkWeights;
  private isLoaded = false;

  constructor() {
    this.ensureInitialized();
  }

  // Activation functions
  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private sigmoidDerivative(sigValue: number): number {
    return sigValue * (1 - sigValue);
  }

  private softmax(arr: number[]): number[] {
    const max = Math.max(...arr);
    const exps = arr.map((x) => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((x) => x / sum);
  }

  // Pre-process and normalize input features
  private preprocessInputs(inputs: EvaluationInputs): number[] {
    const income = Number(inputs.monthlyIncome) || 0;
    const members = Number(inputs.familyMembersCount) || 1;
    const children = Number(inputs.childrenCount) || 0;
    const debt = Number(inputs.debtObligations) || 0;
    const support = Number(inputs.existingSupport) || 0;

    // 1. Income (Normalized: 1.0 for 0 income, scaling down to 0 for 12000+ income)
    const x1 = Math.max(0, 1 - income / 12000);

    // 2. Family Members (Normalized: max 10 members)
    const x2 = Math.min(10, members) / 10;

    // 3. Children (Normalized: max 8 children)
    const x3 = Math.min(8, children) / 8;

    // 4. Employment Status Mapping
    const emp = (inputs.employmentStatus || '').toLowerCase();
    let x4 = 0.0;
    if (emp.includes('unemployed') || emp.includes('no work') || emp.includes('none')) {
      x4 = 1.0;
    } else if (emp.includes('retired') || emp.includes('disabled') || emp.includes('elderly')) {
      x4 = 0.8;
    } else if (emp.includes('part-time') || emp.includes('casual') || emp.includes('seasonal') || emp.includes('laborer') || emp.includes('sewing')) {
      x4 = 0.5;
    } else if (emp.includes('full-time') || emp.includes('employed')) {
      x4 = 0.1;
    }

    // 5. Medical Conditions Severity Index
    const med = (inputs.medicalConditions || '').toLowerCase();
    let x5 = 0.0;
    if (
      med.includes('severe') ||
      med.includes('cancer') ||
      med.includes('renal') ||
      med.includes('kidney') ||
      med.includes('dialysis') ||
      med.includes('heart') ||
      med.includes('blind') ||
      med.includes('paralysis') ||
      med.includes('disabled')
    ) {
      x5 = 1.0;
    } else if (
      med.includes('moderate') ||
      med.includes('diabetes') ||
      med.includes('hypertension') ||
      med.includes('pressure') ||
      med.includes('asthma') ||
      med.includes('chronic')
    ) {
      x5 = 0.5;
    } else if (med.trim().length > 3) {
      x5 = 0.2;
    }

    // 6. Housing Burden
    const house = (inputs.housingStatus || '').toLowerCase();
    let x6 = 0.5; // default
    if (house.includes('rented') || house.includes('shared')) {
      x6 = 1.0;
    } else if (house.includes('owned') || house.includes('free')) {
      x6 = 0.0;
    }

    // 7. Debts (Normalized: max 12000)
    const x7 = Math.min(12000, debt) / 12000;

    // 8. Existing Support (Normalized: 1.0 for no support, down to 0 for 5000+ support)
    const x8 = Math.max(0, 1 - support / 5000);

    return [x1, x2, x3, x4, x5, x6, x7, x8];
  }

  // Forward Propagation
  public predict(inputs: EvaluationInputs): MLPredictionResult {
    this.ensureInitialized();
    const x = this.preprocessInputs(inputs);

    // 1. Hidden Layer
    const z1: number[] = [];
    const a1: number[] = [];
    for (let i = 0; i < 12; i++) {
      let sum = this.weights.biases1[i];
      for (let j = 0; j < 8; j++) {
        sum += x[j] * this.weights.weights1[i][j];
      }
      z1.push(sum);
      a1.push(this.relu(sum));
    }

    // 2. Category Output Layer
    const z2Cat: number[] = [];
    for (let i = 0; i < 4; i++) {
      let sum = this.weights.biases2Cat[i];
      for (let j = 0; j < 12; j++) {
        sum += a1[j] * this.weights.weights2Cat[i][j];
      }
      z2Cat.push(sum);
    }
    const probabilities = this.softmax(z2Cat);

    // Get max probability index (0: A, 1: B, 2: C, 3: D)
    let maxIdx = 0;
    let maxVal = probabilities[0];
    for (let i = 1; i < 4; i++) {
      if (probabilities[i] > maxVal) {
        maxVal = probabilities[i];
        maxIdx = i;
      }
    }

    const categories: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const predictedCategory = categories[maxIdx];

    // 3. Recommended Amount Output Layer
    let z2Amt = this.weights.biases2Amt[0];
    for (let j = 0; j < 12; j++) {
      z2Amt += a1[j] * this.weights.weights2Amt[0][j];
    }
    const amtNormalized = this.sigmoid(z2Amt);
    // Scale amount between 1000 EGP and 8000 EGP
    const recommendedAmount = Math.round(1000 + amtNormalized * 7000);

    // Calculate score mapping (rough indicator of poverty score out of 100)
    // A: 85-100, B: 70-84, C: 50-69, D: 0-49
    let baseScore = 0;
    if (predictedCategory === 'A') baseScore = 85 + (probabilities[0] * 15);
    else if (predictedCategory === 'B') baseScore = 70 + (probabilities[1] * 14);
    else if (predictedCategory === 'C') baseScore = 50 + (probabilities[2] * 19);
    else baseScore = Math.max(0, probabilities[3] * 49);

    const score = Math.round(Math.min(100, Math.max(0, baseScore)));
    const confidence = Math.round(maxVal * 100);

    return {
      score,
      category: predictedCategory,
      recommendedAmount,
      probabilities: {
        A: probabilities[0],
        B: probabilities[1],
        C: probabilities[2],
        D: probabilities[3],
      },
      confidence,
    };
  }

  // Single step Backpropagation (Gradient Descent)
  public trainStep(
    inputs: EvaluationInputs,
    targetCategory: 'A' | 'B' | 'C' | 'D',
    targetAmount: number,
    learningRate = 0.05
  ) {
    this.ensureInitialized();
    const x = this.preprocessInputs(inputs);

    // Category target vector (One-hot encoding)
    const targetCatMap: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 1, C: 2, D: 3 };
    const tCat = [0, 0, 0, 0];
    tCat[targetCatMap[targetCategory]] = 1;

    // Amount target normalized (scaled from [1000, 8000] to [0, 1])
    const tAmt = Math.max(0, Math.min(1, (targetAmount - 1000) / 7000));

    // --- FORWARD PASS (storing intermediate variables) ---
    const z1: number[] = [];
    const a1: number[] = [];
    for (let i = 0; i < 12; i++) {
      let sum = this.weights.biases1[i];
      for (let j = 0; j < 8; j++) {
        sum += x[j] * this.weights.weights1[i][j];
      }
      z1.push(sum);
      a1.push(this.relu(sum));
    }

    const z2Cat: number[] = [];
    for (let i = 0; i < 4; i++) {
      let sum = this.weights.biases2Cat[i];
      for (let j = 0; j < 12; j++) {
        sum += a1[j] * this.weights.weights2Cat[i][j];
      }
      z2Cat.push(sum);
    }
    const pCat = this.softmax(z2Cat);

    let z2Amt = this.weights.biases2Amt[0];
    for (let j = 0; j < 12; j++) {
      z2Amt += a1[j] * this.weights.weights2Amt[0][j];
    }
    const pAmt = this.sigmoid(z2Amt);

    // --- BACKWARD PASS ---
    // Gradients at Output Layer (Category classification, Cross Entropy Loss)
    const dZ2Cat = pCat.map((p, i) => p - tCat[i]);

    // Gradients at Output Layer (Amount regression, Mean Squared Error Loss)
    const dZ2Amt = (pAmt - tAmt) * this.sigmoidDerivative(pAmt);

    // Gradients for Output Weights and Biases
    const dW2Cat: number[][] = Array.from({ length: 4 }, () => Array(12).fill(0));
    const db2Cat = [...dZ2Cat];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 12; j++) {
        dW2Cat[i][j] = dZ2Cat[i] * a1[j];
      }
    }

    const dW2Amt: number[] = [];
    const db2Amt = dZ2Amt;
    for (let j = 0; j < 12; j++) {
      dW2Amt.push(dZ2Amt * a1[j]);
    }

    // Propagate gradients back to Hidden Layer
    const dA1: number[] = Array(12).fill(0);
    for (let j = 0; j < 12; j++) {
      // contributions from category outputs
      for (let i = 0; i < 4; i++) {
        dA1[j] += dZ2Cat[i] * this.weights.weights2Cat[i][j];
      }
      // contribution from amount output
      dA1[j] += dZ2Amt * this.weights.weights2Amt[0][j];
    }

    const dZ1: number[] = [];
    for (let j = 0; j < 12; j++) {
      dZ1.push(dA1[j] * this.reluDerivative(z1[j]));
    }

    // Gradients for Hidden Layer Weights and Biases
    const dW1: number[][] = Array.from({ length: 12 }, () => Array(8).fill(0));
    const db1 = [...dZ1];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 8; j++) {
        dW1[i][j] = dZ1[i] * x[j];
      }
    }

    // --- WEIGHT UPDATES (Gradient Descent) ---
    // Update Hidden Layer
    for (let i = 0; i < 12; i++) {
      this.weights.biases1[i] -= learningRate * db1[i];
      for (let j = 0; j < 8; j++) {
        this.weights.weights1[i][j] -= learningRate * dW1[i][j];
      }
    }

    // Update Category Output Layer
    for (let i = 0; i < 4; i++) {
      this.weights.biases2Cat[i] -= learningRate * db2Cat[i];
      for (let j = 0; j < 12; j++) {
        this.weights.weights2Cat[i][j] -= learningRate * dW2Cat[i][j];
      }
    }

    // Update Amount Output Layer
    this.weights.biases2Amt[0] -= learningRate * db2Amt;
    for (let j = 0; j < 12; j++) {
      this.weights.weights2Amt[0][j] -= learningRate * dW2Amt[j];
    }

    // Save weights back to file
    this.saveWeights();
  }

  // Load weights from file or initialize them
  private ensureInitialized() {
    if (this.isLoaded) return;

    try {
      if (fs.existsSync(WEIGHTS_FILE)) {
        const data = fs.readFileSync(WEIGHTS_FILE, 'utf8');
        this.weights = JSON.parse(data);
        this.isLoaded = true;
      } else {
        this.initializeWithPretraining();
      }
    } catch (err) {
      console.error('Error loading model weights, fallback to initialization:', err);
      this.initializeWithPretraining();
    }
  }

  // In case no weights exist, generate synthetic data and pre-train the model to mimic the rule-based logic
  private initializeWithPretraining() {
    console.log('No weights file found. Initializing AI Model and pre-training on synthetic data...');

    // Initialize with small random weights
    const initWeights = (rows: number, cols: number): number[][] =>
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.1)
      );
    const initBiases = (size: number): number[] => Array(size).fill(0.0);

    this.weights = {
      weights1: initWeights(12, 8),
      biases1: initBiases(12),
      weights2Cat: initWeights(4, 12),
      biases2Cat: initBiases(4),
      weights2Amt: initWeights(1, 12),
      biases2Amt: initBiases(1),
    };
    this.isLoaded = true;

    // Generate synthetic training cases (300 cases)
    const trainingData: { inputs: EvaluationInputs; cat: 'A' | 'B' | 'C' | 'D'; amt: number }[] = [];
    const employments = ['unemployed', 'part-time', 'full-time', 'retired'];
    const housings = ['rented', 'owned', 'shared'];
    const medicals = ['none', 'severe cancer', 'moderate diabetes', 'chronic pressure', 'blindness'];

    for (let i = 0; i < 300; i++) {
      const inputs: EvaluationInputs = {
        monthlyIncome: Math.round(Math.random() * 10000),
        familyMembersCount: Math.floor(Math.random() * 8) + 1,
        childrenCount: Math.floor(Math.random() * 5),
        employmentStatus: employments[Math.floor(Math.random() * employments.length)],
        medicalConditions: Math.random() > 0.4 ? medicals[Math.floor(Math.random() * medicals.length)] : '',
        housingStatus: housings[Math.floor(Math.random() * housings.length)],
        debtObligations: Math.random() > 0.6 ? Math.round(Math.random() * 8000) : 0,
        urgentNeeds: Math.random() > 0.5 ? 'Urgent help needed' : '',
        existingSupport: Math.random() > 0.7 ? Math.round(Math.random() * 2000) : 0,
      };

      const target = calculateScoreAndCategory(inputs);
      trainingData.push({
        inputs,
        cat: target.category,
        amt: target.recommendedAmount,
      });
    }

    // Pre-train for 150 epochs
    const epochs = 150;
    const lr = 0.05;
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const item of trainingData) {
        // Train step silently (we don't save to file inside the loop for speed)
        this.trainStepSilent(item.inputs, item.cat, item.amt, lr);
      }
    }

    console.log('AI Model pre-training completed successfully.');
    this.saveWeights();
  }

  // Same as trainStep but does not write to disk (used during batch training for performance)
  private trainStepSilent(
    inputs: EvaluationInputs,
    targetCategory: 'A' | 'B' | 'C' | 'D',
    targetAmount: number,
    learningRate: number
  ) {
    const x = this.preprocessInputs(inputs);

    const targetCatMap: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 1, C: 2, D: 3 };
    const tCat = [0, 0, 0, 0];
    tCat[targetCatMap[targetCategory]] = 1;
    const tAmt = Math.max(0, Math.min(1, (targetAmount - 1000) / 7000));

    const z1: number[] = [];
    const a1: number[] = [];
    for (let i = 0; i < 12; i++) {
      let sum = this.weights.biases1[i];
      for (let j = 0; j < 8; j++) {
        sum += x[j] * this.weights.weights1[i][j];
      }
      z1.push(sum);
      a1.push(this.relu(sum));
    }

    const z2Cat: number[] = [];
    for (let i = 0; i < 4; i++) {
      let sum = this.weights.biases2Cat[i];
      for (let j = 0; j < 12; j++) {
        sum += a1[j] * this.weights.weights2Cat[i][j];
      }
      z2Cat.push(sum);
    }
    const pCat = this.softmax(z2Cat);

    let z2Amt = this.weights.biases2Amt[0];
    for (let j = 0; j < 12; j++) {
      z2Amt += a1[j] * this.weights.weights2Amt[0][j];
    }
    const pAmt = this.sigmoid(z2Amt);

    const dZ2Cat = pCat.map((p, i) => p - tCat[i]);
    const dZ2Amt = (pAmt - tAmt) * this.sigmoidDerivative(pAmt);

    const dW2Cat: number[][] = Array.from({ length: 4 }, () => Array(12).fill(0));
    const db2Cat = [...dZ2Cat];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 12; j++) {
        dW2Cat[i][j] = dZ2Cat[i] * a1[j];
      }
    }

    const dW2Amt: number[] = [];
    const db2Amt = dZ2Amt;
    for (let j = 0; j < 12; j++) {
      dW2Amt.push(dZ2Amt * a1[j]);
    }

    const dA1: number[] = Array(12).fill(0);
    for (let j = 0; j < 12; j++) {
      for (let i = 0; i < 4; i++) {
        dA1[j] += dZ2Cat[i] * this.weights.weights2Cat[i][j];
      }
      dA1[j] += dZ2Amt * this.weights.weights2Amt[0][j];
    }

    const dZ1: number[] = [];
    for (let j = 0; j < 12; j++) {
      dZ1.push(dA1[j] * this.reluDerivative(z1[j]));
    }

    const dW1: number[][] = Array.from({ length: 12 }, () => Array(8).fill(0));
    const db1 = [...dZ1];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 8; j++) {
        dW1[i][j] = dZ1[i] * x[j];
      }
    }

    for (let i = 0; i < 12; i++) {
      this.weights.biases1[i] -= learningRate * db1[i];
      for (let j = 0; j < 8; j++) {
        this.weights.weights1[i][j] -= learningRate * dW1[i][j];
      }
    }

    for (let i = 0; i < 4; i++) {
      this.weights.biases2Cat[i] -= learningRate * db2Cat[i];
      for (let j = 0; j < 12; j++) {
        this.weights.weights2Cat[i][j] -= learningRate * dW2Cat[i][j];
      }
    }

    this.weights.biases2Amt[0] -= learningRate * db2Amt;
    for (let j = 0; j < 12; j++) {
      this.weights.weights2Amt[0][j] -= learningRate * dW2Amt[j];
    }
  }

  // Save weights to json file
  private saveWeights() {
    try {
      const dir = path.dirname(WEIGHTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(WEIGHTS_FILE, JSON.stringify(this.weights, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write model weights:', err);
    }
  }
}

// Export a single global instance of the model
export const povertyModel = new PovertyAssessmentModel();
