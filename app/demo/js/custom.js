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
        Main.mainPixelate = pixelate(canvas, {
          debug: false
        });
        Main.mainPixelate._$selectorCanvas.parent().height(Main.mainPixelate._$selectorCanvas.height());
        $('html, body').animate({
          scrollTop: Main.mainPixelate._$selectorCanvas.parent().offset().top
        })
      },
      createImage: function(imgSrc) {
        if (!defaults.multiImage) {
          $('#upload-images *').remove();
        }
        var w, h, img;
        Main.mainCavas = document.createElement('canvas');
        img = new Image();
        $('#upload-images').append(Main.mainCavas);
        var wrapWidth = $('#upload-images').width()

        img.onload = function() {
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