/**
 * @fileoverview VisFlow set intersect module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Set}
 */
visflow.Intersect = function(params) {
  visflow.Intersect.base.constructor.call(this, params);
};

visflow.utils.inherit(visflow.Intersect, visflow.Set);

/** @inheritDoc */
visflow.Intersect.prototype.NODE_CLASS = 'intersect';
/** @inheritDoc */
visflow.Intersect.prototype.NODE_NAME = 'Intersect';

/** @inheritDoc */
visflow.Intersect.prototype.process = function() {
  var inpacks = this.ports['in'].packs;
  var outpack = this.ports['out'].pack;

  outpack.copy(new visflow.Package());

  for (var i in inpacks) {
    if (!inpacks[i].isEmpty()) {
      outpack.copy(inpacks[i]);
      break;
    }
  }

  if (outpack.isEmptyData()) {
    // no data to intersect
    return;
  }

  for (var i in inpacks) {
    var inpack = inpacks[i];

    if (!outpack.data.matchDataFormat(inpack.data))
      return visflow.error('cannot make intersection of two different types of datasets');

    for (var index in outpack.items) {
      var item = inpack.items[index];
      if (item != null) {
        // Merge rendering properties.
        _(outpack.items[index].properties).extend(item.properties);
      } else {
        delete outpack.items[index];
      }
    }
  }
};
