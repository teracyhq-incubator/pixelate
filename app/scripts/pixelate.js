/**
 * pixelate: select part of a canvas to pixelate it.
 *
 * Usage:
 * ------
 *
 * var pixelateInstance = pixelate(canvas, [options])
 *
 * options by default:
 * {
 *   radius: 10,
 *   maskedOnSelect: true
 *
 *   //TODO(hoatle): nice to have:
 *   keyboard: { //keyboard binding
 *    'pixelate': 13 //Enter
 *    'undo': // ctrl + z
 *    'redo': //
 *    'move': 'top right bottom left',
 *    'resize': 'meta+top, meta+right, meta+bottom, meta+left'
 *   }
 * }
 *
 *
 * Public APIs:
 * -----------
 *
 * select(x, y, width, height) //select pixelated area programmingly
 * mask
 * unmask
 * pixelate
 * getOriginalCanvas
 * getCurrentCanvas
 * dispose
 * isMasked
 * getSelectedArea
 *
 * //TODO(hoatle): nice to have for editing history
 * getPrevCanvas
 * getNextCanvas
 * getCanvasList
 *
 * TODO(hoatle): nice to have:
 * move(offsetX, offsetY) //offset from x and y of the selected area
 * resize(direction, value)
 *
 * Event triggers:
 * --------------
 *
 * on('select:start', fn(x, y))
 * on('select:stop', fn(x, y, width, height))
 * on('select:move', fn(SelectedArea))
 * on('select:resize', fn(SelectedArea))
 * on('select:none', fn())
 * on('mask', fn(SelectedArea))
 * on('unmask', fn(SelectedArea))
 * on('pixelate', fn(pixelatedCanvas))
 * on('dispose', fn())
 *
 * @since  2014-04-01
 */

// temporary huge dependency on jQuery, _ and Backbone
// TODO(hoatle): reduce huge dependency
var pixelate = (function(window, $, _, Backbone, undefined) {
  'use strict';

  /**
   * default options to be overridden
   */
  var defaultOptions = {
    radius: 10,
    maskedOnSelect: true
  };

  /**
   * The selectedArea object to be used for event trigger callback argument, this is immutable.
   *
   * @param x the x position on the canvas
   * @param y the y position on the canvas
   * @param width the width on the canvas
   * @param height the height on the canvas
   *
   * @returns {{getX: Function, getY: Function, getWidth: Function, getHeight: Function}}
   */
  var selectedArea = function(x, y, width, height) {
    return {
      getX: function() {
        return x;
      },
      getY: function() {
        return y;
      },
      getWidth: function() {
        return width;
      },
      getHeight: function() {
        return height;
      }
    };
  };


  /**
   * Pixelate constructor
   *
   * @param canvas
   * @param options
   * @constructor
   */
  function Pixelate(canvas, options) {
    this.initialize.apply(this, arguments);
  }

  _.extend(Pixelate, {
    VERSION: '0.1.0-@'
  });

  _.extend(Pixelate.prototype, Backbone.Events, {

    /**
     * Initializes the Pixelate instance.
     *
     * @param canvas required specified Canvas element
     * @param options optional object
     */
    initialize: function(canvas, options) {
      //TODO: implement this
    },

    /**
     * Selects an area for masking, unmasking and pixelating.
     *
     * @param x the x position on the canvas
     * @param y the y position on the canvas
     * @param width the width of the selected area
     * @param height the height of the selected area
     */
    select: function(x, y, width, height) {
      this.trigger('select:start', x, y);
      //TODO: implement this
      this.trigger('select:stop', x, y, width, height);
    },
    /**
     * Gets the selected area
     *
     * @return the selected area
     */
    getSelectedArea: function() {
      return this.selectedArea;
    },
    /**
     * Masks the selected area with pixelation.
     */
    mask: function() {
      //TODO: implement this
      this.trigger('mask', this.getSelectedArea());
    },
    /**
     * Unmasks the selected area, the area becomes transparent to reveal selected original
     * image part.
     */
    unmask: function() {
      //TODO: implement this
      this.trigger('unmask', this.getSelectedArea());
    },
    /**
     * Checks to see if the selected area is masked or not.
     *
     * @return true or false
     */
    isMasked: function() {
      return this.isMasked;
    },
    /**
     * Pixelates the selected area on the canvas
     *
     * @param radius optional radius option, if not specified, global option is used.
     */
    pixelate: function(radius) {
      //TODO: implement this
      this.trigger('pixelate', this.currentCanvas);
    },
    /**
     * Gets the original canvas specified when being initialized.
     */
    getOriginalCanvas: function() {
      //TODO: implement this
      return this.originalCanvas;
    },
    /**
     * Gets the current canvas that could be pixelated or not.
     */
    getCurrentCanvas: function() {
      //TODO: implement this
      return this.currentCanvas;
    },
    /**
     * Unregisters this instance to specified canvas on initialize and dispose this instance.
     * This is useful to enable, disable pixelate functionality on the specified canvas.
     */
    dispose: function() {
      //TODO: implement this
      this.trigger('dispose');
    }

  });

  return function() {
    return new Pixelate(arguments);
  };

})(window, jQuery, _, Backbone);
