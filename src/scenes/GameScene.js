import Phaser from 'phaser';
import MainMenu from './MainMenu';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.gameOverState = false;
    }

    init() {
        this.enemies = null;
        this.crystal = null;
        this.necromancerHeroe = null;
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
        this.loadFont("hexenaat", "assets/fonts/Hexenaat2.ttf");
        this.loadFont("dotgothic", "assets/fonts/DotGothic16-Regular.ttf");
        this.loadFont("vt323", "assets/fonts/VT323-Regular.ttf");
        this.loadFont("zai", "assets/fonts/zai_TributeToCaselli'sPantelegraph.ttf");

        this.load.image('background', 'assets/old/background.png');
        this.load.image('enemy', 'assets/old/wizard.png');
        this.load.image('city', 'assets/levels/city_day.png');
        this.load.image('town', 'assets/levels/night_town.png');
        this.load.image('town_red', 'assets/levels/town_red.png');
        this.load.image('graveyard', 'assets/levels/graveyard.png');
        this.load.spritesheet('crystal', 'assets/objectives/crystal.png', {frameWidth:64, frameHeight: 64});
        this.load.spritesheet('crystal_r', 'assets/objectives/red_crystal.png', {frameWidth:64, frameHeight: 64});
        this.load.spritesheet('crystal_r_d', 'assets/objectives/red_crystal_destr.png', {frameWidth:64, frameHeight: 64});
        this.load.spritesheet('demon', 'assets/enemies/demon-idle.png', {frameWidth:160, frameHeight: 144});
        this.load.spritesheet('skull', 'assets/enemies/fire-skull.png', {frameWidth:96, frameHeight: 112});
        this.load.spritesheet('necromancer_i', 'assets/heroes/necro_idle.png', {frameWidth:160, frameHeight: 160});
        this.load.spritesheet('necromancer_a', 'assets/heroes/necro_attack.png', {frameWidth:160, frameHeight: 160});
        this.load.spritesheet('red_fx', 'assets/fx/13_vortex_spritesheet.png', {frameWidth:100, frameHeight: 100});
        this.load.spritesheet('magic', 'assets/fx/6_flamelash_spritesheet.png', {frameWidth:100, frameHeight: 100});
        this.load.spritesheet('fire_fx', 'assets/fx/Rocket Fire 2-Sheet.png', {frameWidth:150, frameHeight: 150});

        // Filter to scale sprites without blur
        this.load.once('complete', () => {
            this.textures.get('city').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('town').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('town_red').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('graveyard').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('crystal').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('crystal_r').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('crystal_r_d').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('demon').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('skull').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('necromancer_i').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('necromancer_a').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('red_fx').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('magic').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('fire_fx').setFilter(Phaser.Textures.FilterMode.NEAREST);
        })
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        //Reset the game for new playthroughs
        this.resetGame();

        // Consts for center some text
        const { width, height } = this.sys.game.config;

        // // Game scene setup // //

        // Render background, center and scale to window size
        const background = this.add.image(0, 0, 'town_red');
        background.setOrigin(0, 0);
        background.displayWidth = width;
        background.displayHeight = height;

        // Demon animation
        this.anims.create({
            key: 'demon-idle',
            frames: this.anims.generateFrameNumbers('demon'),
            frameRate: 8,
            repeat: -1
        });

        // Skull animation
        this.anims.create({
            key: 'skull-idle',
            frames: this.anims.generateFrameNumbers('skull'),
            frameRate: 8,
            repeat: -1
        });


        // Crystal animation
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('crystal_r'),
            frameRate: 8,
            // yoyo: true,
            repeat: -1
        })

        // Crystal animation destroyed
        this.anims.create({
            key: 'crystal-destroyed',
            frames: this.anims.generateFrameNumbers('crystal_r_d'),
            frameRate: 8,
            repeat: 0
        })

        // Necromancer animation idle
        this.anims.create({
            key: 'necro-idle',
            frames: this.anims.generateFrameNumbers('necromancer_i', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        })

        // Necromancer animation attacking
        this.anims.create({
            key: 'necro-attack',
            frames: this.anims.generateFrameNumbers('necromancer_a'),
            frameRate: 16,
            repeat: 0
        })

        // Death animation
        this.anims.create({
            key: 'fire_fx',
            frames: this.anims.generateFrameNumbers('fire_fx'),
            frameRate: 32,
            // yoyo: true,
            repeat: 0
        })

        // Magic animation
        this.anims.create({
            key: 'magic',
            frames: this.anims.generateFrameNumbers('magic'),
            frameRate: 64,
            repeat: 0
        })

        // Necromancer sprite
        this.necromancerHeroe = this.add.sprite(1100, 200, 'necromancer_i');
        this.necromancerHeroe.setScale(3.5);
        this.necromancerHeroe.flipX = true;
        this.necromancerHeroe.play('necro-idle');

        // Crystal sprite
        this.crystal = this.add.sprite(1100, 450, 'crystal_r');
        this.crystal.setScale(4);
        this.crystal.play('idle');

        // Set up enemy group
        this.enemies = this.physics.add.group();

        // Display score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '64px', fontFamily: 'hexenaat', fill: '#fff' });

        // Display current word being typed
        this.wordText = this.add.text(640, 620, '', { fontSize: '32px', fill: '#fff' });
        this.wordText.setOrigin(0.5);

        // Display health bar
        this.healthBar = this.add.rectangle(640, 670, 500, 20, 0x00ff00);
        this.healthBar.setOrigin(0.5);

        // Set up keyboard input
        this.input.keyboard.on('keydown', this.handleKeyPress, this);

        // Timer for spawning enemies - TODO - change this logic to set dificulty levels
        this.time.addEvent({ delay: 2000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    }

    update() {
        if (this.gameOverState) {
            // Don't update game logic in game over state
            return;
        }

        if (this.currentEnemy && !this.currentEnemy.active) {
            this.resetCurrentEnemy();
        }

        // For each enemy, defines his and the word motion
        this.enemies.children.entries.forEach(enemy => {
            enemy.x += enemy.speed;
            enemy.wordContainer.x = enemy.x;

            // Condition to damage player - TODO - change this to collision with crystal
            if (enemy.x > 1260) {
                this.damageStat = enemy.isHard ? 20 : 10; // Change damage output based on type of enemy
                this.damagePlayer(this.damageStat);
                enemy.wordContainer.destroy();
                this.damageFX(enemy.x, enemy.y);
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
            if(enemy.isHard){
                for (let i = 0; i < enemy.word.length; i++) {
                    if (i < this.currentWord.length && this.currentWord[i] === enemy.word[i]) {
                        enemy.wordChars[i].setColor('#00ff00');
                    } else {
                        enemy.wordChars[i].setColor('#ff0000');
                    }
                }
            } else{
                for (let i = 0; i < enemy.word.length; i++) {
                    if (i < this.currentWord.length && this.currentWord[i] === enemy.word[i]) {
                        enemy.wordChars[i].setColor('#00ff00');
                    } else {
                        enemy.wordChars[i].setColor('#fff');
                    }
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
                this.deathFX(enemy.x, enemy.y); // Play FX on enemy kill
                enemy.destroy(); // Destroy enemy from the scene
                this.points = enemy.isHard ? 30 : 10; // Change points gained based on type of enemy
                this.score += this.points;
                this.scoreText.setText('Score: ' + this.score);
                this.currentWord = '';
                this.wordText.setText(this.currentWord);

                // Play the attack animation
                this.playNecromancerAttack();
            }
        });
    }

    playNecromancerAttack() {
        // Stop the idle animation and play the attack animation
        this.necromancerHeroe.stop();
        this.necromancerHeroe.play('necro-attack');

        // After the attack animation completes, return to idle
        this.necromancerHeroe.once('animationcomplete', () => {
            this.necromancerHeroe.stop();
            this.necromancerHeroe.play('necro-idle');
        });
    }

    playCrystalDestruction() {
        // Stop the idle animation and play the destruction animation
        this.crystal.stop();
        this.crystal.play('crystal-destroyed');
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
        const isMiniBoss = Math.random() < 0.3; // 30% chance for a hard enemy
        const enemyType = isMiniBoss ? 'demon' : 'skull';

        // Define new enemy and new word
        const enemy = this.enemies.create(0, Phaser.Math.Between(150, 550), enemyType);
        enemy.flipX = true;
        enemy.setScale(isMiniBoss ? 2 : 0.8);
        enemy.play(enemyType + '-idle');

        // Mini boss has more speed to provide more challenge
        enemy.speed = isMiniBoss ? Phaser.Math.Between(1, 3)/2 : Phaser.Math.Between(1, 2)/2;
        enemy.word = this.getRandomWord(isMiniBoss);
        enemy.isHard = isMiniBoss; // Property to help define different game logic for mini bosses outside the scope of this function

        // Different text style for mini boss
        const textStyle = {
            fontSize: isMiniBoss ? '64px' : '64px',
            fontFamily: 'vt323',
            fill: isMiniBoss ? '#ff0000' : '#fff'
        };

        // Create text objects for each character
        enemy.wordChars = enemy.word.split('').map((char) => {
            return this.add.text(0, 0, char, textStyle);
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

        // Debugging info
        console.log(enemy.isHard);
        console.log(enemy.speed);
        console.log(enemy.word);
    }

    getRandomWord(isMiniBoss = false) {
        const basicWords = ['casa', 'mesa', 'cachorro', 'gato', 'carro', 'flor', 'sol', 'chuva', 'nuvem', 'livro', 'bola', 'porta', 'jardim', 'rio', 'arvore'];
        const hardWords = ['transcendental', 'inconstitucional', 'paralelepipedo', 'contrarrevolucionario', 'psicossomatico', 'democratizacao', 'obnubilado', 'substantivo', 'transcendencia', 'metalinguagem'];

        const words = isMiniBoss ? hardWords : basicWords;
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

    deathFX(enemyX, enemyY) {
        const deathParticle = this.add.sprite(enemyX, enemyY, 'magic').setScale(4);
        deathParticle.play('magic');

        deathParticle.once('animationcomplete', () => {
            deathParticle.destroy();
        });
    }

    damageFX(enemyX, enemyY) {
        const deathParticle = this.add.sprite(enemyX, enemyY, 'fire_fx').setScale(4);
        deathParticle.angle = 90;
        deathParticle.play('fire_fx');

        deathParticle.once('animationcomplete', () => {
            deathParticle.destroy();
        });
    }


    gameOver() {
        this.gameOverState = true;

        // Stop the spawn timer
        this.time.removeAllEvents();

        // Should destroy all enemies and the crystal, but it is not working properly - TODO - fix this
        this.enemies.children.entries.forEach(enemy => {
            enemy.wordContainer.destroy();
        });

        // Play the crystal destruction animation
        this.playCrystalDestruction();

        this.time.delayedCall(2000, () => {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x000000, 0.5);
            graphics.fillRect(0, 0, 1280, 720);

            this.crystal.destroy();
            this.necromancerHeroe.destroy();
            this.add.text(640, 310, 'Game Over', { fontSize: '128px', fontFamily: 'hexenaat', fill: '#ff0000' }).setOrigin(0.5);
            this.add.text(640, 400, 'Final Score: ' + this.score, { fontSize: '64px', fontFamily: 'hexenaat', fill: '#fff' }).setOrigin(0.5);

            const tryAgainButton = this.add.text(640, 480, 'Tentar novamente', { fontSize: '32px', fontFamily: 'hexenaat', fill: '#fff' })
                                    .setOrigin(0.5).setInteractive({useHandCursor: true}).on('pointerdown', () => {
                                        this.scene.restart();
                                        graphics.destroy();
                                    });

            const backMainMenu = this.add.text(640, 530, 'Voltar ao menu', { fontSize: '32px', fontFamily: 'hexenaat', fill: '#fff' })
                                    .setOrigin(0.5).setInteractive({useHandCursor: true}).on('pointerdown', () => {
                                        location.reload(); // GAMBIARRA to reload the page and reset the game
                                    });

            [tryAgainButton, backMainMenu].forEach(button => {
                button.on('pointerover', () => button.setStyle({fill: '#ff0000'}));
                button.on('pointerout', () => button.setStyle({fill: '#fff'}));
            });
        });
    }

    resetGame() {
        if(this.enemies){
            this.enemies.clear(true, true);
        }
        this.enemies = null;
        this.crystal = null;
        this.necromancerHeroe = null;
        this.score = 0;
        this.scoreText = null;
        this.currentWord = '';
        this.wordText = null;
        this.playerHealth = 100;
        this.healthBar = null;
        this.currentEnemy = null;
        this.activeWords = new Set();
        this.gameOverState = false;
    }

     loadFont(name, url) {
        var newFont = new FontFace(name, `url(${url})`);
        newFont.load().then(function (loaded) {
            document.fonts.add(loaded);
        }).catch(function (error) {
            return error;
        });
    }
}