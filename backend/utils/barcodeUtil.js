const bwipjs = require("bwip-js");

exports.generateBarcodeBase64 = async (code) => {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 10,
    includetext: true
  });
};
