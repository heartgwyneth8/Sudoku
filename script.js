class SudokuGame {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.mistakes = 0;
        this.time = 0;
        this.timer = null;
        this.isNotesMode = false;
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => []));
        this.isGameRunning = true;
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.startNewGame('medium');
        this.startTimer();
    }

    createGrid() {
        const gridElement = document.getElementById('sudoku-grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.selectCell(row, col));
                gridElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.num-btn').forEach(btn => {
            if (btn.classList.contains('erase')) {
                btn.addEventListener('click', () => this.eraseCell());
            } else {
                btn.addEventListener('click', (e) => {
                    const number = parseInt(e.target.dataset.number);
                    this.inputNumber(number);
                });
            }
        });

        // New game buttons
        document.getElementById('new-game-easy').addEventListener('click', () => this.startNewGame('easy'));
        document.getElementById('new-game-medium').addEventListener('click', () => this.startNewGame('medium'));
        document.getElementById('new-game-hard').addEventListener('click', () => this.startNewGame('hard'));

        // Control buttons
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());
        document.getElementById('notes-btn').addEventListener('click', () => this.toggleNotesMode());

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeTheme(e.target.dataset.theme));
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;
            
            if (e.key >= '1' && e.key <= '9') {
                this.inputNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.eraseCell();
            } else if (e.key === 'n' || e.key === 'N') {
                this.toggleNotesMode();
            } else if (e.key === 'ArrowUp' && this.selectedCell) {
                e.preventDefault();
                this.selectCell(Math.max(0, this.selectedCell.row - 1), this.selectedCell.col);
            } else if (e.key === 'ArrowDown' && this.selectedCell) {
                e.preventDefault();
                this.selectCell(Math.min(8, this.selectedCell.row + 1), this.selectedCell.col);
            } else if (e.key === 'ArrowLeft' && this.selectedCell) {
                e.preventDefault();
                this.selectCell(this.selectedCell.row, Math.max(0, this.selectedCell.col - 1));
            } else if (e.key === 'ArrowRight' && this.selectedCell) {
                e.preventDefault();
                this.selectCell(this.selectedCell.row, Math.min(8, this.selectedCell.col + 1));
            }
        });
    }

    startNewGame(difficulty) {
        const { puzzle, solution } = this.generatePuzzle(difficulty);
        this.grid = puzzle.map(row => [...row]);
        this.initialGrid = puzzle.map(row => [...row]);
        this.solution = solution.map(row => [...row]);
        this.selectedCell = null;
        this.mistakes = 0;
        this.time = 0;
        this.isGameRunning = true;
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => []));
        this.updateDisplay();
        this.updateStats();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.startTimer();
    }

    generatePuzzle(difficulty = 'medium') {
        // Create a solved puzzle first
        const emptyBoard = Array(9).fill().map(() => Array(9).fill(0));
        const solution = this.solveSudoku(emptyBoard);
        
        if (!solution) {
            // Fallback puzzle if generation fails
            return this.getFallbackPuzzle();
        }

        const puzzle = solution.map(row => [...row]);
        
        // Remove numbers based on difficulty
        const cellsToRemove = {
            easy: 35,
            medium: 45,
            hard: 55
        }[difficulty];

        let removed = 0;
        const attempts = 1000;
        let attempt = 0;

        while (removed < cellsToRemove && attempt < attempts) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (puzzle[row][col] !== 0) {
                // Store the value before removing
                const backup = puzzle[row][col];
                puzzle[row][col] = 0;
                
                // Check if puzzle still has unique solution
                const tempPuzzle = puzzle.map(r => [...r]);
                if (this.countSolutions(tempPuzzle) === 1) {
                    removed++;
                } else {
                    // Put the value back if multiple solutions
                    puzzle[row][col] = backup;
                }
            }
            attempt++;
        }

        return { puzzle, solution };
    }

    solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (const num of numbers) {
                        if (this.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.solveSudoku(board)) {
                                return board;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return board;
    }

    countSolutions(board, count = 0) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9 && count < 2; num++) {
                        if (this.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            count = this.countSolutions(board, count);
                            board[row][col] = 0;
                        }
                    }
                    return count;
                }
            }
        }
        return count + 1;
    }

    isValidPlacement(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    getFallbackPuzzle() {
        // A simple valid puzzle for fallback
        const puzzle = [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ];

        const solution = [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ];

        return { puzzle, solution };
    }

    selectCell(row, col) {
        if (this.initialGrid[row][col] === 0) {
            this.selectedCell = { row, col };
            this.updateDisplay();
        }
    }

    inputNumber(number) {
        if (!this.selectedCell || !this.isGameRunning) return;

        const { row, col } = this.selectedCell;
        
        if (this.isNotesMode) {
            this.toggleNote(row, col, number);
            return;
        }

        if (this.initialGrid[row][col] !== 0) return;

        // Check if the move is correct
        if (number !== this.solution[row][col]) {
            this.mistakes++;
            this.updateStats();
            
            // Show error animation
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('error');
            setTimeout(() => cell.classList.remove('error'), 500);
            
            if (this.mistakes >= 3) {
                this.isGameRunning = false;
                setTimeout(() => {
                    alert('Game Over! Too many mistakes. Starting new game.');
                    this.startNewGame('medium');
                }, 600);
                return;
            }
            return;
        }

        this.grid[row][col] = number;
        this.notes[row][col] = []; // Clear notes when number is placed
        this.updateDisplay();

        // Check if puzzle is complete
        if (this.isPuzzleComplete()) {
            this.isGameRunning = false;
            this.stopTimer();
            setTimeout(() => {
                alert(`🎉 Congratulations! You solved the puzzle in ${this.formatTime(this.time)} with ${this.mistakes} mistakes!`);
            }, 500);
        }
    }

    toggleNote(row, col, number) {
        if (this.initialGrid[row][col] !== 0 || !this.isGameRunning) return;

        const noteIndex = this.notes[row][col].indexOf(number);
        if (noteIndex > -1) {
            this.notes[row][col].splice(noteIndex, 1);
        } else {
            this.notes[row][col].push(number);
            this.notes[row][col].sort((a, b) => a - b);
        }
        this.updateDisplay();
    }

    eraseCell() {
        if (!this.selectedCell || !this.isGameRunning) return;

        const { row, col } = this.selectedCell;
        if (this.initialGrid[row][col] === 0) {
            this.grid[row][col] = 0;
            this.notes[row][col] = [];
            this.updateDisplay();
        }
    }

    giveHint() {
        if (!this.selectedCell || !this.isGameRunning) {
            alert('Please select a cell first!');
            return;
        }

        const { row, col } = this.selectedCell;
        if (this.grid[row][col] !== 0) {
            alert('This cell already has a number!');
            return;
        }

        const correctNumber = this.solution[row][col];
        alert(`💡 Hint: The correct number for this cell is ${correctNumber}`);
    }

    toggleNotesMode() {
        this.isNotesMode = !this.isNotesMode;
        const notesBtn = document.getElementById('notes-btn');
        notesBtn.textContent = this.isNotesMode ? '📝 Notes (ON)' : '📝 Notes';
        notesBtn.style.background = this.isNotesMode ? '#4CAF50' : '#2196F3';
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        
        // First pass: reset all cells
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.grid[row][col];
            
            // Reset cell
            cell.textContent = '';
            cell.className = 'cell';
            cell.style.fontSize = '18px';
            cell.style.color = '';
            
            // Remove all highlight classes
            cell.classList.remove('highlight-row', 'highlight-col', 'highlight-box', 'highlight-same-number');
            
            // Set cell type
            if (this.initialGrid[row][col] !== 0) {
                cell.classList.add('initial');
                cell.textContent = this.initialGrid[row][col];
            } else if (value !== 0) {
                cell.classList.add('user');
                cell.textContent = value;
            }
            
            // Show notes
            if (value === 0 && this.notes[row][col].length > 0) {
                cell.textContent = this.notes[row][col].join(' ');
                cell.style.fontSize = '10px';
                cell.style.color = '#666';
                cell.style.fontWeight = 'normal';
            }
        });

        // Second pass: apply highlights if a cell is selected
        if (this.selectedCell) {
            const { row: selectedRow, col: selectedCol } = this.selectedCell;
            const selectedValue = this.grid[selectedRow][selectedCol];
            
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const value = this.grid[row][col];
                
                // Highlight selected cell
                if (row === selectedRow && col === selectedCol) {
                    cell.classList.add('selected');
                }
                
                // Highlight same row
                if (row === selectedRow) {
                    cell.classList.add('highlight-row');
                }
                
                // Highlight same column
                if (col === selectedCol) {
                    cell.classList.add('highlight-col');
                }
                
                // Highlight same 3x3 box
                const selectedBoxRow = Math.floor(selectedRow / 3);
                const selectedBoxCol = Math.floor(selectedCol / 3);
                const cellBoxRow = Math.floor(row / 3);
                const cellBoxCol = Math.floor(col / 3);
                
                if (cellBoxRow === selectedBoxRow && cellBoxCol === selectedBoxCol) {
                    cell.classList.add('highlight-box');
                }
                
                // Highlight cells with the same number (only if the selected cell has a number)
                if (selectedValue !== 0 && value === selectedValue && !(row === selectedRow && col === selectedCol)) {
                    cell.classList.add('highlight-same-number');
                }
            });
        }
    }

    updateStats() {
        document.getElementById('mistakes').textContent = this.mistakes;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.isGameRunning) {
                this.time++;
                document.getElementById('time').textContent = this.formatTime(this.time);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    isPuzzleComplete() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.grid[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    changeTheme(theme) {
        document.body.className = theme + '-theme';
        
        // Update active theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});