/**
 * Game.js
 *
 * @author Nguyen Hoang Duong
 */

/**
 * Class for games.
 *
 * A game is a container for everything that happens inside the game. Players,
 * sprites, objects, etc. and how these interact with each other.
 *
 * A game needs data from an instance of GameData (see GameData.js) to function.
 */
class Game {

	/**
	 * Initiates a new game.
	 *
	 * @param {object} canvas The HTML5 canvas where the game happens
	 * @param {object} data An instance of GameData
	 */
	constructor( canvas, data ) {

		// env is short for environment.
		// Here, the environment is the canvas.
		this.env = {
			width: canvas.width,
			height: canvas.height
		};

		this.data = data;

		this.players = []; // Players in game
		this.pellets = []; // Pellets available for eaten in game
		this.blackHoles = []; // Black holes in the game
		this.eatenPellets = []; // Array of eaten pellets, used to remove pellets from this.pellets
		this.eatenSprites = []; // Same as this.eatenPellets but for sprites
		this.deadBlackHoles = []; // Same as this.eatenSprites but for black holes

		this.framesElapsed = 0; // Number of frames elapsed as the game happens

	}

	/**
	 * Chooses a set of colors for a sprite, randomly.
	 *
	 * Sets of colors are held by the GameData assigned to this Game.
	 *
	 * @param {object} sprite The sprite to choose colors for
	 */
	chooseColorsForSprite( sprite ) {

		let colorSet = shuffle( random( shuffle( this.data.sprites.colors ) ) );
		sprite.fill = color( colorSet[ 0 ] );
		sprite.stroke = color( colorSet[ 1 ] );

	}

	/**
	 * Creates a new sprite using default data from the assigned GameData
	 * and returns the new sprite.
	 */
	createPlayer() {

		// Sprite.constructor( size, fill, stroke, speed, computeStep, shrinkFactor, shrinkDuration )

		let data = this.data.sprites;
		let newSprite = new Sprite(
			data.size,
			null,
			null,
			data.speedFactor,
			data.speed,
			data.shrinkFactor,
			data.shrinkDuration
		);

		this.chooseColorsForSprite( newSprite );

		return newSprite;

	}

	/**
	 * Adds a player to this game.
	 *
	 * @param {object} player An instance of Sprite
	 */
	addPlayer( player ) {

		if ( ! this.players ) this.players = [];

		if ( ! player.fill || ! player.stroke ) {

			this.chooseColorsForSprite( player );

		}

		this.players.push( player );

	}

	/**
	 * Places a player randomly on the canvas.
	 *
	 * @param {object} player The player to place on the canvas
	 */
	placePlayer( player ) {

		player.place(
			round( random( this.env.width ) ),
			round( random( this.env.height ) ),
			this.env.width,
			this.env.height
		);

	}

	/**
	 * Same as placePlayer, but does this for every object inside
	 * this.players.
	 */
	placePlayers() {

		this.players.forEach( ( player ) => {

			this.placePlayer( player );

		}, this );

	}

	/**
	 * Places a number of pellets randomly on the canvas.
	 *
	 * This command should be executed before starting the game.
	 * Once the game has started, use placeNewPellets instead.
	 *
	 * When placing pellets using this method, attributes of the pellets
	 * (size, color, value) are determined using the assigned GameData.
	 *
	 * @param {number} qty The initial quantity of pellets (optional)
	 */
	placePellets( qty = this.data.pellets.initialQuantity ) {

		let size = this.data.pellets.size;
		let value = this.data.pellets.value;
		let _size, _value;

		for ( let i = 0; i < qty; i ++ ) {

			// Size and value can be dynamic (loaded from a function),
			// so we have to determine the types of the inputs.
			_size = ( typeof size !== "function" ) ? size : size();
			_value = ( typeof value !== "function" ) ? value : value( _size );

			let newPellet = new Pellet(
				_size,
				color( random( this.data.pellets.colors ) ),
				_value
			);
			this.pellets.push( newPellet );
			newPellet.place( this.env.width, this.env.height );

		}

	}

	/**
	 * Places new pellets onto the canvas.
	 *
	 * This method is intended to use once the game has begun.
	 * It places pellets for every time interval.
	 *
	 * @param {number} qty The number of new pellets to place (optional)
	 */
	placeNewPellets( qty = this.data.pellets.newQuantity ) {

		if ( this.framesElapsed % this.data.pellets.newPelletsInterval === 0 ) {

			this.placePellets( qty );

		}

	}

	/**
	 * Spawns a new black hole into the game.
	 *
	 * @param {number} interval Length of each interval for spawning of black holes
	 */
	spawnBlackHole( interval ) {

		if ( frameCount % interval === 0 ) {

			let newBlackHole = new BlackHole(
				this.data.blackHoles.size,
				this.data.blackHoles.power,
				this.data.blackHoles.lifeSpan
			);

			this.blackHoles.push( newBlackHole );
			newBlackHole.spawn(
				round( random( this.env.width ) ),
				round( random( this.env.height ) )
			);

		}

	}

	/**
	 * Sets the game ready for running.
	 */
	start() {

		if ( this.players && this.players.length > 0 &&
						this.pellets && this.pellets.length > 0 ) {

			this.started = true;
			this.paused = false;

		} else {

			console.warn( "Please add players and pellets before starting the game." );

		}

	}

	/**
	 * Runs the game.
	 *
	 * Call this method inside your app's animation loop.
	 */
	run() {

		// Don't run if the game has not been started
		// or is currently paused.
		if ( ! this.started || this.paused ) {

			return;

		}

		// Spawn a lil' black holes

		this.spawnBlackHole( this.data.blackHoles.spawnInterval );

		// Control black holes

		this.blackHoles.forEach( ( blackHole ) => {

			blackHole.display();

			this.pellets.forEach( ( pellet ) => {

				if ( this.data.blackHoles.canSuckPellet( blackHole, pellet ) ) {

					blackHole.suckPellet( pellet, this.eatenPellets );

				}

			}, this );

			this.players.forEach( ( player ) => {

				if ( this.data.blackHoles.canSuckSprite( blackHole, player ) ) {

					blackHole.suckSprite( player );
					if ( player.actualSize <= 0 ) {

						this.eatenSprites.push( player );

					}

				}

			}, this );

			if ( BlackHole.isDead( blackHole ) ) {

				this.deadBlackHoles.push( blackHole );

			}

		}, this );

		// Remove dead black holes

		this.deadBlackHoles.forEach( ( blackHole ) => {

			this.blackHoles.splice( this.deadBlackHoles.indexOf( blackHole ), 1 );

		} );

		this.deadBlackHoles = [];

		// Remove eaten pellets (after the black hole has swarmed it)

		this.eatenPellets.forEach( ( pellet ) => {

			this.pellets.splice( this.pellets.indexOf( pellet ), 1 );

		}, this );

		this.eatenPellets = [];

		// Control the sprites according to the pressed keys.

		this.players.forEach( ( player ) => {

			player.control();

		} );

		// Sprites eat pellets

		this.players.forEach( ( player ) => {

			this.pellets.forEach( ( pellet ) => {

				if ( this.data.sprites.canEatPellet( player, pellet ) ) {

					player.eatPellet( pellet, this.eatenPellets );

				}

			}, this );

		}, this );

		// Remove eaten pellets

		this.eatenPellets.forEach( ( pellet ) => {

			this.pellets.splice( this.pellets.indexOf( pellet ), 1 );

		}, this );

		this.eatenPellets = [];

		// Sprites eat sprites

		this.players.forEach( ( player, i ) => {

			this.players.slice( i + 1 ).forEach( ( otherPlayer ) => {

				if ( this.data.sprites.canEatSprite( player, otherPlayer ) ) {

					otherPlayer.value = this.data.sprites.value( otherPlayer.size );
					player.eatOtherSprite( otherPlayer, this.eatenSprites );

				} else if ( this.data.sprites.canEatSprite( otherPlayer, player ) ) {

					player.value = this.data.sprites.value( player.size );
					otherPlayer.eatOtherSprite( player, this.eatenSprites );

				}

			}, this );

		}, this );

		// Remove eaten sprites

		this.eatenSprites.forEach( ( sprite ) => {

			this.players.splice( this.players.indexOf( sprite ), 1 );

		}, this );

		this.eatenSprites = [];

		// Display sprites

		this.players.forEach( ( player ) => {

			player.display();

		} );

		// Display pellets

		this.pellets.forEach( ( pellet ) => {

			pellet.display();

		} );

		// Place new pellets

		this.placeNewPellets();

	}

	/**
	 * Updates this game's framesElapsed attribute.
	 *
	 * @param {number} frameCount Number of frames elapsed since when the game began
	 */
	update( frameCount ) {

		this.framesElapsed = frameCount;

	}

	/**
	 * Pauses this game.
	 *
	 * If this game is already paused, calling this method won't unpause it.
	 * Use continue instead.
	 */
	pause() {

		this.paused = true;

	}

	/**
	 * Continues this game, if it is currently paused.
	 */
	continue() {

		this.paused = false;

	}

}
