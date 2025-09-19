// Placeholder after-sign hook for electron-builder
// Add code signing validation or notarization upload here as needed.
module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;
  console.log(`[after-sign] platform=${electronPlatformName} dir=${appOutDir}`);
};


