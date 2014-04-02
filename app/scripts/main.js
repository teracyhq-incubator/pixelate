(function($, pixelate) {
  'use strict';

  $(function() {
    var mainCanvas = document.getElementById('main-canvas'),
        img = new Image();

    img.onload = function() {
      var context = mainCanvas.getContext('2d');
      mainCanvas.width = img.width;
      mainCanvas.height = img.height;
      context.drawImage(img, 0, 0);
      initPixelate();
    };
    img.src = '/assets/darth-vader.jpg';

    function initPixelate() {
      var pxl = window.pxl = pixelate(mainCanvas); //export pxl to test on console

      window.originalCtx = pxl._originalCanvas.getContext('2d');
      window.selectorCtx = pxl._selectorContext;

      pxl.
          on('select:start', function(x, y) {
            console.log('select started at: ' + x + ':' + y);
          }).
          on('select:stop', function(x, y, selectedArea) {
            console.log('select stopped at: ' + x + ':' + y, selectedArea);
          }).
          on('select:clear', function(selectedArea) {
            console.log('select cleared', selectedArea);
          }).
          on('mask', function(radius, selectedArea) {
            console.log('masked with radius: ' + radius + ' and selectedArea: ', selectedArea);
          }).
          on('unmask', function(selectedArea) {
            console.log('unmasked ', selectedArea);
          });


    }
  });

})(jQuery, pixelate);
