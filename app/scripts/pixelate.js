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
 * clear //clear the selected area, deselects
 * mask
 * unmask
 * pixelate
 * move(offsetX, offsetY) //offset from x and y of the selected area
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
 * on('mask', fn(radius, selectedArea))
 * on('unmask', fn(selectedArea))
 * on('pixelate', fn(pixelatedCanvas))
 * on('move', fn(offsetX, offsetY))
 * on('dispose', fn())
 *
 * @since 2014-04-01
 */

// temporary huge dependency on jQuery, _ and Backbone
// TODO(hoatle): reduce huge dependency
(function(window, $, _, Backbone, undefined) {
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

      this._masked = this.options.selector.masked;

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

      selectorCanvas.width = this._$originalCanvas.width();
      selectorCanvas.height = this._$originalCanvas.height();

      this._$originalCanvas.after($selectorCanvas);
    },
    /**
     * Disposes this selector (de-init).
     */
    disposeSelector: function() {

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
      x = x || 0;
      y = y || 0;
      width = (this._originalCanvas.width > (x + width)) ? width : this._originalCanvas.width - width;
      height = (this._originalCanvas.height > (y + height)) ? height : this._originalCanvas.height - height;

      this.clear();
      this.trigger('select:start', x, y);

      this._selectedArea = selectedArea(x, y, width, height);

      this.trigger('select:stop', (x + width), (y + height), this.getSelectedArea());

      if (this.isMasked()) {
        this.mask(this.options.radius);
      }

      return this;

    },
    /**
     * Moves the selected area with offsetX and offsetY
     *
     * @param offsetX
     * @param offsetY
     */
    move: function(offsetX, offsetY) {
      offsetX = offsetX || 0;
      offsetY = offsetY || 0;
      var sltArea = this.getSelectedArea();
      this.select(sltArea.x + offsetX, sltArea.y + offsetY, sltArea.width, sltArea.height);
      this.trigger('move', offsetX, offsetY);
      return this;
    },
    /**
     * Clears the selected area.
     *
     * trigger 'select:clear' event with SelectedArea argument.
     */
    clear: function() {
      var sltArea = this.getSelectedArea();
      this._selectorContext.clearRect(sltArea.x, sltArea.y, sltArea.width, sltArea.height);
      this._selectedArea = selectedArea(0, 0, 0, 0);
      this.trigger('select:clear', _.clone(sltArea));
      return this;
    },
    /**
     * Gets the selected area, this is immutable
     *
     * @return the selected area
     */
    getSelectedArea: function() {
      return _.clone(this._selectedArea);
    },
    /**
     * Masks the selected area with pixelation.
     *
     * - Creates pixelated canvas from current canvas
     * - Extracts pixelated portion specified by selectedArea
     * - Puts that extracted image data to selector canvas
     *
     * @param radius optional radius option, if not specified, global option is used.
     */
    mask: function(radius) {
      radius = radius || this.options.radius;
      //TODO(hoatle): reuse pixelatedCavas
      var pixelatedCanvas = document.createElement('canvas'),
          pixelatedContext = pixelatedCanvas.getContext('2d'),
          sltArea = this.getSelectedArea(),
          pixelatedRatio = radius / 100,
          currentCanvas = this.getCurrentCanvas(),
          pixelatedWidth = currentCanvas.width * pixelatedRatio,
          pixelatedHeight = currentCanvas.height * pixelatedRatio;

      pixelatedCanvas.width = currentCanvas.width;
      pixelatedCanvas.height = currentCanvas.height;

      // pixelated, not smoothing
      pixelatedContext.mozImageSmoothingEnabled = false;
      pixelatedContext.webkitImageSmoothingEnabled = false;
      pixelatedContext.imageSmoothingEnabled = false;

      pixelatedContext.drawImage(this.getCurrentCanvas(), 0, 0, pixelatedWidth, pixelatedHeight);
      pixelatedContext.drawImage(pixelatedCanvas, 0, 0, pixelatedWidth, pixelatedHeight,
          0, 0, currentCanvas.width, currentCanvas.height);

      //debugging
      var debugCanvas = document.getElementById('debug-canvas'),
          debugCanvasContext = debugCanvas.getContext('2d');

      debugCanvas.width = currentCanvas.width;
      debugCanvas.height = currentCanvas.height;
      debugCanvasContext.drawImage(pixelatedCanvas, 0, 0);


      var pixelatedImgData = pixelatedContext.getImageData(sltArea.x, sltArea.y, sltArea.width, sltArea.height);

      this._selectorContext.putImageData(pixelatedImgData, sltArea.x, sltArea.y);
      this._masked = true;
      this.trigger('mask', radius, sltArea);
      return this;
    },
    /**
     * Unmasks the selected area, the area becomes transparent to reveal selected original
     * image part.
     */
    unmask: function() {
      var sltArea = this.getSelectedArea();
      this._selectorContext.clearRect(sltArea.x, sltArea.y, sltArea.width, sltArea.height);
      this._masked = false;
      this.trigger('unmask', sltArea);
      return this;
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

    },
    disposeUISelector: function() {

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
     * Pixelates the selected area on the canvas.
     *
     */
    pixelate: function() {
      //TODO: implement this
      this.trigger('pixelate', this.getCurrentCanvas());
      return this;
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
     * Gets current canvas context.
     *
     * @returns {Object|CanvasRenderingContext2D}
     */
    getCurrentCanvasContext: function() {
      return this.getCurrentCanvas().getContext('2d');
    },
    /**
     * Unregisters this instance to specified canvas on initialize and dispose this instance.
     * This is useful to enable, disable pixelate functionality on the specified canvas.
     */
    dispose: function() {
      //TODO: implement this
      this.disposeUISelector();
      this.disposeSelector();
      this.trigger('dispose');
      return this;
    }

  });

  //export
  window.pixelate = function(canvas, options) {
    return new Pixelate(canvas, options);
  };

})(window, jQuery, _, Backbone);
