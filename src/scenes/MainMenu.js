export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('background', 'assets/old/background.png');
        this.load.image('town', 'assets/levels/night_town.png');

        this.load.once('complete', () => {
            this.textures.get('background').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get('town').setFilter(Phaser.Textures.FilterMode.NEAREST);
        })
    }

    create() {
        const background = this.add.image(0, 0, 'town');
        background.setOrigin(0, 0);
        background.displayWidth = 1280;
        background.displayHeight = 720;

        this.mainTex = this.add.text(640, 150, 'W o r d', { fontSize: '128px', fontFamily: 'hexe', fill: '#fff' }).setOrigin(0.5);
        this.mainTex2 = this.add.text(640, 280, 'S l a s h e r', { fontSize: '128px', fontFamily: 'hexe', fill: '#ff0000' }).setOrigin(0.5);

        const play = this.add.text(640, 530, 'Iniciar o jogo', { fontSize: '64px', fontFamily: 'hexe', fill: '#fff' }).setOrigin(0.5)
                                    .setInteractive({useHandCursor: true}).on('pointerdown', () => {
                                        this.cameras.main.fadeOut(500, 0, 0, 0)
                                        });

        const howToPlay = this.add.text(640, 600, 'Como jogar', { fontSize: '64px', fontFamily: 'hexe', fill: '#fff' })
                                    .setOrigin(0.5).setInteractive({useHandCursor: true}).on('pointerdown', () => {
                                        this.showHowToPlay();
                                    });

        [play, howToPlay].forEach(button => {
                button.on('pointerover', () => button.setStyle({fill: '#ff0000'}));
                button.on('pointerout', () => button.setStyle({fill: '#fff'}));
            });

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
            this.scene.start('GameScene');
        })
    }

    update() {
        this.mainTex.y = 150 + Math.sin(this.time.now / 320) * 8;
        this.mainTex2.y = 280 + Math.sin(this.time.now / 320) * 8;
    }

    showHowToPlay() {
        const howToPlayText = 'Digite as palavras acima dos inimigos para destrui-los.\n'
                            + 'Detenha-os de chegar ao seu cristal!'

        const returnMenuText = 'Pressione qualquer tecla para voltar ao menu';

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.75);
        graphics.fillRect(0, 0, 1280, 720);

        const content = this.add.text(640, 300, howToPlayText, { fontSize: '64px',fontFamily: 'hexe', fill: '#fff', align: 'center' })
            .setOrigin(0.5);

        const returnMenu = this.add.text(640, 450, returnMenuText, { fontSize: '32px', fontFamily: 'hexe', fill: '#fff' })
            .setOrigin(0.5);

        this.input.keyboard.once('keydown', () => {
            graphics.destroy();
            content.destroy();
            returnMenu.destroy();
        });
    }
}