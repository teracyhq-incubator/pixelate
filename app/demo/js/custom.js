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
        var self = this;
        Main.mainPixelate = pixelate(canvas, {
          debug: false,
          selector: {
            masked: true,
          }
        });

        Main.mainPixelate
                        .on('select:start', function(x, y) {
                          $('#log-select-start').html('Select started at: (<b>' + x + '</b>, <b>' + y + '</b>)');
                          $('#log-select-clear').html('');
                          $('#log-pixelate').html('');
                          $('#log-mask').html('');
                        })
                        .on('select:stop', function(x, y, selectedArea) {
                          if (selectedArea.isEmpty()) {
                            $('#radius').prop('disabled', true);
                          } else {
                            $('#radius').prop('disabled', false);
                          }
                          $('#log-select-stop').html('Select stopped at: (<b>' + x + '</b>, <b>' + y + '</b>)');
                        })
                        .on('select:clear', function() {
                          $('#log-select-clear').html('Clear selected area');
                          $('#log-select-start').html('');
                          $('#log-select-stop').html('');
                          $('#log-mask').html('');
                          $('#log-unmask').html('');
                          $('#log-pixelate').html('');
                          $('#log-move').html('')
                        })
                        .on('mask', function(radius, selectedArea) {
                          $('#log-unmask').html('');
                          $('#log-mask').html('Mask selected area with radius: <b>' + radius + '</b>')
                        })
                        .on('unmask', function(radius, selectedArea) {
                          $('#log-unmask').html('Unmask selected area');
                          $('#log-mask').html('');
                        })
                        .on('pixelate', function(radius, selectedArea) {
                          $('#log-pixelate').html('Pixelate selected area')
                        })
                        .on('move', function(x, y) {
                          $('#log-move').html('Moved to: (<b>' + x + '</b>, <b>' + y + '</b>)')
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
          '<div id="logs">' +
            '<table class="table table-striped">' +
              '<tr><th>Events</th><th>Logs</th><tr>' +
              '<tr><td>on("select:start", fn(x, y))</td><td id="log-select-start"></td><tr>' +
              '<tr><td>on("select:stop", fn(x, y, selectedArea))</td><td id="log-select-stop"></td><tr>' +
              '<tr><td>on("select:clear", fn(selectedArea))</td><td id="log-select-clear"></td><tr>' +
              '<tr><td>on("mask", fn(radius, selectedArea))</td><td id="log-mask"></td><tr>' +
              '<tr><td>on("unmask", fn(selectedArea))</td><td id="log-unmask"></td><tr>' +
              '<tr><td>on("pixelate", fn(pixelatedCanvas))</td><td id="log-pixelate"></td><tr>' +
              '<tr><td>on("move", fn(offsetX, offsetY))</td><td id="log-move"></td><tr>' +
            '</table>' +
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
        Main.imgSrc = Main.mainPixelate.currentCanvas.toDataURL();
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