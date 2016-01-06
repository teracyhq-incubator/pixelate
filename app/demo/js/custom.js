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
      imgSrc: null,
      init: function() {
        var $side = $('.upload-side'),
            $uploadImage = $('#upload-images'),
            $window = $(window),
            timeout;
        $(window).scroll(function(e) {
          if ($window.scrollTop() > $side.offset().top) {
            $uploadImage.addClass('fixed');
          } else {
            $uploadImage.removeClass('fixed');
          }
        });

        $(window).resize(function() {
          if (Main.mainPixelate) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
              Main.mainPixelate._$selectorCanvas.parents('.pixelate-wrap').height($(window).height());
              Main.createImage(Main.imgSrc);
            },200);
          }
        });
      },
      pixelateImageFile: function(file) {
        Main.file = file;
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
        var self = this,
            timeout;
        Main.mainPixelate = pixelate(canvas, {
          keyboardEnabled: true,
          debug: false,
          selector: {
            masked: true,
          }
        });
        var logs = $('#logs');
        
        logs.bind("DOMSubtreeModified",function() {
          clearTimeout(timeout);
          timeout = setTimeout(function() {
            logs.scrollTop(logs.prop("scrollHeight"));
          }, 100);
        });
        Main.mainPixelate
                        .on('select:start', function(x, y) {
                          logs.append('Select started at: (<b>' + x + '</b>, <b>' + y + '</b>)<br>');
                        })
                        .on('select:stop', function(x, y, selectedArea) {
                          if (selectedArea.isEmpty()) {
                            $('#radius').prop('disabled', true);
                          } else {
                            $('#radius').prop('disabled', false);
                          }
                          logs.append('Select stopped at: (<b>' + x + '</b>, <b>' + y + '</b>)<br>');
                        })
                        .on('select:clear', function() {
                          logs.append('Clear selected area');
                        })
                        .on('mask', function(radius, selectedArea) {
                          logs.append('Mask selected area with radius: <b>' + radius + '</b><br>');
                        })
                        .on('unmask', function(radius, selectedArea) {
                          logs.append('Unmask selected area<br>');
                        })
                        .on('pixelate', function(radius, selectedArea) {
                          logs.append('Pixelate selected area<br>');
                        })
                        .on('move', function(x, y) {
                          logs.append('Moved to: (<b>' + x + '</b>, <b>' + y + '</b>)<br>')
                        })
                        .on('keyboard:enable', function() {
                          logs.append('keyboard:enabled<br>');
                        })
                        .on('keyboard:enabled', function() {
                          logs.append('keyboard is enabled<br>');
                        })
                        .on('keyboard:disable', function() {
                          logs.append('keyboard:disabled<br>');
                        })
                        .on('keyboard:disabled', function() {
                          logs.append('keyboard is disabled<br>');
                        })
                        ;

        var selectorCanvas = Main.mainPixelate._$selectorCanvas;

        selectorCanvas.parents('.pixelate-wrap').height($(window).height());
        selectorCanvas.parents('.pixelate-parent').height(selectorCanvas.height());
        selectorCanvas.parents('.pixelate-wrap').width(selectorCanvas.width());

        $('#radius').on('input', function() {
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
        $('#upload-images *').remove();
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
          '<div class="col-xs-12" id="logs">' +

          '</div>' +
          '</div>'
          );
        canvasWrap = $('<div class="pixelate-wrap"></div>');
        Main.mainCavas = document.createElement('canvas');
        img = new Image();
        
        $('#upload-images').append(canvasWrap);
        
        var wrapWidth = $('.upload-side').width()

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
        Main.imgSrc = imgSrc;
      },
      usagePixelate: function() {
        Main.createImage('images/girl-and-dog.jpg');
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
        Main.imgSrc = Main.mainPixelate.currentCanvas.toDataURL();
      },
      apiMove: function(offsetX, offsetY) {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.move(offsetX, offsetY);
      },
      apiDispose: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.dispose();
      },
      apiEnableKeyboard: function() {
        if (!Main.mainPixelate) return;
        Main.mainPixelate.enableKeyboard();
      },
      apiDisableKeyboard: function() {
          if (!Main.mainPixelate) return;
          Main.mainPixelate.disableKeyboard();
        }
      };  
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