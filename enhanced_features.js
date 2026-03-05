const fs = require('fs');
const path = require('path');

// Additional game implementations
const enhancedGames = {};

// Memory Match Game
enhancedGames.memoryMatch = (cards, selectedCardIndex, playerCards = {}) => {
    if (!cards) {
        // Initialize a new game with 8 pairs of cards
        const symbols = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🍑', '🍍', '🥝', '🥥', '🥭', '🍉', '🍋', '🍐', '🍎', '🍌'];
        let gameCards = [...symbols.slice(0, 8), ...symbols.slice(0, 8)];
        // Shuffle cards
        gameCards = gameCards.sort(() => Math.random() - 0.5);
        
        const gameState = {
            cards: gameCards,
            revealed: Array(16).fill(false),
            matched: Array(16).fill(false),
            firstCard: null,
            secondCard: null,
            moves: 0,
            gameOver: false
        };
        
        return {
            state: gameState,
            message: `🧠 *Memory Match Game Started!*\n\nTry to find matching pairs of cards.\nCards: ${renderMemoryMatchBoard(gameState)}\n\nUse !match [1-16] to flip a card (positions 1-16)`
        };
    }
    
    // Process player move
    if (selectedCardIndex < 1 || selectedCardIndex > 16) {
        return {
            state: cards,
            message: '❌ Please select a card between 1 and 16!'
        };
    }
    
    selectedCardIndex--; // Convert to 0-indexed
    
    if (cards.matched[selectedCardIndex] || cards.revealed[selectedCardIndex]) {
        return {
            state: cards,
            message: '❌ That card is already revealed or matched!'
        };
    }
    
    // Reveal the selected card
    const newCards = {...cards};
    newCards.revealed[selectedCardIndex] = true;
    
    if (newCards.firstCard === null) {
        // First card selection
        newCards.firstCard = selectedCardIndex;
        return {
            state: newCards,
            message: `🧠 *Memory Match*\nCards: ${renderMemoryMatchBoard(newCards)}\n\nFirst card revealed! Now select another card.`
        };
    } else {
        // Second card selection
        newCards.secondCard = selectedCardIndex;
        newCards.moves++;
        
        if (newCards.cards[newCards.firstCard] === newCards.cards[newCards.secondCard]) {
            // Match found
            newCards.matched[newCards.firstCard] = true;
            newCards.matched[selectedCardIndex] = true;
            
            // Check if game is complete
            if (newCards.matched.every(matched => matched)) {
                newCards.gameOver = true;
                return {
                    state: newCards,
                    message: `🎉 *Congratulations!* You won the Memory Match game in ${newCards.moves} moves!\n\nFinal board:\n${renderMemoryMatchBoard(newCards)}`
                };
            }
            
            return {
                state: newCards,
                message: `✅ *Match Found!* Cards ${newCards.firstCard + 1} and ${selectedCardIndex + 1} match!\n\nCards: ${renderMemoryMatchBoard(newCards)}\n\nMoves: ${newCards.moves}`
            };
        } else {
            // No match, hide both cards again
            newCards.revealed[newCards.firstCard] = false;
            newCards.revealed[selectedCardIndex] = false;
            
            return {
                state: newCards,
                message: `❌ No match! Cards ${newCards.firstCard + 1} and ${selectedCardIndex + 1} don't match.\n\nCards: ${renderMemoryMatchBoard(newCards)}\n\nMoves: ${newCards.moves}`
            };
        }
    }
};

function renderMemoryMatchBoard(gameState) {
    let board = '';
    for (let i = 0; i < 16; i++) {
        if (gameState.matched[i]) {
            board += gameState.cards[i];
        } else if (gameState.revealed[i]) {
            board += gameState.cards[i];
        } else {
            board += '🃏';
        }
        
        if ((i + 1) % 4 === 0) {
            board += '\n';
        } else {
            board += ' ';
        }
    }
    return board;
}

// Dice Game with Betting
enhancedGames.diceGame = (betAmount, playerDice = null, botDice = null) => {
    if (betAmount === undefined) {
        return {
            message: '🎲 *Dice Game*\n\nPlace a bet and roll dice against the bot!\nUse !dice [amount] to start playing.'
        };
    }
    
    if (isNaN(betAmount) || betAmount <= 0) {
        return {
            message: '❌ Please enter a valid bet amount greater than 0!'
        };
    }
    
    const playerRoll = playerDice || Math.floor(Math.random() * 6) + 1;
    const botRoll = botDice || Math.floor(Math.random() * 6) + 1;
    
    let result;
    if (playerRoll > botRoll) {
        result = `🎉 You win! You rolled ${playerRoll}, bot rolled ${botRoll}`;
    } else if (playerRoll < botRoll) {
        result = `😔 Bot wins! You rolled ${playerRoll}, bot rolled ${botRoll}`;
    } else {
        result = `🤝 It's a tie! Both rolled ${playerRoll}`;
    }
    
    return {
        message: `🎲 *Dice Game*\n\n${result}\n\nBet: $${betAmount}\n\n🎲 You: ${playerRoll}\n🤖 Bot: ${botRoll}`
    };
};

// Word Chain Game
enhancedGames.wordChain = (currentWord, lastWord = null) => {
    if (currentWord === 'new' || !lastWord) {
        return {
            message: `🔗 *Word Chain Game*\n\nStart the word chain! Each word must begin with the last letter of the previous word.\nExample: cat → tiger → rabbit → turtle...\n\nSay !chain [word] to start!`
        };
    }
    
    if (!lastWord) {
        return {
            message: `🔗 *Word Chain*\n\nYour word: ${currentWord}\n\nWaiting for the next player to continue the chain!`
        };
    }
    
    const lastLetter = lastWord[lastWord.length - 1].toLowerCase();
    const firstLetter = currentWord[0].toLowerCase();
    
    if (lastLetter !== firstLetter) {
        return {
            message: `❌ Word must start with '${lastLetter}' (the last letter of the previous word: ${lastWord})`
        };
    }
    
    return {
        message: `🔗 *Word Chain*\n\nChain continues: ${lastWord} → ${currentWord}\n\nNext word must start with '${currentWord[currentWord.length - 1]}'.`
    };
};

// Math Challenge Game
enhancedGames.mathChallenge = (difficulty = 'easy') => {
    const difficulties = {
        easy: { min: 1, max: 10, operators: ['+', '-'] },
        medium: { min: 5, max: 20, operators: ['+', '-', '*'] },
        hard: { min: 10, max: 50, operators: ['+', '-', '*', '/'] }
    };
    
    const diff = difficulties[difficulty] || difficulties.easy;
    const num1 = Math.floor(Math.random() * (diff.max - diff.min + 1)) + diff.min;
    const num2 = Math.floor(Math.random() * (diff.max - diff.min + 1)) + diff.min;
    const operator = diff.operators[Math.floor(Math.random() * diff.operators.length)];
    
    let question, answer;
    
    switch(operator) {
        case '+':
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
            break;
        case '-':
            answer = num1 - num2;
            question = `${num1} - ${num2}`;
            break;
        case '*':
            answer = num1 * num2;
            question = `${num1} × ${num2}`;
            break;
        case '/':
            // Ensure division results in whole number
            answer = num1;
            question = `${num1 * num2} ÷ ${num2}`;
            break;
    }
    
    return {
        question: question,
        answer: answer,
        difficulty: difficulty
    };
};

// Utility functions
enhancedGames.weatherInfo = async (location) => {
    // This would normally call a real weather API
    // For demo purposes, we'll return mock data
    return {
        location: location,
        temperature: Math.floor(Math.random() * 30) + 15, // Random temp between 15-45
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 50) + 30,
        windSpeed: Math.floor(Math.random() * 20) + 5
    };
};

enhancedGames.jokeGenerator = () => {
    const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What did one ocean say to the other ocean? Nothing, they just waved!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "How do you organize a space party? You planet!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a fake noodle? An impasta!",
        "How does a penguin build its house? Igloos it together!",
        "Why did the math book look sad? Because it had too many problems!"
    ];
    
    return jokes[Math.floor(Math.random() * jokes.length)];
};

enhancedGames.quoteGenerator = () => {
    const quotes = [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Innovation distinguishes between a leader and a follower. - Steve Jobs",
        "Life is what happens when you're busy making other plans. - John Lennon",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "It is during our darkest moments that we must focus to see the light. - Aristotle",
        "Do not go where the path may lead, go instead where there is no path and leave a trail. - Ralph Waldo Emerson",
        "Be yourself; everyone else is already taken. - Oscar Wilde",
        "So many books, so little time. - Frank Zappa"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
};

module.exports = { enhancedGames };