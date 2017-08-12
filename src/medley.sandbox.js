var MEDLEY = MEDLEY || {};

var _fitInfo;

XAC._tempElements = [];


// for testing functions
$(document).ready(function () {
    // XAC.on('1', function () {
    //     MEDLEY._matobjSelected.dim = 1;
    // });
    // XAC.on('2', function () {
    //     MEDLEY._matobjSelected.dim = 2;
    // });
    // XAC.on('3', function () {
    //     MEDLEY._matobjSelected.dim = 3;
    // });

    XAC.on('C', function () {
        for (object of XAC._selecteds) {
            if (object.embeddable != undefined && !object.embeddable._removed) {
                for (e of object.embeddable._eventCache) {
                    // MEDLEY.paintInput._doPaint(e);
                    if (e == object.embeddable._eventCache[0]) {
                        XAC.mousedown(e);
                    } else if (e == object.embeddable._eventCache.last()) {
                        XAC.mouseup(e);
                    } else {
                        XAC.mousemove(e);
                    }
                }
            }
        }
    });

    XAC.on('M', function () {
        var embeddableMeshes = [];
        var mergedEmbeddable;
        for (object of  XAC._selecteds) {
            if (object.embeddable != undefined && !object.embeddable._removed) {
                if (mergedEmbeddable == undefined) mergedEmbeddable = object.embeddable;
                else object.embeddable.selfDestroy();
                embeddableMeshes.push(object.embeddable._mesh);
            }
        }

        time();
        mergedEmbeddable._mesh = XAC.union(embeddableMeshes);
        time('finished unioning');
        // for (emb of embeddables) {
        //     mergedEmbeddable._meshes.add(emb._meshes);
        //     MEDLEY.everything.remove(emb._meshes);
        // }
    });

});