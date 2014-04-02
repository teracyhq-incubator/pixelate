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
 * clear //clear the selected area
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
 * on('select:stop', fn(x, y, selectedArea))
 * on('select:move', fn(selectedArea))
 * on('select:resize', fn(selectedArea))
 * on('select:clear', fn(selectedArea))
 * on('mask', fn(selectedArea))
 * on('unmask', fn(selectedArea))
 * on('pixelate', fn(pixelatedCanvas))
 * on('dispose', fn())
 *
 * @since 2014-04-01
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
    selector: {
      masked: true,
      fillStyle: 'rgba(255, 255, 255, 1)',
      lineWidth: 0.5,
      strokeStyle: 'black'
    }
  };

  /**
   * The selectedArea object to be used for event trigger callback argument, this is immutable.
   *
   * @param x the x position on the canvas
   * @param y the y position on the canvas
   * @param width the width on the canvas
   * @param height the height on the canvas
   *
   * @returns {x: *, y: *, width: *, height: *} object
   */
  var selectedArea = function(x, y, width, height) {
    return {
      x: x,
      y: y,
      width: width,
      height: height
    };
  };


  /**
   * Pixelate constructor
   *
   * @constructor
   */
  function Pixelate() {
    this.initialize.apply(this, arguments);
  }

  _.extend(Pixelate.prototype, {
    VERSION: '0.1.0-@'
  });

  //selector
  _.extend(Pixelate.prototype, {
    initSelector: function() {
      var selectorCanvas = this._selectorCanvas = document.createElement('canvas'),
          $selectorCanvas = this._$selectorCanvas = $(selectorCanvas),
          selectorContext = this._selectorContext = selectorCanvas.getContext('2d');

      if (this.options.selector.masked) {
        this._masked = true;
      }

      // pixelated, not smoothing
      selectorContext.mozImageSmoothingEnabled = false;
      selectorContext.webkitImageSmoothingEnabled = false;
      selectorContext.imageSmoothingEnabled = false;

      selectorContext.fillStyle = this.options.selector.fillStyle;
      selectorContext.lineWidth = this.options.selector.lineWidth;
      selectorContext.strokeStyle = this.options.selector.strokeStyle;

      //default selectedArea is 0, 0, 0, 0
      this._selectedArea = selectedArea(0, 0, 0, 0);

      //wrap original canvas to a div with .pixelate-parent
      this._$originalCanvas.addClass('pixelate-src');
      this._$originalCanvas.wrap('<div class="pixelate-parent"></div>');

      $selectorCanvas.
          addClass('pixelate-selector').
          width(this._$originalCanvas.width()).
          height(this._$originalCanvas.height());

      this._$originalCanvas.after($selectorCanvas);
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

      this.clear();
      this.trigger('select:start', x, y);

      this._selectedArea = selectedArea(x, y, width, height);

      this.trigger('select:stop', (x + width), (y + height), _.clone(this.getSelectedArea()));

      if (this.isMasked()) {
        this.mask();
      }

    },
    /**
     * Clears the selected area.
     *
     * trigger 'select:clear' event with SelectedArea argument.
     */
    clear: function() {
      var selectedArea = this.getSelectedArea();
      //TODO: remove masked selected area
      this.trigger('select:clear', _.clone(selectedArea));
    },
    /**
     * Gets the selected area
     *
     * @return the selected area
     */
    getSelectedArea: function() {
      return this._selectedArea;
    },
    /**
     * Masks the selected area with pixelation.
     */
    mask: function() {
      //TODO: implement this
      this.trigger('mask', _.clone(this.getSelectedArea()));
    },
    /**
     * Unmasks the selected area, the area becomes transparent to reveal selected original
     * image part.
     */
    unmask: function() {
      //TODO: implement this
      this.trigger('unmask', _.clone(this.getSelectedArea()));
    },
    /**
     * Checks to see if the selected area is masked or not.
     *
     * @return true or false
     */
    isMasked: function() {
      return this._masked;
    }
  });

  //ui selector
  _.extend(Pixelate.prototype, {
    initUISelector: function() {

    }
  });

  // main
  _.extend(Pixelate.prototype, Backbone.Events, {

    /**
     * Initializes the Pixelate instance.
     *
     * @param canvas required specified Canvas element
     * @param options optional object
     */
    initialize: function(canvas, options) {
      this._originalCanvas = canvas;
      this._$originalCanvas = $(this._originalCanvas);
      this._currentCanvas = canvas;
      this.options = _.defaults(options || {}, defaultOptions);
      this.initSelector();
      this.initUISelector();
    },
    /**
     * Pixelates the selected area on the canvas
     *
     * @param radius optional radius option, if not specified, global option is used.
     */
    pixelate: function(radius) {
      //TODO: implement this
      this.trigger('pixelate', this.getCurrentCanvas());
    },
    /**
     * Gets the original canvas specified when being initialized.
     */
    getOriginalCanvas: function() {
      return this._originalCanvas;
    },
    /**
     * Gets the current canvas that could be pixelated or not.
     */
    getCurrentCanvas: function() {
      return this._currentCanvas;
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

  return function(canvas, options) {
    return new Pixelate(canvas, options);
  };

})(window, jQuery, _, Backbone);
