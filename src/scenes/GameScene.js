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
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('enemy', 'assets/wizard.png');
        this.load.spritesheet('crystal', 'assets/crystal.png', {frameWidth:32, frameHeight: 32});

        this.load.once('complete', () => {
            this.textures.get('background').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('crystal').setFilter(Phaser.Textures.FilterMode.NEAREST);
        })
    }

    create() {
        const { width, height } = this.sys.game.config;
        // Set up the game scene
        const background = this.add.image(0, 0, 'background');
        background.setOrigin(0, 0); // Set origin to top-left corner
        background.displayWidth = width; // Set the display width to canvas width
        background.displayHeight = height; // Set the display height to canvas height
    
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


        // // Add crystal (player's base)
        // this.crystal = this.add.image(1200, 300, 'crystal');

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

        // Timer for spawning enemies
        this.time.addEvent({ delay: 2000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    }

    update() {
        this.enemies.children.entries.forEach(enemy => {
            enemy.x += enemy.speed;
            enemy.wordText.x = enemy.x - enemy.wordText.width / 2;
            if (enemy.x > 1260) {
                this.damagePlayer(10);
                enemy.wordText.destroy();
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

    handleKeyPress(event) {
        if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
            this.currentWord += event.key.toLowerCase();
            this.wordText.setText(this.currentWord);
            this.checkWord();
        } else if (event.key === 'Backspace') {
            this.currentWord = this.currentWord.slice(0, -1);
            this.wordText.setText(this.currentWord);
        }
    }

    checkWord() {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.word === this.currentWord) {
                enemy.wordText.destroy();
                enemy.destroy();
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
                this.currentWord = '';
                this.wordText.setText(this.currentWord);
            }
        });
    }

    spawnEnemy() {
        const enemy = this.enemies.create(0, Phaser.Math.Between(100, 500), 'enemy').setScale(2);
        enemy.speed = Phaser.Math.Between(1, 3);
        enemy.word = this.getRandomWord();
        enemy.wordText = this.add.text(enemy.x, enemy.y - 80, enemy.word, { fontSize: '32px', fontStyle: 'bold', fill: '#fff' });
    }

    getRandomWord() {
        const words = ['phaser', 'javascript', 'typing', 'game', 'enemy', 'crystal', 'score', 'health', 'speed', 'word'];
        return words[Phaser.Math.Between(0, words.length - 1)];
    }

    damagePlayer(amount) {
        this.playerHealth -= amount;
        if (this.playerHealth < 0) this.playerHealth = 0;
    }

    gameOver() {
        this.scene.pause();
        this.add.text(640, 360, 'Game Over', { fontSize: '64px', fontStyle: 'bold', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(640, 410, 'Final Score: ' + this.score, { fontSize: '32px', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
    }
}