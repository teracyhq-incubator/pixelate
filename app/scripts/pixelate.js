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
 * clear() //clear the selected area, deselects
 * mask(radius)
 * unmask()
 * pixelate()
 * move(offsetX, offsetY) //offset from x and y of the selected area
 * originalCanvas
 * currentCanvas
 * dispose()
 * isMasked()
 * getSelectedArea()
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
(function (window, $, _, Backbone, undefined) {
  'use strict';

  /**
   * default options to be overridden
   */
  var defaultOptions = {
    radius: 10,
    selector: {
      masked: true,
      strokeStyle: 'black'
    },
    debug: false
  };

  /**
   * The selectedArea object to be used for event trigger callback argument, this is immutable.
   *
   * @param x the x position on the canvas
   * @param y the y position on the canvas
   * @param width the width on the canvas
   * @param height the height on the canvas
   *
   * @returns {x: number, y: number, width: number, height: number, isEmpty: Function, isValid: Function}
   */
  var selectedArea = function (x, y, width, height) {
    x = x || 0;
    y = y || 0;
    width = width || 0;
    height = height || 0;

    return {
      x: x,
      y: y,
      width: width,
      height: height,
      isEmpty: function () {
        return x === 0 && y === 0 && width === 0 && height === 0;
      },
      isValid: function () {
        return x && x >= 0 && y && y >= 0 && width && width >= 0 && height && height >= 0;
      }
    };
  };

  selectedArea.EMPTY = selectedArea(0, 0, 0, 0);


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

  // main
  _.extend(Pixelate.prototype, Backbone.Events, {

    /**
     * Initializes the Pixelate instance.
     *
     * @param canvas required specified Canvas element
     * @param options optional object
     */
    initialize: function (canvas, options) {
      this.originalCanvas = canvas;
      this._originalCanvasContext = this.originalCanvas.getContext('2d');
      this._$originalCanvas = $(this.originalCanvas);
      this.currentCanvas = canvas;
      this._currentCanvasContext = this.currentCanvas.getContext('2d');
      this.options = _.defaults(options || {}, defaultOptions);

      this.initSelector();
      this.initUISelector();
    },
    /**
     * Pixelates the selected area on the canvas.
     *
     */
    pixelate: function () {
      //TODO: implement this
      this.trigger('pixelate', this.currentCanvas);
      return this;
    },
    /**
     * Unregisters this instance to specified canvas on initialize and dispose this instance.
     * This is useful to enable, disable pixelate functionality on the specified canvas.
     */
    dispose: function () {
      //TODO: implement this
      this.disposeUISelector();
      this.disposeSelector();
      this.trigger('dispose');
      return this;
    }

  });

  //selector
  _.extend(Pixelate.prototype, {
    initSelector: function () {
      this._selectorCanvas = document.createElement('canvas');
      this._$selectorCanvas = $(this._selectorCanvas);
      this._selectorContext = this._selectorCanvas.getContext('2d');

      //sharp lines
      this._selectorContext.translate(0.5, 0.5);
      this._selectorContext.setLineDash = this._selectorContext.setLineDash || function () {
      };

      this._selectorContext.strokeStyle = this.options.selector.strokeStyle;

      this._pixelatedCanvas = document.createElement('canvas');
      this._pixelatedContext = this._pixelatedCanvas.getContext('2d');

      this._pixelatedCanvas.width = this.currentCanvas.width;
      this._pixelatedCanvas.height = this.currentCanvas.height;

      // pixelated, not smoothing
      this._pixelatedContext.mozImageSmoothingEnabled = false;
      this._pixelatedContext.webkitImageSmoothingEnabled = false;
      this._pixelatedContext.imageSmoothingEnabled = false;


      this._masked = this.options.selector.masked;

      //default selectedArea is EMPTY
      this._selectedArea = selectedArea.EMPTY;

      //wrap original canvas to a div with .pixelate-parent
      this._$originalCanvas.addClass('pixelate-src');
      this._$originalCanvas.wrap('<div class="pixelate-parent"></div>');

      this._$selectorCanvas.addClass('pixelate-selector');

      this._selectorCanvas.width = this._$originalCanvas.width();
      this._selectorCanvas.height = this._$originalCanvas.height();

      this._$originalCanvas.after(this._$selectorCanvas);
    },
    /**
     * Disposes this selector (de-init).
     */
    disposeSelector: function () {

    },
    /**
     * Selects an area for masking, unmasking and pixelating.
     *
     * @param x the x position on the canvas
     * @param y the y position on the canvas
     * @param width the width of the selected area
     * @param height the height of the selected area
     */
    select: function (x, y, width, height) {
      x = x || 0;
      y = y || 0;
      width = (this.originalCanvas.width > (x + width)) ? width : this.originalCanvas.width - width;
      height = (this.originalCanvas.height > (y + height)) ? height : this.originalCanvas.height - height;

      this.clear();
      this.trigger('select:start', x, y);

      this.createSelectedArea(x, y, width, height);

      this.trigger('select:stop', (x + width), (y + height), this.getSelectedArea());

      if (this.isMasked()) {
        this.pixelateSelectedArea(this.options.radius);
      }

      return this;

    },
    /**
     * Moves the selected area with offsetX and offsetY
     *
     * @param offsetX
     * @param offsetY
     */
    move: function (offsetX, offsetY) {
      offsetX = offsetX || 0;
      offsetY = offsetY || 0;
      var sltArea = this.getSelectedArea();
      this.createSelectedArea(sltArea.x + offsetX, sltArea.y + offsetY, sltArea.width, sltArea.height);
      if (this.isMasked()) {
        this.pixelateSelectedArea();
      }
      this.trigger('move', offsetX, offsetY);
      return this;
    },
    /**
     * Clears the selected area and its filling if masked.
     *
     * trigger 'select:clear' event with SelectedArea argument.
     */
    clear: function () {
      var sltArea = this.getSelectedArea();
      this.clearSelectedArea();
      if (this.isMasked()) {
        this.clearPixelatedSelectedArea();
      }
      this.trigger('select:clear', sltArea);
      return this;
    },
    createSelectedArea: function (x, y, width, height) {
      var sa = selectedArea(x, y, width, height);
      if (!sa.isValid() && sa.isEmpty()) {
        return;
      }
      this.clearSelectedArea();

      this._selectorContext.beginPath();
      this._selectorContext.setLineDash([5, 2]);
      this._selectorContext.rect(sa.x, sa.y, sa.width, sa.height);
      this._selectorContext.stroke();

      this._selectedArea = sa;
    },
    clearSelectedArea: function () {
      var x = this._selectedArea.x,
          y = this._selectedArea.y,
          width = this._selectedArea.width,
          height = this._selectedArea.height;

      this._selectorContext.clearRect(x - 1, y - 1, width + 2, height + 2);
      this._selectedArea = selectedArea.EMPTY;
    },

    pixelateSelectedArea: function (radius) {
      radius = radius || this.options.radius;

      var sa = this.getSelectedArea(),
          pixelatedRatio = radius / 100,
          currentCanvas = this.currentCanvas,
          pixelatedWidth = currentCanvas.width * pixelatedRatio,
          pixelatedHeight = currentCanvas.height * pixelatedRatio;

      this._pixelatedContext.drawImage(this.currentCanvas, 0, 0, pixelatedWidth, pixelatedHeight);
      this._pixelatedContext.drawImage(this._pixelatedCanvas, 0, 0, pixelatedWidth, pixelatedHeight,
          0, 0, currentCanvas.width, currentCanvas.height);

      if (this.options.debug) {
        //debugging
        var debugCanvas = document.getElementById('debug-canvas'),
            debugCanvasContext = debugCanvas.getContext('2d');

        debugCanvas.width = currentCanvas.width;
        debugCanvas.height = currentCanvas.height;
        debugCanvasContext.drawImage(this._pixelatedCanvas, 0, 0);
      }

      var pixelatedImgData = this._pixelatedContext.getImageData(sa.x + 1, sa.y + 1, sa.width - 1, sa.height - 1);

      this._selectorContext.putImageData(pixelatedImgData, sa.x, sa.y);
    },
    clearPixelatedSelectedArea: function () {
      var x = this._selectedArea.x,
          y = this._selectedArea.y,
          width = this._selectedArea.width,
          height = this._selectedArea.height;

      this._selectorContext.clearRect(x + 1, y + 1, width - 1, height - 1);
    },
    /**
     * Gets the selected area, this is immutable
     *
     * @return the selected area
     */
    getSelectedArea: function () {
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
    mask: function (radius) {
      if (this._masked) {
        return this;
      }
      this.pixelateSelectedArea();
      this._masked = true;
      this.trigger('mask', radius, this.getSelectedArea());
      return this;
    },
    /**
     * Unmasks the selected area, the area becomes transparent to reveal selected original
     * image part.
     */
    unmask: function () {
      if (!this.isMasked()) {
        return this;
      }
      var sltArea = this.getSelectedArea();
      this.clearPixelatedSelectedArea();
      this._masked = false;
      this.trigger('unmask', sltArea);
      return this;
    },
    /**
     * Checks to see if the selected area is masked or not.
     *
     * @return true or false
     */
    isMasked: function () {
      return this._masked;
    }
  });


  //ui selector
  _.extend(Pixelate.prototype, {
    mouse: '',
    pixelateCanvas: '',
    pixelateContext: '',
    selectedArea: 0,
    storage: {
      mouseOn: '',
      resizeAt: '',
      border: 4,
    },
    initUISelector: function () {
      this._selectorContext.mozImageSmoothingEnabled = false;
      this._selectorContext.webkitImageSmoothingEnabled = false;
      this._selectorContext.imageSmoothingEnabled = false;
      this._selectorContext.lineWidth = "1";

      this.mouse = {
        start_x: 0,
        start_y: 0,
        end_x: 0,
        end_y: 0
      };
      var t = this,
          holdId = 0,
          choosingSelectArea = false,
          mouseCurrent = '',
          border = this.storage.border,
          mouseOn = this.storage.mouseOn;

      this._selectorCanvas.addEventListener('mousedown', function (e) {
        mouseCurrent = 'down';
        var ps = t._selectedArea,
            mousePos = t.getMousePos(e);

        // in select area
        if ((mousePos.x >= ps.x && mousePos.x <= ps.x + ps.w) &&
            (mousePos.y >= ps.y && mousePos.y <= ps.y + ps.h)) {
          choosingSelectArea = true;
        } else {
          choosingSelectArea = false;
          if (t.storage.resizeAt == '') {
            t.clearSelectedArea();
          }
        }

        t.setMouseStart(mousePos);
        t.trigger('select:start', mousePos.x, mousePos.y);
        var holdTime = 100;
        if (t.storage.resizeAt != '') {
          holdTime = 30;
        }
        holdId = setTimeout(function () {
          mouseCurrent = 'hold';
        }, holdTime);
      });

      this._selectorCanvas.addEventListener('mouseup', function (e) {
        t.trigger('select:stop', t.mouse.end_x, t.mouse.end_y,
            t._selectedArea);
        t.trigger('select:none');
        mouseCurrent = 'up';
        clearTimeout(holdId);
      });
      var ps, mousePos;
      this._selectorCanvas.addEventListener('mousemove', function (e) {
        mousePos = t.getMousePos(e);
        ps = t._selectedArea;

        if (mouseCurrent == 'hold') {
          t.setMouseEnd(mousePos);
          if (t.storage.resizeAt != '') {
            t.trigger('select:resize', ps);
            t.resizeSelectArea();
          } else {
            if (!choosingSelectArea) {
              t.trigger('select', ps.x, ps.y, ps.w, ps.h);
              t.createSelectArea();
            } else {
              t.trigger('select:move', ps);
              t.moveSelectArea();
            }
          }
          if (t.isMasked()) {
            t.pixelateSelectedArea(t.options.radius);
          }
        } else {
          if (ps.w != 0) {
            t.handleMouseCurrent();
            if ((mousePos.x < ps.x + border &&
                mousePos.x > ps.x - border)) {
              if ((mousePos.y < ps.y + border &&
                  mousePos.y > ps.y - border)) {
                mouseOn = 'topLeft';
              } else if ((mousePos.y < ps.y + ps.h + border &&
                  mousePos.y > ps.y + ps.h - border)) {
                mouseOn = 'bottomLeft';
              } else {
                mouseOn = 'left';
              }
            } else if ((mousePos.x < ps.x + ps.w + border &&
                mousePos.x > ps.x + ps.w - border)) {
              if ((mousePos.y < ps.y + border &&
                  mousePos.y > ps.y - border)) {
                mouseOn = 'topRight';
              } else if ((mousePos.y < ps.y + ps.h + border &&
                  mousePos.y > ps.y + ps.h - border)) {
                mouseOn = 'bottomRight';
              } else {
                mouseOn = 'right';
              }
            } else if ((mousePos.y < ps.y + border &&
                mousePos.y > ps.y - border)) {
              mouseOn = 'top';
            } else if ((mousePos.y < ps.y + ps.h + border &&
                mousePos.y > ps.y + ps.h - border)) {
              mouseOn = 'bottom';
            } else if ((mousePos.x > ps.x && mousePos.x < ps.x + ps.w) &&
                (mousePos.y > ps.y && mousePos.y < ps.y + ps.h)) {
              mouseOn = 'center';
            } else {
              mouseOn = '';
            }
            t.storage.mouseOn = mouseOn;
          }
        }
      });
    },
    updateCanvasSize: function () {
      this._selectorCanvas.width = this._originalCanvas.width;
      this._selectorCanvas.height = this._originalCanvas.height;
    },
    handleMouseCurrent: function () {
      var mouseOn = this.storage.mouseOn;
      this.storage.resizeAt = mouseOn;
      if (mouseOn == 'right' || mouseOn == 'left') {
        this._selectorCanvas.style.cursor = 'ew-resize';
      } else if (mouseOn == 'top' || mouseOn == 'bottom') {
        this._selectorCanvas.style.cursor = 'ns-resize';
      } else if (mouseOn == 'topLeft' || mouseOn == 'bottomRight') {
        this._selectorCanvas.style.cursor = 'nwse-resize';
      } else if (mouseOn == 'topRight' || mouseOn == 'bottomLeft') {
        this._selectorCanvas.style.cursor = 'nesw-resize';
      } else if (mouseOn == 'center') {
        this._selectorCanvas.style.cursor = 'move';
        this.storage.resizeAt = '';
      } else {
        this._selectorCanvas.style.cursor = 'auto';
        this.storage.resizeAt = '';
      }
    },
    resizeLeft: function () {
      var ps = this._selectedArea;

      var w = ps.x + ps.w - this.mouse.end_x;
      var x = this.mouse.end_x;
      if (w <= 0) {
        x = ps.x;
        w = this.mouse.end_x - ps.x;
      }

      this._selectedArea.x = x;
      this._selectedArea.w = w;
    },
    resizeRight: function () {
      var ps = this._selectedArea;

      var w = this.mouse.end_x - ps.x;

      if (w <= 0) {
        w = ps.x + ps.w - this.mouse.end_x;
        this._selectedArea.x = this.mouse.end_x;
      }

      this._selectedArea.w = w;
    },
    resizeTop: function () {
      var ps = this._selectedArea;

      var h = ps.h + ps.y - this.mouse.end_y;
      var y = this.mouse.end_y;
      if (h <= 0) {
        y = ps.y;
        h = this.mouse.end_y - ps.y;
      }

      this._selectedArea.y = y;
      this._selectedArea.h = h;
    },
    resizeBottom: function () {
      var ps = this._selectedArea;

      var h = this.mouse.end_y - ps.y;
      if (h <= 0) {
        h = ps.h + ps.y - this.mouse.end_y;
        this._selectedArea.y = this.mouse.end_y;
      }

      this._selectedArea.h = h;
    },
    resizeSelectArea: function () {
      var resizeAt = this.storage.resizeAt;

      this.clearSelectedArea();

      if (resizeAt == 'bottom') {
        this.resizeBottom();
      } else if (resizeAt == 'left') {
        this.resizeLeft();
      } else if (resizeAt == 'right') {
        this.resizeRight();
      } else if (resizeAt == 'top') {
        this.resizeTop();
      } else if (resizeAt == 'topLeft') {
        this.resizeLeft();
        this.resizeTop();
      } else if (resizeAt == 'bottomLeft') {
        this.resizeLeft();
        this.resizeBottom();
      } else if (resizeAt == 'topRight') {
        this.resizeRight();
        this.resizeTop();
      } else if (resizeAt == 'bottomRight') {
        this.resizeRight();
        this.resizeBottom();
      }

      this.createSelectedArea();
    },
    createSelectArea: function () {
      this.clearSelectedArea();
      this._selectedArea = selectedArea(this.mouse.start_x, this.mouse.start_y,
          this.mouse.end_x - this.mouse.start_x, this.mouse.end_y - this.mouse.start_y);
      this.createSelectedArea();
    },
    moveSelectArea: function () {
      this.clearSelectedArea();
      this._selectedArea.x = this.mouse.end_x - Math.floor(this._selectedArea.w / 2);
      this._selectedArea.y = this.mouse.end_y - Math.floor(this._selectedArea.h / 2);
      this.createSelectedArea();
    },
    getMousePos: function (e) {
      var rect = this._selectorCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    },
    setMouseStart: function (mouse) {
      this.mouse.start_x = mouse.x;
      this.mouse.start_y = mouse.y;
    },
    setMouseEnd: function (mouse) {
      this.mouse.end_x = mouse.x;
      this.mouse.end_y = mouse.y;
    },
    disposeUISelector: function () {
      var canv = document.createElement('canvas');
      var cxt = canv.getContext('2d');
      canv.width = this._originalCanvas.width;
      canv.height = this._originalCanvas.height;

      cxt.drawImage(this._originalCanvas, 0, 0, canv.width, canv.height);
      this._currentCanvas.getContext('2d').drawImage(canv, 0, 0);
      canv.remove();
    }
  });

  //export
  window.pixelate = function (canvas, options) {
    return new Pixelate(canvas, options);
  };

})(window, jQuery, _, Backbone);
