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
                        })
                        .on('select:stop', function(x, y, selectedArea) {
                          $('#logs').html('Select stopped at: (<b>' + x + '</b>, <b>' + y + '</b>)')
                        })
                        .on('select:clear', function() {
                          $('#logs').html('Clear selected area')
                        })
                        .on('mask', function(radius, selectedArea) {
                          $('#logs').html('Mask selected area with radius: <b>' + radius + '</b>')
                        })
                        .on('unmask', function(radius, selectedArea) {
                          $('#logs').html('Unmask selected area')
                        })
                        .on('pixelate', function(radius, selectedArea) {
                          $('#logs').html('Pixelate selected area')
                        })
                        ;

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
          if (isFileSaverSupported) {
            Main.mainPixelate.currentCanvas.toBlob(function(blob) {
                saveAs(blob, "pixelated-image.png");
            });
          }
          return false;
        });
        $('#apply').click(function() {
          if (Main.mainPixelate.isMasked()) {
            self.apiPixelate();
            $('#radius').prop('disabled', true);
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
              '<a id="apply" class="btn btn-primary" href="#">Apply</a>&nbsp;' +
              '<a id="save" class="btn btn-default" href="#">Download</a>' +
            '</div>' +
          '</div>' +
          '</form>' + 
          '<h4>Events Log</h4>' +
          '<div id="logs"></div>' +
          '</div>'
          );
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
        $('#radius-value').html('(' + radius + ')');
        $('#radius').val(radius);
        Main.mainPixelate.options.radius = radius;
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