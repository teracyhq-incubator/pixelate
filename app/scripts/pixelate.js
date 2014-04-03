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
      w: width,
      h: height,
      isEmpty: function () {
        return (x <= 0 && y <= 0 && width <= 0 && height <= 0);
      },
      isValid: function () {
        return (x !== undefined && y !== undefined && width !== undefined && height !== undefined);
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
      var sa = this.getSelectedArea();
      var pixelatedImgData = this._pixelatedContext.getImageData(sa.x + 1, sa.y + 1, sa.w - 1, sa.h - 1);
      this._currentCanvasContext.putImageData(pixelatedImgData, sa.x, sa.y);
      this.clear();
      this.trigger('pixelate', this.currentCanvas);
      return this;
    },
    /**
     * Rollbacks pixelate functionality on the specified canvas.
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
      var se = this.getSelectedArea();
      this.createSelectedArea(se.x + offsetX, se.y + offsetY, se.w, se.h);
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
      var se = this.getSelectedArea();
      this.clearSelectedArea();
      if (this.isMasked()) {
        this.clearPixelatedSelectedArea();
      }
      this.trigger('select:clear', se);
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
      this._selectorContext.rect(sa.x, sa.y, sa.w, sa.h);
      this._selectorContext.stroke();

      this._selectedArea = sa;
    },
    clearSelectedArea: function () {
      var x = this._selectedArea.x,
          y = this._selectedArea.y,
          width = this._selectedArea.w,
          height = this._selectedArea.h;

      this._selectorContext.clearRect(x - 1, y - 1, width + 2, height + 2);
      this._selectedArea = selectedArea.EMPTY;
    },

    pixelateSelectedArea: function (radius) {
      radius = radius || this.options.radius;

      var sa = this.getSelectedArea();

      if (!sa.isValid() || sa.isEmpty()) {
        return;
      }

      var pixelatedRatio = radius / 100,
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

      //FIXME: Uncaught IndexSizeError: Index or size was negative, or greater than the allowed value.
      sa.x = sa.x + 1 < 0 ? -1 : sa.x;
      sa.y = sa.y + 1 < 0 ? -1 : sa.y;
      sa.w = sa.w - 1 < 0 ? sa.w = 1 : sa.w;
      sa.h = sa.h - 1 < 0 ? sa.h = 1 : sa.h;

      var pixelatedImgData = this._pixelatedContext.getImageData(sa.x + 1, sa.y + 1, sa.w - 1, sa.h - 1);

      this._selectorContext.putImageData(pixelatedImgData, sa.x, sa.y);
    },
    clearPixelatedSelectedArea: function () {
      var x = this._selectedArea.x,
          y = this._selectedArea.y,
          width = this._selectedArea.w,
          height = this._selectedArea.h;

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
      this.pixelateSelectedArea(radius);
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
      var se = this.getSelectedArea();
      this.clearPixelatedSelectedArea();
      this._masked = false;
      this.trigger('unmask', se);
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

    initUISelector: function () {

      this.enabled = true;

      this.storage = {
        mouseOn: '',
        resizeAt: '',
        border: 4
      };

      this.mouse = {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      };

      var t = this,
          holdId = 0,
          choosingSelectArea = false,
          mouseCurrent = '',
          border = this.storage.border,
          mouseOn = this.storage.mouseOn;

      this._selectorCanvas.addEventListener('mousedown', function (e) {
        if (!t.enabled) {
          return;
        }
        mouseCurrent = 'down';
        var sa = t._selectedArea,
            mousePos = t._getMousePos(e);

        // in selected area
        if ((mousePos.x >= sa.x && mousePos.x <= sa.x + sa.w) &&
            (mousePos.y >= sa.y && mousePos.y <= sa.y + sa.h)) {
          choosingSelectArea = true;
        } else {
          choosingSelectArea = false;
          if (t.storage.resizeAt === '') {
            t.clearSelectedArea();
          }
        }

        t._setMouseStart(mousePos);
        t.trigger('select:start', mousePos.x, mousePos.y);
        var holdTime = 100;
        if (t.storage.resizeAt !== '') {
          holdTime = 30;
        }
        holdId = setTimeout(function () {
          mouseCurrent = 'hold';
        }, holdTime);
      });

      this._selectorCanvas.addEventListener('mouseup', function (e) {
        if (!t.enabled) {
          return;
        }

        t.trigger('select:stop', t.mouse.endX, t.mouse.endY,
            t.getSelectedArea());
        mouseCurrent = 'up';
        clearTimeout(holdId);
      });

      var sa, mousePos;

      this._selectorCanvas.addEventListener('mousemove', function (e) {
        if (!t.enabled) {
          return;
        }

        mousePos = t._getMousePos(e);
        sa = t._selectedArea;
        t.handleMouseCurrent();

        if (mouseCurrent === 'hold') {
          t._setMouseEnd(mousePos);
          if (t.storage.resizeAt !== '') {
            t.resizeSelectedArea();
          } else {
            if (!choosingSelectArea) {
              //t.trigger('select', sa.x, sa.y, sa.w, sa.h);
              var x = t.mouse.startX > t.mouse.endX ? t.mouse.endX : t.mouse.startX,
                  y = t.mouse.startY > t.mouse.endY ? t.mouse.endY : t.mouse.startY,
                  width = Math.abs(t.mouse.startX - t.mouse.endX),
                  height= Math.abs(t.mouse.startY - t.mouse.endY);
              t.createSelectedArea(x, y, width, height);
            } else {
              t._moveSelectedArea();
            }
          }
          if (t.isMasked()) {
            t.pixelateSelectedArea(t.options.radius);
          }
        } else {
          if (sa.w != 0) {
            if ((mousePos.x < sa.x + border &&
                mousePos.x > sa.x - border)) {
              if ((mousePos.y < sa.y + border &&
                  mousePos.y > sa.y - border)) {
                mouseOn = 'topLeft';
              } else if ((mousePos.y < sa.y + sa.h + border &&
                  mousePos.y > sa.y + sa.h - border)) {
                mouseOn = 'bottomLeft';
              } else {
                mouseOn = 'left';
              }
            } else if ((mousePos.x < sa.x + sa.w + border &&
                mousePos.x > sa.x + sa.w - border)) {
              if ((mousePos.y < sa.y + border &&
                  mousePos.y > sa.y - border)) {
                mouseOn = 'topRight';
              } else if ((mousePos.y < sa.y + sa.h + border &&
                  mousePos.y > sa.y + sa.h - border)) {
                mouseOn = 'bottomRight';
              } else {
                mouseOn = 'right';
              }
            } else if ((mousePos.y < sa.y + border &&
                mousePos.y > sa.y - border)) {
              mouseOn = 'top';
            } else if ((mousePos.y < sa.y + sa.h + border &&
                mousePos.y > sa.y + sa.h - border)) {
              mouseOn = 'bottom';
            } else if ((mousePos.x > sa.x && mousePos.x < sa.x + sa.w) &&
                (mousePos.y > sa.y && mousePos.y < sa.y + sa.h)) {
              mouseOn = 'center';
            } else {
              mouseOn = '';
            }
            t.storage.mouseOn = mouseOn;
          }
        }
      });
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
        this._selectorCanvas.style.cursor = 'crosshair';
        this.storage.resizeAt = '';
      }
    },
    resizeLeft: function () {
      var sa = this._selectedArea;

      var w = sa.x + sa.w - this.mouse.endX;
      var x = this.mouse.endX;
      if (w <= 0) {
        x = sa.x;
        w = this.mouse.endX - sa.x;
      }
      this.createSelectedArea(x, sa.y, w, sa.h);
    },
    resizeRight: function () {
      var sa = this._selectedArea;

      var w = this.mouse.endX - sa.x;

      if (w <= 0) {
        w = sa.x + sa.w - this.mouse.endX;
      }

      this.createSelectedArea(sa.x, sa.y, w, sa.h);

    },
    resizeTop: function () {
      var sa = this._selectedArea;
      var h = sa.h + sa.y - this.mouse.endY;
      var y = this.mouse.endY;
      if (h <= 0) {
        y = sa.y;
        h = this.mouse.endY - sa.y;
      }
      this.createSelectedArea(sa.x, y, sa.w, h);
    },
    resizeBottom: function () {
      var sa = this._selectedArea;

      var h = this.mouse.endY - sa.y;
      if (h <= 0) {
        h = sa.h + sa.y - this.mouse.endY;
      }

      this.createSelectedArea(sa.x, sa.y, sa.w, h);

    },
    resizeSelectedArea: function () {
      var resizeAt = this.storage.resizeAt;

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
    },
    enable: function () {
      this.enabled = true;
    },
    disable: function () {
      this.enabled = false;
    },
    _moveSelectedArea: function () {
      var x = this.mouse.endX - Math.floor(this._selectedArea.w / 2),
          y = this.mouse.endY - Math.floor(this._selectedArea.h / 2);
      this.createSelectedArea(x, y, this._selectedArea.w, this._selectedArea.h);
      //FIXME: trigger 'move'
    },
    _getMousePos: function (e) {
      var rect = this._selectorCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    },
    _setMouseStart: function (mouse) {
      this.mouse.startX = mouse.x;
      this.mouse.startY = mouse.y;
    },
    _setMouseEnd: function (mouse) {
      this.mouse.endX = mouse.x;
      this.mouse.endY = mouse.y;
    },
    disposeUISelector: function () {

    }
  });

  //export
  window.pixelate = function (canvas, options) {
    return new Pixelate(canvas, options);
  };

})(window, jQuery, _, Backbone);
