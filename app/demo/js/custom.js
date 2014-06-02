(function($, pixelate) {
  'use strict';
  var defaults = {
    multiImage: false
  }
  $(function() {
    var Main = {
      mainCavas: null,
      mainContext: null,
      mainPixelate: null,
      init: function() {
        var $side = $('.upload-side'),
            $uploadImage = $('#upload-images'),
            $window = $(window);
        $(window).scroll(function(e) {
          if ($window.scrollTop() > $side.offset().top) {
            $uploadImage.addClass('fixed');
          } else {
            $uploadImage.removeClass('fixed');
          }
        });
      },
      pixelateImageFile: function(file) {
        var fileReader;
        fileReader = new FileReader;
        fileReader.onload = (function(_this) {
          return function() {
            Main.createImage(fileReader.result);
          };
        })(this);
        return fileReader.readAsDataURL(file);
      },
      pixelateCanvas: function(canvas) {
        var self = this;
        Main.mainPixelate = pixelate(canvas, {
          debug: false
        });

        Main.mainPixelate
                        .on('select:stop', function(x, y, selectedArea) {
                          if (selectedArea.isEmpty()) {
                            $('#radius').prop('disabled', true);
                          } else {
                            $('#radius').prop('disabled', false);
                          }
                        });

        var selectorCanvas = Main.mainPixelate._$selectorCanvas;
        selectorCanvas.parents('.pixelate-wrap').height(selectorCanvas.height());
        selectorCanvas.parents('.pixelate-wrap').width(selectorCanvas.width());

        $('#radius').change(function() {
          $('#radius-value').html('(' + $(this).val() + ')');
          Main.mainPixelate.options.radius = $(this).val();
          Main.mainPixelate.mask();
        });
        var isFileSaverSupported = false;
        try {
            isFileSaverSupported = !!new Blob;
        } catch (e) {
          
        }
        $('#save').click(function() {
          if (Main.mainPixelate.isMasked()) {
            self.apiPixelate();
            $('#radius').prop('disabled', true);
          }
          if (isFileSaverSupported) {
            Main.mainPixelate.currentCanvas.toBlob(function(blob) {
                saveAs(blob, "pixelated-image.png");
            });
          }
          return false;
        });

        $('html, body').animate({
          scrollTop: selectorCanvas.parent().offset().top
        })
      },
      createImage: function(imgSrc) {
        if (!defaults.multiImage) {
          $('#upload-images *').remove();
        }
        var w, h, img, controls, canvasWrap;
        controls = $('<div><form class="form-horizontal" role="form">' +
          '<div class="form-group">' +
            '<label class="col-sm-3 control-label" for="radius">Radius <b id="radius-value">(10)</b></label>' +
            '<div class="col-sm-9">' +
              '<input disabled="disabled" type="range" min="1" max="100" value="10" class="form-control" id="radius" placeholder="Enter radius number bettwen 1 and 100.">' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<div class="col-sm-offset-3 col-sm-9">' +
              '<a id="save" class="btn btn-default" href="#">Apply &amp; Save</a>' +
            '</div>' +
          '</div>' +
          '</form></div>');
        canvasWrap = $('<div class="pixelate-wrap"></div>');
        Main.mainCavas = document.createElement('canvas');
        img = new Image();
        
        $('#upload-images').append(canvasWrap);
        
        var wrapWidth = $('#upload-images').width()

        img.onload = function() {
          canvasWrap.append(Main.mainCavas, controls);
          Main.mainContext = Main.mainCavas.getContext('2d');
          w = wrapWidth > img.width ? img.width : wrapWidth;
          h = img.height * w/img.width;
          Main.mainCavas.width = w;
          Main.mainCavas.height = h;
          Main.mainContext.drawImage(img, 0, 0, w, h);
          Main.pixelateCanvas(Main.mainCavas);
        };
        img.src = imgSrc;
      },
      usagePixelate: function() {
        Main.createImage('images/ngoc-trinh.png');
      },
      apiSelect: function(x, y, width, height) {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.select(x, y, width, height);
      },
      apiClear: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.clear();
      },
      apiMask: function(radius) {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.mask(radius);
      },
      apiUnmask: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.unmask();
      },
      apiPixelate: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.pixelate();
      },
      apiMove: function(offsetX, offsetY) {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.move(offsetX, offsetY);
      },
      apiDispose: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.dispose();
      }
    }
    Dropzone.options.uploadForm = {
      init: function() {
        this.on("addedfile", function(file) {
          Main.pixelateImageFile(file);
        });
      }
    };
    Main.init();
    window.Main = Main;
  });
})(jQuery, pixelate);