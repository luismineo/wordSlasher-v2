import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.enemies = null;
        this.crystal = null;
        this.score = 0;
        this.scoreText = null;
        this.currentWord = '';
        this.wordText = null;
        this.playerHealth = 100;
        this.healthBar = null;
        this.currentEnemy = null;
        this.activeWords = new Set(); // Active words, to make sure that are no repeated words
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('enemy', 'assets/wizard.png');
        this.load.spritesheet('crystal', 'assets/crystal.png', {frameWidth:32, frameHeight: 32});
        
        // Filter to scale sprites without blur
        this.load.once('complete', () => {
            this.textures.get('background').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('crystal').setFilter(Phaser.Textures.FilterMode.NEAREST);
        })
    }

    create() {
        const { width, height } = this.sys.game.config;
        
        // Game scene setup
        
        // Render background, center and scale to window size
        const background = this.add.image(0, 0, 'background');
        background.setOrigin(0, 0); 
        background.displayWidth = width; 
        background.displayHeight = height; 
    
        // Crystal animation
        const animConfig = {
            key: 'idle',
            frames: this.anims.generateFrameNumbers('crystal'),
            frameRate: 8,
            yoyo: true,
            repeat: -1
        }

        this.anim = this.anims.create(animConfig);
        this.sprite = this.add.sprite(1200, 300, 'crystal').setScale(8);
        this.sprite.anims.play('idle');

        // Set up enemy group
        this.enemies = this.physics.add.group();

        // Display score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px',fontStyle: 'bold', fill: '#fff' });

        // Display current word being typed
        this.wordText = this.add.text(640, 620, '', { fontSize: '32px', fill: '#fff' });
        this.wordText.setOrigin(0.5);

        // Display health bar
        this.healthBar = this.add.rectangle(640, 670, 500, 20, 0x00ff00);
        this.healthBar.setOrigin(0.5);

        // Set up keyboard input
        this.input.keyboard.on('keydown', this.handleKeyPress, this);

        // Timer for spawning enemies, TODO - change this logic to set dificulty levels
        this.time.addEvent({ delay: 2000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    }

    update() {
        if (this.currentEnemy && !this.currentEnemy.active) {
            this.resetCurrentEnemy();
        }

        // For each enemy, defines his and the word motion
        this.enemies.children.entries.forEach(enemy => {
            enemy.x += enemy.speed;
            enemy.wordContainer.x = enemy.x;

            // Condition to damage player, TODO - change this to collision with crystal
            if (enemy.x > 1260) {
                this.damagePlayer(10);
                enemy.wordContainer.destroy();
                enemy.destroy();
            }
        });

        // Update health bar
        this.healthBar.width = (this.playerHealth / 100) * 500;
        this.healthBar.fillColor = (this.playerHealth > 50) ? 0x00ff00 : 0xff0000;

        // Check for game over
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    updateEnemyHighlight() {
        // Check each enemy, then loops through his word, if match with the typed letter, highlight in green
        this.enemies.children.entries.forEach(enemy => {
            for (let i = 0; i < enemy.word.length; i++) {
                if (i < this.currentWord.length && this.currentWord[i] === enemy.word[i]) {
                    enemy.wordChars[i].setColor('#00ff00');
                } else {
                    enemy.wordChars[i].setColor('#fff');
                }
            }
        });
    }
    
    handleKeyPress(event) {
        // Check for player typing
        if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
            const pressedKey = event.key.toLowerCase(); // Change to lower case
            this.currentWord += pressedKey; // Push the letter to current word string
            this.wordText.setText(this.currentWord); // Display the current word on screen
            this.checkLetter(pressedKey); // Calls check letter function
        } else if (event.key === 'Backspace') {  // If backspace is pressed, reset the current word
            if (this.currentWord.length > 0) {
                this.currentWord = '';
                this.wordText.setText(this.currentWord);
                this.updateEnemyHighlight();
            }
        }
    }
    
    checkLetter(pressedKey) {
        let matchFound = false; // To check if the letter correspond to any enemy
        this.enemies.children.entries.forEach(enemy => { 
            if (enemy.word.startsWith(this.currentWord)) { // Loops through each enemy checking the first letter
                const currentIndex = this.currentWord.length - 1;
                if (enemy.word[currentIndex] === pressedKey) {
                    enemy.wordChars[currentIndex].setColor('#00ff00');
                    matchFound = true;
                }
            }
        });
    
        if (!matchFound) { // Reset current word, if ther is a missmatch in player's input
            this.currentWord = '';
            this.wordText.setText(this.currentWord);
            this.updateEnemyHighlight();
        }
    
        this.checkWord(); // First check letter, then call check word
    }
    
    checkWord() {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.word === this.currentWord) { // Logic to destroy enemies if current word match the enemy word
                this.activeWords.delete(enemy.word); // Remove the word from the list to allow new enemies with this word
                enemy.wordContainer.destroy(); // Destroy enemy word from the scene
                enemy.destroy(); // Destroy enemy from the scene
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
                this.currentWord = '';
                this.wordText.setText(this.currentWord);
            }
        });
    }

    resetCurrentEnemy() {
        if (this.currentEnemy) {
            for (let i = 0; i < this.currentEnemy.word.length; i++) {
                this.currentEnemy.wordChars[i].setColor('#fff');
            }
            this.currentEnemy.nextCharIndex = 0;
            this.currentEnemy = null;
        }
        this.currentWord = '';
        this.wordText.setText(this.currentWord);
    }
    
    spawnEnemy() {
        // Define new enemy and new word
        const enemy = this.enemies.create(0, Phaser.Math.Between(100, 500), 'enemy').setScale(2);
        enemy.speed = Phaser.Math.Between(1, 3);
        enemy.word = this.getRandomWord();
        
        // Create text objects for each character
        enemy.wordChars = enemy.word.split('').map((char) => {
            return this.add.text(0, 0, char, { fontSize: '32px', fontStyle: 'bold', fill: '#fff' });
        });
    
        // Create a container for the word characters
        enemy.wordContainer = this.add.container(enemy.x, enemy.y - 80, enemy.wordChars);
    
        // Calculate the total width of the word container
        const totalWidth = enemy.wordChars.reduce((width, char) => width + char.width, 0);
        const totalHeight = enemy.wordChars[0].height;
    
        // Set the size of the container
        enemy.wordContainer.setSize(totalWidth, totalHeight);
    
        // Center the text within the container
        Phaser.Actions.SetXY(enemy.wordChars, -totalWidth / 2, 0, totalWidth / enemy.word.length);
    
        // Update the position of the container to center it relative to the enemy sprite
        enemy.wordContainer.setPosition(enemy.x - totalWidth / 2, enemy.y - 80);
    
        // Initialize the next character index
        enemy.nextCharIndex = 0;
    }
    

    getRandomWord() {
        const words = ['phaser', 'javascript', 'typing', 'game', 'enemy', 'crystal', 'score', 'health', 'speed', 'word'];
        let newWord;
        do {
            newWord = words[Phaser.Math.Between(0, words.length - 1)];
        } while (this.activeWords.has(newWord) && this.activeWords.size < words.length);
    
        // If all words are used, clear the set and start over
        if (this.activeWords.size >= words.length) {
            this.activeWords.clear();
        }
        
        this.activeWords.add(newWord);
        return newWord;
    }

    damagePlayer(amount) {
        this.playerHealth -= amount;
        if (this.playerHealth < 0) this.playerHealth = 0;
        
        // Remove the word of the enemy that reached the end
        const enemyReachedEnd = this.enemies.children.entries.find(enemy => enemy.x > 1260);
        if (enemyReachedEnd) {
            this.activeWords.delete(enemyReachedEnd.word);
        }
    }

    gameOver() {
        this.enemies.children.entries.forEach(enemy => {
            enemy.wordContainer.destroy();
            enemy.destroy();
        });

        this.scene.pause();
        this.add.text(640, 360, 'Game Over', { fontSize: '64px', fontStyle: 'bold', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(640, 410, 'Final Score: ' + this.score, { fontSize: '32px', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
    }
}