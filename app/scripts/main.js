(function ($, pixelate) {
    'use strict';

    function pxlImgBySrc(obj) {
        var pxl = pixelate(obj);
        pxl.on('load', function () {
            $('body').append(pxl.$el);
        });
    }

    function pxlImgByObj(obj) {
        pixelate(obj);
    }

    function pxlImgByCanvas(obj) {
        var pxl = window.pxl = pixelate(obj, {
            debug: true
        }); //export pxl to test on console

        window.selectorCtx = pxl._selectorContext;

        pxl.
        on('select:start', function (x, y) {
            console.log('select started at: ' + x + ':' + y);
        }).
        on('select:stop', function (x, y, selectedArea) {
            console.log('select stopped at: ' + x + ':' + y, selectedArea);
        }).
        on('select:clear', function (selectedArea) {
            console.log('select cleared', selectedArea);
        }).
        on('move', function (offsetX, offsetY) {
            console.log('moved ' + offsetX + ':' + offsetY);
        }).
        on('mask', function (radius, selectedArea) {
            console.log('masked with radius: ' + radius + ' and selectedArea: ', selectedArea);
        }).
        on('unmask', function (selectedArea) {
            console.log('unmasked ', selectedArea);
        }).
        on('dispose', function () {
            console.log('disposed');
        }).
        on('enableKeyboard', function() {
            console.log('keyboard:enabled');
        }).
        on('disableKeyboard', function() {
            console.log('keyboard:disabled');
        })
        ;
    }

    $(function () {
        var mainCanvas = document.getElementById('main-canvas'),
            img = new Image();

        img.onload = function () {
            var context = mainCanvas.getContext('2d');
            mainCanvas.width = img.width;
            mainCanvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            pxlImgByCanvas(mainCanvas);
        };
        img.src = '/assets/death-valley-sand-dunes.jpg';

        pxlImgBySrc('/assets/death-valley-sand-dunes.jpg');

        pxlImgByObj($('#img-test'));

    });

})(jQuery, pixelate);
