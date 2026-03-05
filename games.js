const games = {};

// Rock Paper Scissors Game
games.rockPaperScissors = (playerChoice) => {
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    
    playerChoice = playerChoice.toLowerCase();
    
    if (!choices.includes(playerChoice)) {
        return {
            valid: false,
            message: '❌ Invalid choice! Please choose: rock, paper, or scissors'
        };
    }
    
    let result;
    if (playerChoice === botChoice) {
        result = 'It\'s a tie! 🤝';
    } else if (
        (playerChoice === 'rock' && botChoice === 'scissors') ||
        (playerChoice === 'paper' && botChoice === 'rock') ||
        (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
        result = '🎉 You win!';
    } else {
        result = '😔 Bot wins!';
    }
    
    return {
        valid: true,
        message: `🎮 *Rock Paper Scissors*\n\nYou chose: ${playerChoice} 🗿\nBot chose: ${botChoice} 🤖\nResult: ${result}`
    };
};

// Number Guessing Game
games.numberGuessing = (userGuess, gameState = null) => {
    if (!gameState) {
        gameState = {
            secretNumber: Math.floor(Math.random() * 100) + 1,
            attempts: 0,
            maxAttempts: 7
        };
    }
    
    gameState.attempts++;
    const guess = parseInt(userGuess);
    
    if (isNaN(guess)) {
        return {
            valid: false,
            message: '❌ Please enter a valid number!',
            state: gameState
        };
    }
    
    if (guess < 1 || guess > 100) {
        return {
            valid: false,
            message: '❌ Please enter a number between 1 and 100!',
            state: gameState
        };
    }
    
    if (guess === gameState.secretNumber) {
        return {
            valid: true,
            gameOver: true,
            message: `🎉 *Congratulations!* You guessed the number ${gameState.secretNumber} in ${gameState.attempts} attempts! 🏆`
        };
    } else if (gameState.attempts >= gameState.maxAttempts) {
        return {
            valid: true,
            gameOver: true,
            message: `😅 Game over! You've used all ${gameState.maxAttempts} attempts. The number was ${gameState.secretNumber}. Better luck next time!`
        };
    } else if (guess < gameState.secretNumber) {
        return {
            valid: true,
            gameOver: false,
            message: `📈 Too low! Try a higher number.\nAttempts left: ${gameState.maxAttempts - gameState.attempts}`,
            state: gameState
        };
    } else {
        return {
            valid: true,
            gameOver: false,
            message: `📉 Too high! Try a lower number.\nAttempts left: ${gameState.maxAttempts - gameState.attempts}`,
            state: gameState
        };
    }
};

// Tic Tac Toe Game
class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
    }
    
    makeMove(position) {
        if (this.gameOver) {
            return { valid: false, message: '❌ Game is already over! Start a new game.' };
        }
        
        if (position < 0 || position > 8) {
            return { valid: false, message: '❌ Invalid position! Choose a number between 0-8.' };
        }
        
        if (this.board[position] !== null) {
            return { valid: false, message: '❌ Position already taken! Choose another position.' };
        }
        
        this.board[position] = this.currentPlayer;
        
        // Check for winner
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winner = this.currentPlayer;
                this.gameOver = true;
                return {
                    valid: true,
                    message: `${this.renderBoard()}\n🎉 Player ${this.currentPlayer} wins! 🏆`,
                    gameOver: true
                };
            }
        }
        
        // Check for draw
        if (!this.board.includes(null)) {
            this.gameOver = true;
            return {
                valid: true,
                message: `${this.renderBoard()}\n🤝 It's a draw!`,
                gameOver: true
            };
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        return {
            valid: true,
            message: `${this.renderBoard()}\nCurrent player: ${this.currentPlayer}`,
            gameOver: false
        };
    }
    
    renderBoard() {
        const display = this.board.map(cell => cell || '⬜').join('');
        return `🎮 *Tic Tac Toe*\n\n${display.slice(0, 3)}\n${display.slice(3, 6)}\n${display.slice(6, 9)}\n\nPositions: 0-8\nExample: !tictactoe 4`;
    }
    
    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
    }
}

// Trivia Game
games.trivia = () => {
    const triviaQuestions = [
        {
            question: "What is the capital of France?",
            answer: "paris",
            options: ["London", "Berlin", "Paris", "Madrid"]
        },
        {
            question: "Which planet is known as the Red Planet?",
            answer: "mars",
            options: ["Earth", "Mars", "Jupiter", "Venus"]
        },
        {
            question: "What is the largest mammal in the world?",
            answer: "blue whale",
            options: ["Elephant", "Giraffe", "Blue Whale", "Hippopotamus"]
        },
        {
            question: "How many continents are there in the world?",
            answer: "7",
            options: ["5", "6", "7", "8"]
        },
        {
            question: "What is the chemical symbol for gold?",
            answer: "au",
            options: ["Go", "Gd", "Au", "Ag"]
        }
    ];
    
    const randomQuestion = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    
    return {
        question: randomQuestion.question,
        answer: randomQuestion.answer,
        options: randomQuestion.options
    };
};

// Word Scramble Game
games.wordScramble = () => {
    const words = [
        "whatsapp", "bot", "games", "fun", "amazing", 
        "awesome", "entertainment", "challenge", "adventure", 
        "exciting", "fantastic", "incredible", "marvelous", 
        "outstanding", "spectacular", "superb", "wonderful"
    ];
    
    const word = words[Math.floor(Math.random() * words.length)].toUpperCase();
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    
    return {
        original: word,
        scrambled: scrambled,
        hint: word.length > 5 ? `First letter: ${word[0]}` : ''
    };
};

// Memory Game
games.memoryGame = (sequence, userSequence) => {
    if (!sequence) {
        // Generate new sequence
        const newSequence = [];
        for (let i = 0; i < 5; i++) {
            newSequence.push(Math.floor(Math.random() * 9) + 1);
        }
        return {
            sequence: newSequence,
            message: `🧠 *Memory Game*\nMemorize this sequence: ${newSequence.join(' ')}\nReply with !memory [your_sequence] to test your memory!`
        };
    }
    
    if (!userSequence) {
        return {
            sequence: sequence,
            message: 'Please provide your remembered sequence using !memory [numbers]'
        };
    }
    
    const userSeqArray = userSequence.toString().split('').map(Number);
    
    if (JSON.stringify(sequence) === JSON.stringify(userSeqArray)) {
        return {
            sequence: null,
            message: `🎉 *Perfect Memory!* You remembered the sequence: ${sequence.join(' ')} 🧠`
        };
    } else {
        return {
            sequence: null,
            message: `😅 Not quite right! The sequence was: ${sequence.join(' ')}, you entered: ${userSeqArray.join(' ')}`
        };
    }
};

// Hangman Game
class Hangman {
    constructor() {
        this.words = [
            "WHATSAPP", "BOT", "GAMES", "FUN", "AWESOME", 
            "ENTERTAINMENT", "CHALLENGE", "ADVENTURE", 
            "EXCITING", "FANTASTIC", "INCREDIBLE"
        ];
        this.word = "";
        this.guessedLetters = [];
        this.incorrectGuesses = 0;
        this.maxIncorrect = 6;
        this.gameOver = false;
        this.initializeGame();
    }
    
    initializeGame() {
        this.word = this.words[Math.floor(Math.random() * this.words.length)];
        this.guessedLetters = [];
        this.incorrectGuesses = 0;
        this.gameOver = false;
    }
    
    guess(letter) {
        if (this.gameOver) {
            return { valid: false, message: 'Game is over! Start a new game with !hangman' };
        }
        
        letter = letter.toUpperCase();
        
        if (letter.length !== 1 || !letter.match(/[A-Z]/)) {
            return { valid: false, message: 'Please enter a single letter!' };
        }
        
        if (this.guessedLetters.includes(letter)) {
            return { valid: false, message: 'You already guessed that letter!' };
        }
        
        this.guessedLetters.push(letter);
        
        if (this.word.includes(letter)) {
            // Correct guess
            const wordDisplay = this.word.split('').map(char => 
                this.guessedLetters.includes(char) ? char : '_'
            ).join(' ');
            
            if (!wordDisplay.includes('_')) {
                this.gameOver = true;
                return {
                    valid: true,
                    message: this.getHangmanDisplay() + `\n🎉 *Congratulations!* You won! The word was: ${this.word}`,
                    gameOver: true
                };
            }
            
            return {
                valid: true,
                message: this.getHangmanDisplay() + `\n✅ Correct! Current word: ${wordDisplay}`,
                gameOver: false
            };
        } else {
            // Incorrect guess
            this.incorrectGuesses++;
            
            if (this.incorrectGuesses >= this.maxIncorrect) {
                this.gameOver = true;
                return {
                    valid: true,
                    message: this.getHangmanDisplay() + `\n💀 Game Over! The word was: ${this.word}`,
                    gameOver: true
                };
            }
            
            const wordDisplay = this.word.split('').map(char => 
                this.guessedLetters.includes(char) ? char : '_'
            ).join(' ');
            
            return {
                valid: true,
                message: this.getHangmanDisplay() + `\n❌ Wrong! Current word: ${wordDisplay}`,
                gameOver: false
            };
        }
    }
    
    getHangmanDisplay() {
        const hangmanStages = [
            `
   +---+
   |   |
       |
       |
       |
       |
=========`,
            `
   +---+
   |   |
   O   |
       |
       |
       |
=========`,
            `
   +---+
   |   |
   O   |
   |   |
       |
       |
=========`,
            `
   +---+
   |   |
   O   |
  /|   |
       |
       |
=========`,
            `
   +---+
   |   |
   O   |
  /|\\  |
       |
       |
=========`,
            `
   +---+
   |   |
   O   |
  /|\\  |
  /    |
       |
=========`,
            `
   +---+
   |   |
   O   |
  /|\\  |
  / \\  |
       |
=========`
        ];
        
        return `\`\`\`${hangmanStages[this.incorrectGuesses]}\`\`\``;
    }
    
    getWordDisplay() {
        return this.word.split('').map(char => 
            this.guessedLetters.includes(char) ? char : '_'
        ).join(' ');
    }
}

// Store active games
const activeGames = new Map();

module.exports = {
    games,
    TicTacToe,
    Hangman,
    activeGames
};