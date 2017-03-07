var MEDLEY = MEDLEY || {};

function onStlLoaded(object) {
    object.eventHandlers = [];

    var paintInput = new MEDLEY.PaintInput(XAC.scene);
    object.eventHandlers.push(paintInput);
    paintInput.addSubscriber(MEDLEY.initPlacementWithPainting);

    // XAC.inputTechniques[object] = new MEDLEY.PaintInput(XAC.scene);

    if(object.geometry.isBufferGeometry) {
        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        log('buffergeometry converted.')
    }

    object.geometry.computeFaceNormals();
    object.geometry.computeVertexNormals();
}
